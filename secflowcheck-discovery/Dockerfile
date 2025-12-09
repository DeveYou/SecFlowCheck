FROM eclipse-temurin:17-jdk-jammy

RUN apt-get update && apt-get install -y --no-install-recommends curl && apt-get clean && rm -rf /var/lib/apt/lists/*

ARG JAR_FILE=target/*.jar
WORKDIR /app

COPY ${JAR_FILE} app.jar

ENV JAVA_OPTS=""

EXPOSE 8761

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
