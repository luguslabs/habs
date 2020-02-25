#!/bin/bash

#!/bin/bash
ARCHIPEL_VERSION="test"

SCRIPTPATH="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

# Launch Archipel orchestrator in docker container
function launch_archipel () {
  echo "Starting $1..."
  # Launching docker container of node
  echo "ARCHIPEL_NODE_KEY_FILE ${10}..."
  docker run -d --name "$1" $5 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v $1:/root/chain/data \
    -v $1_service:/service \
    -v $SCRIPTPATH/chain/keys:/keys \
    --network archipel \
    --ip "$6" \
    --env ARCHIPEL_NODE_ALIAS=$1 \
    --env ARCHIPEL_LISTEN_PORT=30333 \
    --env ARCHIPEL_KEY_SEED="$2" \
    --env ARCHIPEL_NODE_KEY_FILE="${10}" \
    --env ARCHIPEL_CHAIN_ADDITIONAL_PARAMS="$7" \
    --env POLKADOT_NAME=$3 \
    --env POLKADOT_PREFIX=$4 \
    --env SERVICE="polkadot" \
    --env POLKADOT_IMAGE="parity/polkadot:latest" \
    --env POLKADOT_KEY_GRAN="april shift pupil quit mandate school cost oven gospel castle brain student" \
    --env POLKADOT_KEY_BABE="region run sunset rule light gap cool element angle example laundry stadium" \
    --env POLKADOT_KEY_IMON="screen sustain clog husband assist noble artist sea fringe afford coil hawk" \
    --env POLKADOT_KEY_PARA="produce hover hurdle lobster december slight hat note quit bomb drama notice" \
    --env POLKADOT_KEY_AUDI="oak tail stomach fluid trade aunt fire fringe mercy roast style garlic" \
    --env POLKADOT_RESERVED_NODES="$8" \
    --env POLKADOT_TELEMETRY_URL="$9" \
    --env POLKADOT_NODE_KEY_FILE="${11}" \
    --env ARCHIPEL_AUTHORITIES_SR25519_LIST="5FmqMTGCW6yGmqzu2Mp9f7kLgyi5NfLmYPWDVMNw9UqwU2Bs,5H19p4jm177Aj4X28xwL2cAAbxgyAcitZU5ox8hHteScvsex,5DqDvHkyfyBR8wtMpAVuiWA2wAAVWptA8HtnsvQT7Uacbd4s" \
    --env ARCHIPEL_AUTHORITIES_ED25519_LIST="5FbQNUq3kDC9XHtQP6iFP5PZmug9khSNcSRZwdUuwTz76yQY,5GiUmSvtiRtLfPPAVovSjgo6NnDUDs4tfh6V28RgZQgunkAF,5EGkuW6uSqiZZiZCyVfQZB9SKw5sQc4Cok8kP5aGEq3mpyVj" \
    --env DEBUG="app,chain,docker,metrics,polkadot,service" \
    luguslabs/archipel:$ARCHIPEL_VERSION

  echo "Waiting 10 seconds to be sure that archipel is started..."
  sleep 10
}

NODE1_IP="172.28.42.2"
NODE2_IP="172.28.42.3"
NODE3_IP="172.28.42.4"

# Creating a docker network for Archipel chain
echo "Creating docker network for archipel test..."
docker network create archipel --subnet=172.28.42.0/16

docker volume create archipel1
docker volume create archipel1_service
docker volume create archipel2
docker volume create archipel2_service
docker volume create archipel3
docker volume create archipel3_service

NODE1_LOCAL_ID=$(cat $SCRIPTPATH/chain/keys/key1-peer-id.txt)
echo "Local archipel1 node identity is '$NODE1_LOCAL_ID'"
NODE2_LOCAL_ID=$(cat $SCRIPTPATH/chain/keys/key2-peer-id.txt)
echo "Local archipel2 node identity is '$NODE2_LOCAL_ID'"
NODE3_LOCAL_ID=$(cat $SCRIPTPATH/chain/keys/key3-peer-id.txt)
echo "Local archipel3 node identity is '$NODE3_LOCAL_ID'"

# Constructing bootnodes and reserved nodes lists
BOOTNODES_LIST="--bootnodes /ip4/$NODE1_IP/tcp/30333/p2p/$NODE1_LOCAL_ID --bootnodes /ip4/$NODE2_IP/tcp/30333/p2p/$NODE2_LOCAL_ID --bootnodes /ip4/$NODE3_IP/tcp/30333/p2p/$NODE3_LOCAL_ID"
echo "Bootnodes list is '$BOOTNODES_LIST'"
RESERVED_LIST="--reserved-nodes /ip4/$NODE1_IP/tcp/30333/p2p/$NODE1_LOCAL_ID --reserved-nodes /ip4/$NODE2_IP/tcp/30333/p2p/$NODE2_LOCAL_ID --reserved-nodes /ip4/$NODE3_IP/tcp/30333/p2p/$NODE3_LOCAL_ID"
echo "RESERVED_LIST  is '$RESERVED_LIST'"
ARCHIPEL_CHAIN_ADDITIONAL_PARAMS=$BOOTNODES_LIST" "$RESERVED_LIST

