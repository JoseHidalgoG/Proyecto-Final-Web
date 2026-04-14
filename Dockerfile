FROM eclipse-temurin:25-jdk AS build

WORKDIR /app

COPY gradle ./gradle
COPY gradlew build.gradle settings.gradle ./
COPY src ./src

RUN sh gradlew installDist --no-daemon

FROM eclipse-temurin:25-jdk

WORKDIR /app

COPY --from=build /app/build/install/Proyecto-Final-Web ./

EXPOSE 7070
EXPOSE 9090

CMD ["bin/Proyecto-Final-Web"]
