package com.bankingfraud.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Clock;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final long WINDOW_MILLIS = 60_000L;

    private final Map<String, RequestWindow> requestWindows = new ConcurrentHashMap<>();
    private final Clock clock = Clock.systemUTC();
    private final int authLimit;
    private final int importLimit;
    private final int copilotLimit;

    public RateLimitingFilter(
            @Value("${app.rate-limit.auth-per-minute:12}") int authLimit,
            @Value("${app.rate-limit.import-per-minute:3}") int importLimit,
            @Value("${app.rate-limit.copilot-per-minute:30}") int copilotLimit) {
        this.authLimit = authLimit;
        this.importLimit = importLimit;
        this.copilotLimit = copilotLimit;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getServletPath();
        return !path.startsWith("/api/auth/")
                && !path.startsWith("/api/import/")
                && !path.startsWith("/api/copilot/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String path = request.getServletPath();
        int limit = resolveLimit(path);
        String key = resolveClientKey(request) + ":" + resolveBucket(path);
        long now = clock.millis();

        RequestWindow window = requestWindows.computeIfAbsent(
                key,
                ignored -> new RequestWindow(now)
        );

        if (!window.tryConsume(now, limit)) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("""
                    {"error":"Too many requests. Please wait and try again."}
                    """);
            return;
        }

        cleanupExpiredWindows(now);
        filterChain.doFilter(request, response);
    }

    private int resolveLimit(String path) {
        if (path.startsWith("/api/import/")) {
            return importLimit;
        }

        if (path.startsWith("/api/copilot/")) {
            return copilotLimit;
        }

        return authLimit;
    }

    private String resolveBucket(String path) {
        if (path.startsWith("/api/import/")) {
            return "import";
        }

        if (path.startsWith("/api/copilot/")) {
            return "copilot";
        }

        return "auth";
    }

    private String resolveClientKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }

    private void cleanupExpiredWindows(long now) {
        if (requestWindows.size() < 1_000) {
            return;
        }

        requestWindows.entrySet().removeIf(
                entry -> now - entry.getValue().windowStartedAt > WINDOW_MILLIS
        );
    }

    private static class RequestWindow {
        private long windowStartedAt;
        private int requestCount;

        private RequestWindow(long windowStartedAt) {
            this.windowStartedAt = windowStartedAt;
        }

        private synchronized boolean tryConsume(long now, int limit) {
            if (now - windowStartedAt >= WINDOW_MILLIS) {
                windowStartedAt = now;
                requestCount = 0;
            }

            if (requestCount >= limit) {
                return false;
            }

            requestCount++;
            return true;
        }
    }
}
