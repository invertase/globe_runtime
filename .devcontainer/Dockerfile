FROM mcr.microsoft.com/vscode/devcontainers/rust:1-bullseye

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends apt-transport-https lcov git clang

# Install Dart SDK (you can use a more recent version if needed)
RUN wget https://storage.googleapis.com/dart-archive/channels/stable/release/3.6.2/sdk/dartsdk-linux-arm64-release.zip \
    && unzip dartsdk-linux-arm64-release.zip \
    && rm dartsdk-linux-arm64-release.zip
ENV PATH="/dart-sdk/bin:${PATH}"

# install melos and add to path
RUN dart pub global activate melos

ENV PATH="/$HOME/.pub-cache/bin:${PATH}"