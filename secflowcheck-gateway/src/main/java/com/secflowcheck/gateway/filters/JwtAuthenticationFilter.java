package com.secflowcheck.gateway.filters;

import io.jsonwebtoken.*;
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

import java.nio.charset.StandardCharsets;
import java.util.Base64;
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
        // read secret from environment for simplicity
        String secret = System.getenv("JWT_SECRET");
        if (secret == null || secret.isBlank()) {
            logger.warn(
                    "JWT_SECRET not set. Gateway will still run but token validation will fail unless JWT_SECRET is provided.");
            secret = "";
        }
        // ensure bytes safe for JJWT
        this.jwtSecret = secret;
    }

    private boolean isExcluded(String path) {
        for (String pattern : EXCLUDED_PATHS) {
            if (pathMatcher.match(pattern, path))
                return true;
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
                logger.warn("Empty JWT_SECRET; rejecting token");
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
            Jws<Claims> claims = Jwts.parserBuilder()
                    .setSigningKey(keyBytes)
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
