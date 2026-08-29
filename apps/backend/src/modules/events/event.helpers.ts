import { CircuitBreaker, CircuitOpenError } from "../../utils/circuit-breaker";

function generateEventCode(length = 6): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const aiServiceCircuitBreaker = new CircuitBreaker("ai-service-http", {
  failureThreshold: 5,
  recoveryTimeoutMs: 30_000,
  halfOpenMaxAttempts: 1,
});

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  timeoutPerAttemptMs = 8000,
  totalTimeoutMs = 20000,
): Promise<Response> {
  let lastError: Error | null = null;
  const startTime = Date.now();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (attempt > 1 && Date.now() - startTime >= totalTimeoutMs) {
      break;
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(timeoutPerAttemptMs),
      });

      if (response.ok) return response;

      if (response.status < 500) {
        return response;
      }

      lastError = new Error(`AI service responded with ${response.status}`);
    } catch (error) {
      lastError = error as Error;
    }

    if (attempt < maxRetries) {
      // Full Jitter: sleep = random(0, base * 2^attempt)
      const maxSleep = 1000 * Math.pow(2, attempt);
      const sleepMs = Math.min(Math.random() * maxSleep, 5000);
      await new Promise((resolve) => setTimeout(resolve, sleepMs));
    }
  }

  throw lastError ?? new Error("Face search failed after retries");
}

async function fetchFromAIService(
  url: string,
  options: RequestInit,
): Promise<Response> {
  return aiServiceCircuitBreaker.execute(() => fetchWithRetry(url, options));
}

export {
  generateEventCode,
  fetchWithRetry,
  fetchFromAIService,
  aiServiceCircuitBreaker,
};
