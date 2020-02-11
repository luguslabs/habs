FROM debian:buster

# Add debian unstable repo for wireguard packages
RUN echo "deb http://deb.debian.org/debian/ unstable main" > /etc/apt/sources.list.d/unstable-wireguard.list && \
    printf 'Package: *\nPin: release a=unstable\nPin-Priority: 90\n' > /etc/apt/preferences.d/limit-unstable

# Install wireguard packges
RUN apt update && \
    apt install -y --no-install-recommends wireguard-tools iptables net-tools procps && \
    echo "resolvconf resolvconf/linkify-resolvconf boolean false" | debconf-set-selections && \
    apt install -y resolvconf && \
    apt clean

# Add main work dir to PATH
WORKDIR /root
ENV PATH="/root:${PATH}"

# Copy scripts to containers
COPY entrypoint.sh /root
RUN chmod +x entrypoint.sh

# Wirguard interface configs go in /etc/wireguard
VOLUME /etc/wireguard

CMD ["./entrypoint.sh"]