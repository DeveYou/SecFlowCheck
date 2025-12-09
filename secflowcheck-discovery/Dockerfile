FROM eclipse-temurin:17-jdk-jammy

ARG JAR_FILE=target/secflowcheck-discovery-0.0.1-SNAPSHOT.jar
WORKDIR /app

COPY ${JAR_FILE} app.jar

ENV JAVA_OPTS=""

EXPOSE 8761

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]