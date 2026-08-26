package org.bootforce.aipoweredcareermentor.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;


@Slf4j
@Service
public class RateLimiter {

    private static final class TokenBucket {
        private double tokens;
        private long lastRefillTime;
        private final double maxTokens;
        private final double refillRate;

        TokenBucket(double maxTokens, double refillRate) {
            this.maxTokens = maxTokens;
            this.refillRate = refillRate;
            this.tokens = maxTokens;
            this.lastRefillTime = System.currentTimeMillis();
        }

        synchronized boolean tryConsume(int tokenCount) {
            refillTokens();
            if (tokens >= tokenCount) {
                tokens -= tokenCount;
                return true;
            }
            return false;
        }

        synchronized int availableTokens() {
            refillTokens();
            return (int) tokens;
        }

        private void refillTokens() {
            long now = System.currentTimeMillis();
            long timePassed = now - lastRefillTime;
            double tokensToAdd = (timePassed / 60000.0) * refillRate;
            tokens = Math.min(maxTokens, tokens + tokensToAdd);
            lastRefillTime = now;
        }
    }

    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    public void initializeProvider(String providerName, int requestsPerMinute) {
        buckets.computeIfAbsent(providerName,
                key -> new TokenBucket(requestsPerMinute, requestsPerMinute));
        log.info("Rate limiter initialized for '{}': {} req/min", providerName, requestsPerMinute);
    }

    public boolean allowRequest(String providerName) {
        TokenBucket bucket = buckets.get(providerName);
        if (bucket == null) {
            log.warn("Provider '{}' not initialized in rate limiter, allowing request", providerName);
            return true;
        }
        return bucket.tryConsume(1);
    }

    public int getAvailableTokens(String providerName) {
        TokenBucket bucket = buckets.get(providerName);
        return bucket == null ? 0 : bucket.availableTokens();
    }

    public void waitUntilAllowed(String providerName) throws InterruptedException {
        TokenBucket bucket = buckets.get(providerName);
        if (bucket == null) return;
        while (!bucket.tryConsume(1)) {
            Thread.sleep(1000);
        }
    }

    public long getWaitTimeMillis(String providerName) {
        TokenBucket bucket = buckets.get(providerName);
        if (bucket == null) return 0;
        if (bucket.availableTokens() > 0) return 0;
        return (long) (60000.0 / bucket.refillRate);
    }

    public void resetProvider(String providerName) {
        TokenBucket bucket = buckets.get(providerName);
        if (bucket != null) {
            bucket.tokens = bucket.maxTokens;
            bucket.lastRefillTime = System.currentTimeMillis();
            log.info("Rate limiter reset for provider: {}", providerName);
        }
    }

    public Map<String, Map<String, Object>> getStatus() {
        Map<String, Map<String, Object>> status = new HashMap<>();
        for (var entry : buckets.entrySet()) {
            Map<String, Object> info = new HashMap<>();
            info.put("availableTokens", entry.getValue().availableTokens());
            info.put("maxTokens", (int) entry.getValue().maxTokens);
            info.put("refillRatePerMinute", entry.getValue().refillRate);
            status.put(entry.getKey(), info);
        }
        return status;
    }
}
