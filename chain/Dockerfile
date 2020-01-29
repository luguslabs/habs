###########################
# Archipel chain build step
###########################dock
FROM rust:buster as builder
WORKDIR /root/  
COPY . .
RUN	apt-get -y update; \
	apt-get install -y --no-install-recommends \
		g++ libssl-dev gcc clang libclang-dev make \
		git pkg-config curl time rhash
RUN ./scripts/init.sh && cargo build --release
RUN ./target/release/archipel build-spec --chain template > archipelTemplateSpec.json
RUN ./target/release/archipel build-spec --chain template --raw > archipelTemplateSpecRaw.json

###########################
# Build subkey tool step
###########################
RUN cargo install --force --git https://github.com/paritytech/substrate subkey

####################################
# Create Archipel chain docker image
####################################
FROM debian:buster-slim
WORKDIR /root/
RUN mkdir chain
COPY --from=builder /root/target/release/archipel ./chain
COPY --from=builder /root/archipelTemplateSpec.json ./chain
COPY --from=builder /root/archipelTemplateSpecRaw.json ./chain
COPY --from=builder /usr/local/cargo/bin/subkey /usr/local/bin/
RUN	apt-get -y update; \
	apt-get install -y --no-install-recommends \
		libssl-dev curl jq
COPY ./entrypoint.sh .
RUN chmod +x ./entrypoint.sh

EXPOSE 9933 9944 30333

ENTRYPOINT [ "./entrypoint.sh" ]