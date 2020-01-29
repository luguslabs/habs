#!/bin/bash
ARCHIPEL_CHAIN_VERSION="test"
# Launch Archipel node in docker container
function launch_node () {
  echo "Starting $1..."
  # Launching docker container of node
  docker run -d --name "$1" $3 \
    -v $(pwd)/$1:/root/chain/data \
    --network archipel \
    --ip "$2" \
    --env ARCHIPEL_NODE_ALIAS=$1 \
    --env ARCHIPEL_KEY_SEED="$4" \
    --env ARCHIPEL_CHAIN_ADDITIONAL_PARAMS="$5" \
    --env ARCHIPEL_AUTHORITIES_SR25519_LIST="5FmqMTGCW6yGmqzu2Mp9f7kLgyi5NfLmYPWDVMNw9UqwU2Bs,5H19p4jm177Aj4X28xwL2cAAbxgyAcitZU5ox8hHteScvsex,5DqDvHkyfyBR8wtMpAVuiWA2wAAVWptA8HtnsvQT7Uacbd4s" \
    --env ARCHIPEL_AUTHORITIES_ED25519_LIST="5FbQNUq3kDC9XHtQP6iFP5PZmug9khSNcSRZwdUuwTz76yQY,5GiUmSvtiRtLfPPAVovSjgo6NnDUDs4tfh6V28RgZQgunkAF,5EGkuW6uSqiZZiZCyVfQZB9SKw5sQc4Cok8kP5aGEq3mpyVj" \
    luguslabs/archipel-chain:$ARCHIPEL_CHAIN_VERSION

  echo "Waiting 10 seconds to be sure that node was started..."
  sleep 10
}

# Get local node identity
function get_node_identity () {
  echo "Getting local $1 identity..."
  # Make this trick to be able to return a result from a function in bash
  local  __resultvar=$2
  local node_local_id=$(docker logs $1 2>&1 | grep "Local node identity is" | tail -1 | grep -oE '[^ ]+$' --color=never)
  eval $__resultvar="'$node_local_id'"
}

NODE1_IP="172.28.42.2"
NODE2_IP="172.28.42.3"
NODE3_IP="172.28.42.4"

# Creating a docker network for Archipel chain
echo "Creating docker network for archipel chain test..."
docker network create archipel --subnet=172.28.42.0/16

# Starting node1
launch_node "node1" \
            "$NODE1_IP" \
            "-p 9944:9944 -p 9933:9933 -p 9955:9955" \
            "mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud" \
            ""

# Starting node2
launch_node "node2" \
            "$NODE2_IP" \
            "" \
            "fiscal toe illness tunnel pill spatial kind dash educate modify sustain suffer" \
            ""

# Starting node3
launch_node "node3" \
            "$NODE3_IP" \
            "" \
            "borrow initial guard hunt corn trust student opera now economy thumb argue" \
            ""

# Getting nodes local node identity
get_node_identity "node1" NODE1_LOCAL_ID
echo "Local node1 identity is '$NODE1_LOCAL_ID'"
get_node_identity "node2" NODE2_LOCAL_ID
echo "Local node2 identity is '$NODE2_LOCAL_ID'"
get_node_identity "node3" NODE3_LOCAL_ID
echo "Local node3 identity is '$NODE3_LOCAL_ID'"

# Constructing bootnodes list
BOOTNODES_LIST="--bootnodes /ip4/$NODE1_IP/tcp/30333/p2p/$NODE1_LOCAL_ID --bootnodes /ip4/$NODE2_IP/tcp/30333/p2p/$NODE2_LOCAL_ID --bootnodes /ip4/$NODE3_IP/tcp/30333/p2p/$NODE3_LOCAL_ID"
echo "Bootnodes list is '$BOOTNODES_LIST'"

echo "Sleeping 10 sec before node remove to be sure that keys are added..."
sleep 10

# Recreating nodes containers
# Removing nodes containers
docker rm -f node1 node2 node3
echo "Sleeping 5 seconds to be sure that nodes are stopped and deleted..."
sleep 5

# Relaunching nodes with bootnodes list
# Starting node1
launch_node "node1" \
            "$NODE1_IP" \
            "-p 9944:9944 -p 9933:9933 -p 9955:9955" \
            "mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud" \
            "$BOOTNODES_LIST"

# Starting node2
launch_node "node2" \
            "$NODE2_IP" \
            "" \
            "fiscal toe illness tunnel pill spatial kind dash educate modify sustain suffer" \
            "$BOOTNODES_LIST"

# Starting node3
launch_node "node3" \
            "$NODE3_IP" \
            "" \
            "borrow initial guard hunt corn trust student opera now economy thumb argue" \
            "$BOOTNODES_LIST"

echo "Chain is fully initilized!"
docker ps
