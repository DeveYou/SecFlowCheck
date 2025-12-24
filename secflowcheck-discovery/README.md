# SecFlowCheck Discovery Service

A Netflix Eureka-based service discovery server that enables microservices to register, discover, and communicate with each other in the SecFlowCheck architecture.

## Overview

The Discovery Service is responsible for:
- Service registration and health monitoring
- Service discovery and lookup
- Load balancing support
- Microservice coordination
- Dynamic service scaling support
- Health check monitoring

## Features

- 🔍 **Service Registry**: Central registry for all microservices
- 💓 **Health Monitoring**: Continuous health checks of registered services
- 🔄 **Auto-Discovery**: Automatic service discovery without hardcoded URLs
- 📊 **Dashboard**: Web UI for monitoring registered services
- ⚖️ **Load Balancing**: Client-side load balancing support
- 🚀 **High Availability**: Support for multiple Eureka instances

## Architecture

### Eureka Server

```mermaid
graph TD
    Discovery[Eureka Discovery<br/>Port 8761]
    Auth[Auth Service]
    Gateway[API Gateway]
    Parser[Parser Service]
    Analyzer[Analyzer Service]
    Report[Report Service]
    
    Auth -->|Register| Discovery
    Gateway -->|Register| Discovery
    Parser -->|Register| Discovery
    Analyzer -->|Register| Discovery
    Report -->|Register| Discovery
    
    Gateway -->|Discover| Discovery
    Analyzer -->|Discover| Discovery
```

## Installation

### Prerequisites

- Java 17+
- Maven 3.6+
- Port 8761 available

### Local Development

1. **Navigate to the service directory:**
   ```bash
   cd secflowcheck-discovery
   ```

2. **Configure application properties:**
   
   Edit `src/main/resources/application.yml`:
   ```yaml
   server:
     port: 8761

   spring:
     application:
       name: discovery-service

   eureka:
     instance:
       hostname: localhost
     client:
       register-with-eureka: false
       fetch-registry: false
       service-url:
         defaultZone: http://${eureka.instance.hostname}:${server.port}/eureka/
     server:
       enable-self-preservation: true
       eviction-interval-timer-in-ms: 10000
   ```

3. **Build the project:**
   ```bash
   mvn clean install
   ```

4. **Run the discovery server:**
   ```bash
   mvn spring-boot:run
   ```

   Or run the JAR:
   ```bash
   java -jar target/secflowcheck-discovery-1.0.0.jar
   ```

5. **Access the Eureka Dashboard:**
   ```
   http://localhost:8761
   ```

### Docker Deployment

```bash
docker build -t secflowcheck-discovery .
docker run -p 8761:8761 secflowcheck-discovery
```

## Configuration

### Application Properties

| Property | Description | Default |
|----------|-------------|---------|
| `server.port` | Eureka server port | `8761` |
| `eureka.instance.hostname` | Server hostname | `localhost` |
| `eureka.client.register-with-eureka` | Register itself with Eureka | `false` |
| `eureka.client.fetch-registry` | Fetch registry on startup | `false` |
| `eureka.server.enable-self-preservation` | Enable self-preservation mode | `true` |
| `eureka.server.eviction-interval-timer-in-ms` | Eviction check interval | `10000` |

### Self-Preservation Mode

Self-preservation mode protects against network partition issues:

- **Enabled**: Eureka won't evict services during network issues
- **Disabled**: Strict eviction of unhealthy services

For production: **Enable** self-preservation  
For development: Can **disable** for faster testing

```yaml
eureka:
  server:
    enable-self-preservation: false  # Development only
```

## Eureka Dashboard

Access the web UI at: `http://localhost:8761`

The dashboard shows:
- Registered service instances
- Service status (UP/DOWN)
- Instance metadata
- Renewal statistics
- Server configuration

## Service Registration

### Client Configuration

Services register with Eureka by adding dependencies:

**Maven (pom.xml):**
```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

**Application Configuration:**
```yaml
spring:
  application:
    name: my-service

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true
```

**Enable Eureka Client:**
```java
@SpringBootApplication
@EnableEurekaClient
public class MyServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyServiceApplication.class, args);
    }
}
```

### Python Services (FastAPI)

```python
import py_eureka_client.eureka_client as eureka_client

await eureka_client.init_async(
    eureka_server="http://localhost:8761/eureka",
    app_name="my-service",
    instance_port=8000,
    instance_host="my-service"
)
```

## API Endpoints

### GET `/eureka/apps`

Get all registered applications.

**Response (XML/JSON):**
```xml
<applications>
  <application>
    <name>AUTH-SERVICE</name>
    <instance>
      <instanceId>auth-service:8005</instanceId>
      <hostName>localhost</hostName>
      <app>AUTH-SERVICE</app>
      <ipAddr>192.168.1.100</ipAddr>
      <status>UP</status>
      <port enabled="true">8005</port>
    </instance>
  </application>
</applications>
```

### GET `/eureka/apps/{app-name}`

Get specific application details.

**Example:**
```bash
curl http://localhost:8761/eureka/apps/auth-service
```

### POST `/eureka/apps/{app-name}`

Register a new service instance (used by clients).

### PUT `/eureka/apps/{app-name}/{instance-id}`

Send heartbeat/renew lease (used by clients).

### DELETE `/eureka/apps/{app-name}/{instance-id}`

Deregister service instance (used by clients).

## Service Discovery

### Spring Cloud LoadBalancer

Services can discover others using the `lb://` prefix:

