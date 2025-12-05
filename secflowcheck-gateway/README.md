# SecFlowCheck — API Gateway (Spring Cloud Gateway)

This project is the API Gateway for the SecFlowCheck microservices ecosystem.
It uses Spring Cloud Gateway and Eureka service discovery. A simple JWT validation
GlobalFilter is included to protect downstream services.

## Features
- Service discovery-based routing (Eureka)
- Global JWT validation (HS256) using `JWT_SECRET` env var
- Example routes for parser, analyzer, report, auth services
- Forwards `X-Auth-User` header containing token subject to downstream services

## Build & Run (local)
Prerequisites:
- Java 17
- Maven
- (Optional) Docker & docker-compose
- Eureka server running and reachable (default `http://discovery:8761/eureka/`)

Build:
```bash
mvn clean package
