###########################
# Archipel chain build step
###########################
FROM rust:buster as builder-chain
WORKDIR /root/  
COPY chain .
RUN	apt-get -y update; \
	apt-get install -y --no-install-recommends \
		g++ libssl-dev gcc clang libclang-dev make \
		git pkg-config curl time rhash
RUN ./scripts/init.sh && cargo build --release
RUN ./target/release/archipel  build-spec --chain template > archipelTemplateSpec.json
RUN ./target/release/archipel  build-spec --chain template --raw > archipelTemplateSpecRaw.json

###########################
# Build subkey tool step
###########################
RUN cargo install --force --git https://github.com/paritytech/substrate subkey

####################################
# Create Archipel docker image
####################################
FROM node:10-buster-slim
WORKDIR /root/

####################################
# import chain build
####################################
RUN mkdir chain
COPY --from=builder-chain /root/target/release/archipel ./chain
COPY --from=builder-chain /root/archipelTemplateSpec.json ./chain
COPY --from=builder-chain /root/archipelTemplateSpecRaw.json ./chain
COPY --from=builder-chain /usr/local/cargo/bin/subkey /usr/local/bin/
RUN	apt-get -y update; \
	apt-get install -y --no-install-recommends \
		libssl-dev curl supervisor jq build-essential

####################################
# import orchestrator
####################################
WORKDIR /usr/src/app  
COPY orchestrator/package*.json ./
COPY orchestrator/ .
RUN npm install

WORKDIR /root/

####################################
# import scripts and supervisord conf  
####################################

COPY deployer/docker/start-chain.sh /usr/local/bin/
COPY deployer/docker/start-orchestrator.sh /usr/local/bin/
COPY deployer/docker/supervisord.conf /etc/supervisord/

ENTRYPOINT ["supervisord","-c","/etc/supervisord/supervisord.conf"]
