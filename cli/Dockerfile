#Create subkey bin
FROM debian:buster as builder-subkey
# Install subkey tool
WORKDIR /root/
RUN	apt-get -y update; \
    apt-get install -y --no-install-recommends \
    cmake pkg-config libssl-dev git gcc build-essential clang libclang-dev curl ca-certificates
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup toolchain install nightly-2020-10-06
RUN rustup default nightly-2020-10-06
RUN rustup target add wasm32-unknown-unknown --toolchain nightly-2020-10-06

###########################
# Build subkey tool step
###########################
RUN git clone https://github.com/paritytech/substrate
RUN cd substrate && git checkout v2.0.1 && cargo build -p subkey --release


FROM node:10-buster

ENV NODE_NO_WARNINGS 1
ENV user node
ENV PATH=/home/node/.npm-global/bin:$PATH
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global

# Add debian unstable repo for wireguard packages
RUN echo "deb http://deb.debian.org/debian/ unstable main" > /etc/apt/sources.list.d/unstable-wireguard.list && \
    printf 'Package: *\nPin: release a=unstable\nPin-Priority: 90\n' > /etc/apt/preferences.d/limit-unstable

# Installing necessary packages
RUN	apt-get -y update && \
    apt-get install -y --no-install-recommends \
    wireguard-tools zip iptables net-tools procps && \
    echo "resolvconf resolvconf/linkify-resolvconf boolean false" | debconf-set-selections && \
    apt install -y resolvconf && \
    apt clean

# Copy subkey
COPY --from=builder-subkey /root/substrate/target/release/subkey /usr/local/bin/

RUN mkdir /home/$user/app
COPY . /home/$user/app/
RUN chown -R $user: /home/$user/app

USER $user

RUN mkdir /home/$user/.npm-global

WORKDIR /home/$user/app
RUN npm install
RUN npm -g install . --no-optional

ENTRYPOINT [ "archipel-cli" ]
