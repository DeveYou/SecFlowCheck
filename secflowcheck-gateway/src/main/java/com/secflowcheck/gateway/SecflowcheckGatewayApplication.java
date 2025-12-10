package com.secflowcheck.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
public class SecflowcheckGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(SecflowcheckGatewayApplication.class, args);
    }


}
