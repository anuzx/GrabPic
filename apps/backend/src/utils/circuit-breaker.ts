export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

export class CircuitOpenError extends Error {
  constructor(
    public readonly circuitName: string,
    public readonly retryAfterMs: number,
  ) {
    super(`Circuit "${circuitName}" is OPEN. Retry after ${retryAfterMs}ms.`);
    this.name = "CircuitOpenError";
  }
}

interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeoutMs: number;
  halfOpenMaxAttempts?: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private consecutiveFailures = 0;
  private lastFailureTime = 0;
  private halfOpenAttempts = 0;
  private readonly name: string;
  private readonly failureThreshold: number;
  private readonly recoveryTimeoutMs: number;
  private readonly halfOpenMaxAttempts: number;

  constructor(name: string, options: CircuitBreakerOptions) {
    this.name = name;
    this.failureThreshold = options.failureThreshold;
    this.recoveryTimeoutMs = options.recoveryTimeoutMs;
    this.halfOpenMaxAttempts = options.halfOpenMaxAttempts ?? 1;
  }

  getState(): CircuitState {
    if (this.state === CircuitState.OPEN) {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.recoveryTimeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenAttempts = 0;
      }
    }

    return this.state;
  }

  private recordSuccess(): void {
    this.consecutiveFailures = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
    }
  }

  private recordFailure(): void {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      return;
    }

    if (this.consecutiveFailures >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  private shouldReject(): boolean {
    const currentState = this.getState();

    if (currentState === CircuitState.CLOSED) {
      return false;
    }

    if (currentState === CircuitState.OPEN) {
      return true;
    }

    // HALF_OPEN: allow limited probe requests
    if (this.halfOpenAttempts >= this.halfOpenMaxAttempts) {
      return true;
    }
    this.halfOpenAttempts++;
    return false;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.shouldReject()) {
      const elapsed = Date.now() - this.lastFailureTime;
      const retryAfterMs = Math.max(0, this.recoveryTimeoutMs - elapsed);
      throw new CircuitOpenError(this.name, retryAfterMs);
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  getStats(): {
    state: CircuitState;
    consecutiveFailures: number;
    lastFailureTime: number;
  } {
    return {
      state: this.getState(),
      consecutiveFailures: this.consecutiveFailures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}
