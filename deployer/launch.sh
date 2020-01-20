#!/bin/bash

#!/bin/bash
ARCHIPEL_VERSION="latest"
# Launch Archipel orchestrator in docker container
function launch_archipel () {
  echo "Starting $1..."
  # Launching docker container of node
  docker run -d --name "$1" \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -p 9944:9944 \
    --env ARCHIPEL_NODE_ALIAS=$1 \
    --env POLKADOT_NAME=$3 \
    --env POLKADOT_KEY=$4 \
    --env POLKADOT_IMAGE=$5 \
    --env POLKADOT_CONTAINER_PREFIX=$6 \
    --env ARCHIPEL_KEY_SEED="$2" \
    --env ARCHIPEL_AUTHORITIES_LIST="$7" \
    luguslabs/archipel:$ARCHIPEL_VERSION
  echo "$7"
  echo "Waiting 5 seconds to be sure that archipel is started..."
  sleep 5
}

launch_archipel "archipel1" "mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud" "validator1" "0x5e4b8a226eb3435598b72ffbef1b4d37a64c10bea3b8d6ff28800e0b9898dcb7" "chevdor/polkadot:0.4.4" "node1-" '["5DqDvHkyfyBR8wtMpAVuiWA2wAAVWptA8HtnsvQT7Uacbd4s", "5H19p4jm177Aj4X28xwL2cAAbxgyAcitZU5ox8hHteScvsex", "5FmqMTGCW6yGmqzu2Mp9f7kLgyi5NfLmYPWDVMNw9UqwU2Bs"]'

echo "Archipel was created."
docker ps
