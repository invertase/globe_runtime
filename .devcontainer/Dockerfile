FROM dart:3.4 AS build

FROM mcr.microsoft.com/vscode/devcontainers/rust:1-bullseye

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends apt-transport-https lcov git

# Install Dart SDK (you can use a more recent version if needed)
RUN wget https://storage.googleapis.com/dart-archive/channels/stable/release/3.3.0/sdk/dartsdk-linux-arm64-release.zip \
    && unzip dartsdk-linux-arm64-release.zip \
    && rm dartsdk-linux-arm64-release.zip
ENV PATH="/dart-sdk/bin:${PATH}"
