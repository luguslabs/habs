#!/bin/bash

#parsing config file
if [ ! -z "$CONFIG_FILE" ]; then
      if [ -z "$NODE_ID" ]; then
            echo "\$NODE_ID must be set"
            exit 1
      fi
      #unpack config file
      if [ ! -f "/config/config.json" ]; then
        unzip -o /config/archipel-config.zip
      fi
      cd /config

      #set variables from config file
      WIREGUARD_PRIVATE_KEY=$(cat config.json | jq ".wireguardNodes[$NODE_ID].privateKey" | sed 's/\"//g')
      WIREGUARD_ADDRESS="10.0.1.$NODE_ID/32"
      WIREGUARD_LISTEN_PORT="51820"
      WIREGUARD_PEERS_EXTERNAL_ADDR=$(cat config.json | jq ".wireguardExternalAddrList" | sed 's/\"//g')
      WIREGUARD_PEERS_PUB_ADDR=$(cat config.json | jq ".wireguardPeersPubAddrList" | sed 's/\"//g')
      WIREGUARD_PEERS_ALLOWED_IP=$(cat config.json | jq ".wireguardAllowedIpsList" | sed 's/\"//g')
fi

# Checking env vars
if [ -z $WIREGUARD_PRIVATE_KEY ] || [ -z $WIREGUARD_ADDRESS ] || \
    [ -z $WIREGUARD_LISTEN_PORT ] ||  [ -z $WIREGUARD_PEERS_EXTERNAL_ADDR ] || \
    [ -z $WIREGUARD_PEERS_PUB_ADDR ] || [ -z $WIREGUARD_PEERS_ALLOWED_IP ]; then
    echo "ERROR: Please set env vars WIREGUARD_PRIVATE_KEY, WIREGUARD_ADDRESS, WIREGUARD_LISTEN_PORT, WIREGUARD_PEERS_PUB_ADDR, WIREGUARD_PEERS_ALLOWED_IP, WIREGUARD_PEERS_EXTERNAL_ADDR." >&2
    exit 1
fi

# Replace , with spaces in PEERS lists
IFS=',' read -r -a WIREGUARD_PEERS_PUB_ADDR_SPACE <<< "$WIREGUARD_PEERS_PUB_ADDR"
IFS=',' read -r -a WIREGUARD_PEERS_ALLOWED_IP_SPACE <<< "$WIREGUARD_PEERS_ALLOWED_IP"
IFS=',' read -r -a WIREGUARD_PEERS_EXTERNAL_ADDR_SPACE <<< "$WIREGUARD_PEERS_EXTERNAL_ADDR"

# Check if length of peers arrays are the same
if [[ "$(wc -w <<< "${WIREGUARD_PEERS_PUB_ADDR_SPACE[@]}")" !=  "$(wc -w <<< "${WIREGUARD_PEERS_ALLOWED_IP_SPACE[@]}")" ]] || \
   [[ "$(wc -w <<< "${WIREGUARD_PEERS_PUB_ADDR_SPACE[@]}")" !=  "$(wc -w <<< "${WIREGUARD_PEERS_EXTERNAL_ADDR_SPACE[@]}")" ]]; then
   echo "ERROR: Please check WIREGUARD_PEERS_PUB_ADDR_SPACE, WIREGUARD_PEERS_ALLOWED_IP_SPACE, WIREGUARD_PEERS_EXTERNAL_ADDR_SPACE lists length." >&2
   exit 1
fi

# Write server config
cat <<EOF >/etc/wireguard/wg0.conf
[Interface]
Address = $WIREGUARD_ADDRESS
PrivateKey = $WIREGUARD_PRIVATE_KEY
ListenPort = $WIREGUARD_LISTEN_PORT

EOF

# Add peers into config file
for i in "${!WIREGUARD_PEERS_PUB_ADDR_SPACE[@]}"; do
    # Don't add server as peer
    if [[ "${WIREGUARD_PEERS_ALLOWED_IP_SPACE[i]}" != "$WIREGUARD_ADDRESS" ]]; then
    cat <<EOF >>/etc/wireguard/wg0.conf
[Peer]
PublicKey = ${WIREGUARD_PEERS_PUB_ADDR_SPACE[i]}
AllowedIPs = ${WIREGUARD_PEERS_ALLOWED_IP_SPACE[i]}
Endpoint = ${WIREGUARD_PEERS_EXTERNAL_ADDR_SPACE[i]}
PersistentKeepalive = 21

EOF
    fi
done


# Find a Wireguard interface
interfaces=`find /etc/wireguard -type f`
if [[ -z $interfaces ]]; then
    echo "$(date): Interface not found in /etc/wireguard" >&2
    exit 1
fi

# Up wireguard for every interface
for interface in $interfaces; do
    echo "$(date): Starting Wireguard $interface"
    wg-quick up $interface
done

# Handle shutdown behavior
finish () {
    echo "$(date): Shutting down Wireguard"
    for interface in $interfaces; do
        wg-quick down $interface
    done
    exit 0
}

# Catch shutdown signals
trap finish SIGTERM SIGINT SIGQUIT

# Make script run forever
sleep infinity &
wait $!
