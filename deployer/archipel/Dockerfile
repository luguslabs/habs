###########################
# Archipel chain build step
###########################
FROM debian:buster as builder-chain
WORKDIR /root/  
COPY ./chain .
RUN	apt-get -y update; \
	apt-get install -y --no-install-recommends \
	cmake pkg-config libssl-dev git gcc build-essential clang libclang-dev curl ca-certificates
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup update nightly
RUN rustup update stable
RUN rustup target add wasm32-unknown-unknown --toolchain nightly
RUN cargo build --release
RUN ./target/release/archipel build-spec --disable-default-bootnode --chain local > archipelTemplateSpec.json
RUN ./target/release/archipel build-spec --disable-default-bootnode --chain local --raw > archipelTemplateSpecRaw.json

###########################
# Build subkey tool step
###########################
RUN git clone https://github.com/paritytech/substrate
RUN cd substrate && git checkout v3.0.0 && cargo build -p subkey --release

####################################
# Create Archipel docker image
####################################
FROM node:14-buster
WORKDIR /root/

####################################
# import chain build
####################################
RUN mkdir chain
COPY --from=builder-chain /root/target/release/archipel ./chain
COPY --from=builder-chain /root/archipelTemplateSpec.json ./chain
COPY --from=builder-chain /root/archipelTemplateSpecRaw.json ./chain
COPY --from=builder-chain /root/substrate/target/release/subkey /usr/local/bin/

# Add debian unstable repo for wireguard packages
RUN echo "deb http://deb.debian.org/debian/ unstable main" > /etc/apt/sources.list.d/unstable-wireguard.list && \
	printf 'Package: *\nPin: release a=unstable\nPin-Priority: 90\n' > /etc/apt/preferences.d/limit-unstable

# Installing necessary packages
RUN	apt-get -y update && \
	apt-get install -y --no-install-recommends \
	libssl-dev curl supervisor jq build-essential \
	wireguard-tools iptables net-tools procps && \
	echo "resolvconf resolvconf/linkify-resolvconf boolean false" | debconf-set-selections && \
	apt install -y resolvconf && \
	apt clean

#installl a static curl
RUN wget https://github.com/moparisthebest/static-curl/releases/download/v7.74.0/curl-amd64
RUN mv curl-amd64 /usr/local/bin/curl-static
RUN chmod +x /usr/local/bin/curl-static

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
COPY ./deployer/archipel/start-chain.sh /usr/local/bin/
COPY ./deployer/archipel/start-orchestrator.sh /usr/local/bin/
COPY ./deployer/archipel/start-wireguard.sh /usr/local/bin/
COPY ./deployer/archipel/wg-resolv-dns.sh /usr/local/bin/
COPY ./deployer/archipel/supervisord.conf /etc/supervisord/

RUN chmod +x /usr/local/bin/start-chain.sh
RUN chmod +x /usr/local/bin/start-orchestrator.sh
RUN chmod +x /usr/local/bin/start-wireguard.sh
RUN chmod +x /usr/local/bin/wg-resolv-dns.sh

EXPOSE 51820/udp

ENTRYPOINT ["supervisord","-c","/etc/supervisord/supervisord.conf"]