echo "ARCHIPEL_CHAIN_ADDITIONAL_PARAMS  is '$ARCHIPEL_CHAIN_ADDITIONAL_PARAMS'"


POLKADOT_NODE1_IP="172.17.0.2"
POLKADOT_NODE2_IP="172.17.0.3"
POLKADOT_NODE3_IP="172.17.0.4"

# Getting polkadot nodes local node identity
NODE1_POLKADOT_LOCAL_ID=$(cat $SCRIPTPATH/chain/keys/key1-polkadot-peer-id.txt)
echo "Local node1-polkadot-sync node identity is '$NODE1_POLKADOT_LOCAL_ID'"
NODE2_POLKADOT_LOCAL_ID=$(cat $SCRIPTPATH/chain/keys/key2-polkadot-peer-id.txt)
echo "Local node2-polkadot-sync node identity is '$NODE2_POLKADOT_LOCAL_ID'"
NODE3_POLKADOT_LOCAL_ID=$(cat $SCRIPTPATH/chain/keys/key3-polkadot-peer-id.txt)
echo "Local node3-polkadot-sync node identity is '$NODE3_POLKADOT_LOCAL_ID'"

# Constructing reserved peers polkadot list
POLKADOT_RESERVED_NODES="/ip4/$POLKADOT_NODE1_IP/tcp/30333/p2p/$NODE1_POLKADOT_LOCAL_ID,/ip4/$POLKADOT_NODE2_IP/tcp/30333/p2p/$NODE2_POLKADOT_LOCAL_ID,/ip4/$POLKADOT_NODE3_IP/tcp/30333/p2p/$NODE3_POLKADOT_LOCAL_ID"
echo "POLKADOT_RESERVED_NODES list is '$POLKADOT_RESERVED_NODES'"

# You can add a custom Telemery URL like POLKADOT_TELEMETRY_URL="ws://IP_HERE:8000/submit"
POLKADOT_TELEMETRY_URL=

launch_archipel "archipel1" \
                "mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud" \
                "archipel-validator1" \
                "node1-" \
                "" \
                "$NODE1_IP" \
                "$ARCHIPEL_CHAIN_ADDITIONAL_PARAMS" \
                "$POLKADOT_RESERVED_NODES" \
                "$POLKADOT_TELEMETRY_URL" \
                "key1-node-key-file" \
                "key1-polkadot-node-key-file" \
                
launch_archipel "archipel2" \
                "fiscal toe illness tunnel pill spatial kind dash educate modify sustain suffer" \
                "archipel-validator2" \
                "node2-" \
                "" \
                "$NODE2_IP" \
                "$ARCHIPEL_CHAIN_ADDITIONAL_PARAMS" \
                "$POLKADOT_RESERVED_NODES" \
                "$POLKADOT_TELEMETRY_URL" \
                "key2-node-key-file" \
                "key2-polkadot-node-key-file" \

launch_archipel "archipel3" \
                "borrow initial guard hunt corn trust student opera now economy thumb argue" \
                "archipel-validator3" \
                "node3-" \
                "" \
                "$NODE3_IP" \
                "$ARCHIPEL_CHAIN_ADDITIONAL_PARAMS" \
                "$POLKADOT_RESERVED_NODES" \
                "$POLKADOT_TELEMETRY_URL" \
                "key3-node-key-file" \
                "key3-polkadot-node-key-file" \

docker volume create archipel-node

echo "Launching an Archipel node..."
docker run -d \
      -p 9944:9944 \
      -v archipel-node:/root/chain/data \
      --name "archipel-node" \
      --network archipel \
      --env ARCHIPEL_AUTHORITIES_SR25519_LIST="5FmqMTGCW6yGmqzu2Mp9f7kLgyi5NfLmYPWDVMNw9UqwU2Bs,5H19p4jm177Aj4X28xwL2cAAbxgyAcitZU5ox8hHteScvsex,5DqDvHkyfyBR8wtMpAVuiWA2wAAVWptA8HtnsvQT7Uacbd4s" \
      --env ARCHIPEL_AUTHORITIES_ED25519_LIST="5FbQNUq3kDC9XHtQP6iFP5PZmug9khSNcSRZwdUuwTz76yQY,5GiUmSvtiRtLfPPAVovSjgo6NnDUDs4tfh6V28RgZQgunkAF,5EGkuW6uSqiZZiZCyVfQZB9SKw5sQc4Cok8kP5aGEq3mpyVj" \
      --env ARCHIPEL_NODE_ALIAS="archipel-node" \
      --env ARCHIPEL_CHAIN_ADDITIONAL_PARAMS="$BOOTNODES_LIST" \
      luguslabs/archipel-node:test

echo "Launching and Opening Archipel UI..."
docker run -d -p 8080:80 --name archipel-ui luguslabs/archipel-ui:test
echo "Archipel UI is running at http://localhost:8080 ..."

echo "Archipel was created."
docker ps
