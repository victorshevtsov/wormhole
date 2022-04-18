#syntax=docker/dockerfile:1.2@sha256:e2a8561e419ab1ba6b2fe6cbdf49fd92b95912df1cf7d313c3e2230a333fdbcc
FROM docker.io/library/rust:1.49@sha256:a50165ea96983c21832578afb1c8c028674c965bc1ed43b607871b1f362e06a5

RUN apt-get update && \
    apt-get install -y \
    clang \
    libssl-dev \
    libudev-dev \
    llvm \
    pkg-config \
    zlib1g-dev \
    && \
    rm -rf /var/lib/apt/lists/* && \
    rustup component add rustfmt && \
    rustup default nightly-2022-01-02

RUN curl \
        -L https://github.com/Fair-Exchange/Safecoin/releases/download/v.18.12/Safecoin-Linux-1.8.12.tar.gz \
        --output /tmp/safecoin.tar.gz && \
    mkdir -p /root/.local/share/safecoin/install/active_release/bin && \
    tar \
        -C /root/.local/share/safecoin/install/active_release/bin \
        --strip-components=1 \
        -xzvf /tmp/safecoin.tar.gz Safecoinbin && \
    git clone https://github.com/Fair-Exchange/Safecoin.git /tmp/safecoin -b 1.8.12 && \
    cp -r /tmp/safecoin/sdk /root/.local/share/safecoin/install/active_release/bin && \
    rm -rf /tmp/safecoin.tar.gz /tmp/safecoin

ENV PATH="/root/.local/share/safecoin/install/active_release/bin:$PATH"

# # Support additional root CAs
# COPY devnet_setup.sh cert.pem* /certs/
# # Debian
# RUN if [ -e /certs/cert.pem ]; then cp /certs/cert.pem /etc/ssl/certs/ca-certificates.crt; fi

# Solana does a questionable download at the beginning of a *first* build-bpf call. Trigger and layer-cache it explicitly.
RUN cargo init --lib /tmp/decoy-crate && \
    cd /tmp/decoy-crate && cargo build-bpf && \
    rm -rf /tmp/decoy-crate

RUN mkdir -p /opt/safecoin/deps

RUN git clone https://github.com/Fair-Exchange/safecoin-program-library.git /usr/src/safecoin-program-library && \
    cd /usr/src/safecoin-program-library

RUN --mount=type=cache,id=safecoin-program-library,target=/usr/src/safecoin-program-library/target \
    cargo build-bpf --manifest-path "/usr/src/safecoin-program-library/token/program/Cargo.toml" && \
    cargo build-bpf --manifest-path "/usr/src/safecoin-program-library/memo/program/Cargo.toml" && \
    cargo build-bpf --manifest-path "/usr/src/safecoin-program-library/associated-token-account/program/Cargo.toml" && \
    cargo build-bpf --manifest-path "/usr/src/safecoin-program-library/token-lending/program/Cargo.toml" && \
    cp /usr/src/safecoin-program-library/target/deploy/safe_token.so /opt/safecoin/deps/safe_token.so && \
    cp /usr/src/safecoin-program-library/target/deploy/safe_memo.so /opt/safecoin/deps/safe_memo.so && \
    cp /usr/src/safecoin-program-library/target/deploy/safe_associated_token_account.so /opt/safecoin/deps/safe_associated_token_account.so && \
    cp /usr/src/safecoin-program-library/target/deploy/safe_token_lending.so /opt/safecoin/deps/safe_token_lending.so

# Add bridge contract sources
WORKDIR /usr/src/bridge

ADD . .
RUN mkdir -p /opt/safecoin/deps

ENV EMITTER_ADDRESS="11111111111111111111111111111115"
ENV BRIDGE_ADDRESS="CB369Srn5zYuV1HKQg7WgxxjhcAy1aLH9UYth9jGTXJj"

# Build Wormhole Solana programs
RUN --mount=type=cache,id=safecoin_bridge,target=bridge/target \
    --mount=type=cache,id=safecoin_token_bridge,target=modules/token_bridge/target \
    --mount=type=cache,id=safecoin_nft_bridge,target=modules/nft_bridge/target \
    --mount=type=cache,id=safecoin_migration,target=migration/target \
    cargo build-bpf --manifest-path "bridge/program/Cargo.toml" -- --locked && \
    cargo build-bpf --manifest-path "bridge/cpi_poster/Cargo.toml" -- --locked && \
    cargo build-bpf --manifest-path "modules/token_bridge/token-vault/Cargo.toml" -- --locked&& \
    cargo build-bpf --manifest-path "modules/token_bridge/token-metadata/Cargo.toml" -- --locked&& \
    cargo build-bpf --manifest-path "modules/token_bridge/program/Cargo.toml" -- --locked && \
    cargo build-bpf --manifest-path "modules/nft_bridge/program/Cargo.toml" -- --locked && \
    cargo build-bpf --manifest-path "migration/Cargo.toml" -- --locked && \
    cp bridge/target/deploy/bridge.so /opt/safecoin/deps/bridge.so && \
    cp bridge/target/deploy/cpi_poster.so /opt/safecoin/deps/cpi_poster.so && \
    cp migration/target/deploy/wormhole_migration.so /opt/safecoin/deps/wormhole_migration.so && \
    cp modules/token_bridge/target/deploy/safe_token_vault.so /opt/safecoin/deps/safe_token_vault.so && \
    cp modules/token_bridge/target/deploy/safe_token_metadata.so /opt/safecoin/deps/safe_token_metadata.so && \
    cp modules/token_bridge/target/deploy/token_bridge.so /opt/safecoin/deps/token_bridge.so && \
    cp modules/nft_bridge/target/deploy/nft_bridge.so /opt/safecoin/deps/nft_bridge.so

ENV RUST_LOG="solana_runtime::system_instruction_processor=trace,solana_runtime::message_processor=trace,solana_bpf_loader=debug,solana_rbpf=debug"
ENV RUST_BACKTRACE=1
