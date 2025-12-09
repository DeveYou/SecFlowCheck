package com.secflowcheck.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableDiscoveryClient
public class SecflowcheckGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(SecflowcheckGatewayApplication.class, args);
    }

}
