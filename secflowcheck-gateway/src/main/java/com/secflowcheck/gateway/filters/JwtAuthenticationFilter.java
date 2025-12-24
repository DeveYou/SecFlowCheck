package com.secflowcheck.gateway.filters;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;

@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final AntPathMatcher pathMatcher = new AntPathMatcher();
    private static final Set<String> EXCLUDED_PATHS = new HashSet<>();

    static {
        // Public / unauthenticated endpoints (gateway-level)
        EXCLUDED_PATHS.add("/auth/**");
        EXCLUDED_PATHS.add("/open/**");
        EXCLUDED_PATHS.add("/health");
        EXCLUDED_PATHS.add("/actuator/**");
        // Eureka & metadata endpoints used by clients to register/fetch
        EXCLUDED_PATHS.add("/eureka/**");
        EXCLUDED_PATHS.add("/eureka/apps/**");
    }

    private final String jwtSecret;

    public JwtAuthenticationFilter() {
        // Use SECRET_KEY to match Python Auth Service
        String secret = System.getenv("SECRET_KEY");
        if (secret == null || secret.isBlank()) {
            logger.warn(
                    "SECRET_KEY not set. Gateway will still run but token validation will fail unless SECRET_KEY is provided.");
            secret = "";
        }
        this.jwtSecret = secret;
    }

    private boolean isExcluded(String path) {
        if (path == null) {
            return false;
        }
        for (String pattern : EXCLUDED_PATHS) {
            if (pattern != null && pathMatcher.match(pattern, path)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange,
            org.springframework.cloud.gateway.filter.GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        if (isExcluded(path)) {
            return chain.filter(exchange);
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.toLowerCase().startsWith("bearer ")) {
            logger.debug("Missing Authorization header for request to {}", path);
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7).trim();
        try {
            // Validate token using JJWT
            if (jwtSecret.isBlank()) {
                logger.warn("Empty SECRET_KEY; rejecting token");
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            // Use Keys.hmacShaKeyFor() for proper HMAC key handling (JJWT 0.11+)
            byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
            SecretKey key = Keys.hmacShaKeyFor(keyBytes);

            Jws<Claims> claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);

            // Optionally attach user details into headers forwarded to downstream services
            String subject = claims.getBody().getSubject();
            if (subject != null && !subject.isBlank()) {
                ServerHttpRequest mutated = request.mutate()
                        .header("X-Auth-User", subject)
                        .build();
                return chain.filter(exchange.mutate().request(mutated).build());
            }

            return chain.filter(exchange);
        } catch (ExpiredJwtException ex) {
            logger.debug("Expired token: {}", ex.getMessage());
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        } catch (io.jsonwebtoken.security.WeakKeyException ex) {
            logger.error("SECRET_KEY is too weak. HS256 requires at least 32 bytes: {}", ex.getMessage());
            exchange.getResponse().setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
            return exchange.getResponse().setComplete();
        } catch (JwtException ex) {
            logger.debug("Invalid token: {}", ex.getMessage());
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        } catch (Exception ex) {
            logger.error("Unexpected JWT validation error", ex);
            exchange.getResponse().setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
            return exchange.getResponse().setComplete();
        }
    }

    @Override
    public int getOrder() {
        // run early
        return -100;
    }
}
