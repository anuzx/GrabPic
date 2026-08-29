-- Atomic token bucket rate limiter
-- KEYS[1] = bucket key
-- ARGV[1] = cost (tokens to consume)
-- ARGV[2] = max_tokens
-- ARGV[3] = refill_interval_ms
-- ARGV[4] = refill_rate
-- ARGV[5] = now (current timestamp in ms)

local key = KEYS[1]
local cost = tonumber(ARGV[1])
local max_tokens = tonumber(ARGV[2])
local refill_interval_ms = tonumber(ARGV[3])
local refill_rate = tonumber(ARGV[4])
local now = tonumber(ARGV[5])

local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
local tokens = tonumber(data[1])
local last_refill = tonumber(data[2])

if tokens == nil then
  tokens = max_tokens
  last_refill = now
end

-- refill tokens based on elapsed time
local elapsed = now - last_refill
if elapsed > 0 then
  local refill_amount = math.floor(elapsed / refill_interval_ms) * refill_rate
  if refill_amount > 0 then
    tokens = math.min(max_tokens, tokens + refill_amount)
    last_refill = now
  end
end

-- check if enough tokens
if tokens < cost then
  local wait_ms = last_refill + refill_interval_ms - now
  if wait_ms < 1 then wait_ms = 1 end
  return {0, wait_ms}
end

-- deduct tokens atomically
tokens = tokens - cost
redis.call('HMSET', key, 'tokens', tostring(tokens), 'lastRefill', tostring(last_refill))
redis.call('EXPIRE', key, math.ceil(refill_interval_ms * max_tokens / 1000) + 1)
return {1, 0}
