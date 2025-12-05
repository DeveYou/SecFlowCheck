FROM eclipse-temurin:17-jdk-jammy

ARG JAR_FILE=target/api-gateway-1.0.0.jar
WORKDIR /app

COPY ${JAR_FILE} app.jar

ENV JAVA_OPTS=""

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