```java
@Bean
public RestTemplate restTemplate(RestTemplateBuilder builder) {
    return builder.build();
}

// Usage
String url = "lb://analyzer-service/analyze";
ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
```

### Manual Discovery

```java
@Autowired
private DiscoveryClient discoveryClient;

public List<ServiceInstance> getInstances(String serviceName) {
    return discoveryClient.getInstances(serviceName);
}
```

### Python Client

```python
import requests

# Get service instances
response = requests.get("http://localhost:8761/eureka/apps/analyzer-service")
instances = parse_eureka_response(response.text)

# Call service
service_url = f"http://{instances[0].ipAddr}:{instances[0].port}/analyze"
result = requests.post(service_url, json=data)
```

## Health Checks

### Heartbeat Interval

Services send heartbeats every 30 seconds by default:

```yaml
eureka:
  instance:
    lease-renewal-interval-in-seconds: 30
    lease-expiration-duration-in-seconds: 90
```

### Custom Health Checks

Services can provide custom health endpoints:

```java
@RestController
public class HealthController {
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("UP");
    }
}
```

## High Availability

### Multiple Eureka Instances

For production, run multiple Eureka servers:

**Eureka Server 1:**
```yaml
eureka:
  instance:
    hostname: eureka1
  client:
    service-url:
      defaultZone: http://eureka2:8761/eureka/
```

**Eureka Server 2:**
```yaml
eureka:
  instance:
    hostname: eureka2
  client:
    service-url:
      defaultZone: http://eureka1:8761/eureka/
```

**Clients:**
```yaml
eureka:
  client:
    service-url:
      defaultZone: http://eureka1:8761/eureka/,http://eureka2:8761/eureka/
```

## Monitoring

### Eureka Dashboard

Monitor services via web UI:
- **URL**: http://localhost:8761
- **Status**: Shows all registered services
- **Instances**: Shows instance details
- **Replicas**: Shows Eureka replicas (if configured)

### Registered Services

Check registered services:
```bash
curl http://localhost:8761/eureka/apps | grep "<name>"
```

Expected services:
- `AUTH-SERVICE`
- `GATEWAY-SERVICE`
- `PARSER-SERVICE`
- `ANALYZER-SERVICE`
- `REPORT-SERVICE`

### Service Status

Check specific service status:
```bash
curl http://localhost:8761/eureka/apps/analyzer-service \
  | grep "<status>"
```

## Troubleshooting

### Services not registering
- Verify Eureka server is running on port 8761
- Check client configuration `defaultZone` URL
- Ensure `@EnableEurekaClient` annotation is present
- Review client application logs for errors
- Check network connectivity to Eureka server

### Services showing as DOWN
- Verify service health endpoint is accessible
- Check heartbeat interval configuration
- Review service logs for errors
- Ensure service is actually running
- Check firewall rules

### Self-preservation mode warnings
- Normal during development with frequent restarts
- Disable for development: `enable-self-preservation: false`
- Keep enabled for production
- Wait for services to stabilize after deployment

### Dashboard not accessible
- Check Eureka server is running
- Verify port 8761 is not blocked
- Check firewall settings
- Try http://localhost:8761 (not https)

### Instance metadata missing
- Verify client configuration includes metadata
- Check `eureka.instance.metadata-map` settings
- Review instance registration logs

## Performance Tuning

### Cache Settings

```yaml
eureka:
  server:
    response-cache-update-interval-ms: 3000
    response-cache-auto-expiration-in-seconds: 180
```

### Eviction Settings

```yaml
eureka:
  server:
    eviction-interval-timer-in-ms: 5000
```

### Client Settings

```yaml
eureka:
  client:
    registry-fetch-interval-seconds: 30
    instance-info-replication-interval-seconds: 30
```

## Security

### Basic Authentication

Add Spring Security for Eureka:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

```yaml
spring:
  security:
    user:
      name: admin
      password: secret123

eureka:
  client:
    service-url:
      defaultZone: http://admin:secret123@localhost:8761/eureka/
```

### HTTPS

Configure SSL for production:

```yaml
server:
  port: 8761
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: changeit
    key-store-type: PKCS12
```

## Development

### Project Structure

```
secflowcheck-discovery/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/secflowcheck/discovery/
│       │       └── DiscoveryApplication.java
│       └── resources/
│           └── application.yml
├── pom.xml
├── Dockerfile
└── README.md
```

### Main Application

```java
package com.secflowcheck.discovery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class DiscoveryApplication {
    public static void main(String[] args) {
        SpringApplication.run(DiscoveryApplication.class, args);
    }
}
```

## Best Practices

1. **Use Service Names**: Always use service names, not IPs/ports
2. **Enable Health Checks**: Implement proper health endpoints
3. **Monitor Dashboard**: Regularly check Eureka dashboard
4. **High Availability**: Run multiple Eureka instances in production
5. **Security**: Enable authentication in production
6. **Self-Preservation**: Enable for production, disable for dev

## License

Part of the SecFlowCheck project.
