#Create subkey bin
FROM rust:buster as builder-subkey
# Update rust
RUN rustup update nightly
RUN rustup update stable
RUN rustup target add wasm32-unknown-unknown --toolchain nightly
# Install subkey tool
RUN cargo install --force --git https://github.com/paritytech/substrate subkey

FROM node:10-buster
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


# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .
COPY --from=builder-subkey /usr/local/cargo/bin/subkey /usr/local/bin/

EXPOSE 3000

CMD [ "node", "src/app.js" ]
