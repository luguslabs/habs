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

#$ curl https://getsubstrate.io -sSf | bash -s -- --fast
RUN cargo install --force --git https://github.com/paritytech/substrate subkey
#RUN /usr/local/cargo/bin/subkey --help
#RUN cargo build -p subkey

###########################
# Archipel orchestrator build step
###########################

FROM node:10 as builder-orchestrator

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY orchestrator/package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY orchestrator/ .


####################################
# Create Archipel docker image
####################################
FROM debian:buster-slim
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
		libssl-dev curl nodejs supervisor jq

####################################
# import orchestrator build
####################################

COPY --from=builder-orchestrator /usr/src/app /usr/src/app

####################################
# import scripts and supervisord conf  
####################################

COPY deployer/start_chain.sh /usr/local/bin/
COPY deployer/start_orchestrator.sh /usr/local/bin/
COPY deployer/node_status.sh /usr/local/bin/
COPY deployer/author_insertKey.sh /usr/local/bin/
COPY deployer/supervisord.conf /etc/supervisord/

ENTRYPOINT ["supervisord","-c","/etc/supervisord/supervisord.conf"]