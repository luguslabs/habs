###########################
# Archipel chain build step
###########################dock
FROM debian:buster as builder
WORKDIR /root/  
COPY . .
RUN	apt-get -y update; \
	apt-get install -y --no-install-recommends \
	cmake pkg-config libssl-dev git gcc build-essential clang libclang-dev curl ca-certificates
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup toolchain install nightly-2020-10-06
RUN rustup default nightly-2020-10-06
RUN rustup target add wasm32-unknown-unknown --toolchain nightly-2020-10-06
RUN cargo build --release

RUN ./target/release/archipel build-spec --disable-default-bootnode --chain local > archipelTemplateSpec.json
RUN ./target/release/archipel build-spec --disable-default-bootnode --chain local --raw > archipelTemplateSpecRaw.json

###########################
# Build subkey tool step
###########################
RUN cargo +nightly-2020-10-06 install --force --git https://github.com/paritytech/substrate subkey

####################################
# Create Archipel chain docker image
####################################
FROM debian:buster-slim
WORKDIR /root/
RUN mkdir chain
COPY --from=builder /root/target/release/archipel ./chain
COPY --from=builder /root/archipelTemplateSpec.json ./chain
COPY --from=builder /root/archipelTemplateSpecRaw.json ./chain
COPY --from=builder /root/.cargo/bin/subkey /usr/local/bin/
RUN	apt-get -y update; \
	apt-get install -y --no-install-recommends \
	libssl-dev curl jq
COPY ./entrypoint.sh .
RUN chmod +x ./entrypoint.sh

EXPOSE 9933 9944 30333

ENTRYPOINT [ "./entrypoint.sh" ]