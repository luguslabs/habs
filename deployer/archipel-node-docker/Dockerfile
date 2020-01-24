###########################
# Archipel chain build step
###########################dock
FROM rust:buster as builder-chain
WORKDIR /root/  
COPY ./chain .
RUN	apt-get -y update; \
	apt-get install -y --no-install-recommends \
		g++ libssl-dev gcc clang libclang-dev make \
		git pkg-config curl time rhash
RUN ./scripts/init.sh && cargo build --release
RUN ./target/release/archipel  build-spec --chain template > archipelTemplateSpec.json
RUN ./target/release/archipel  build-spec --chain template --raw > archipelTemplateSpecRaw.json

####################################
# Create Archipel chain docker image
####################################
FROM debian:buster-slim
WORKDIR /root/

RUN mkdir chain
COPY --from=builder-chain /root/target/release/archipel ./chain
COPY --from=builder-chain /root/archipelTemplateSpec.json ./chain
COPY --from=builder-chain /root/archipelTemplateSpecRaw.json ./chain
RUN	apt-get -y update; \
	apt-get install -y --no-install-recommends \
		libssl-dev curl jq
COPY ./deployer/archipel-node-docker/start-node.sh .

EXPOSE 9933 9944 30333

ENTRYPOINT [ "./start-node.sh" ]
