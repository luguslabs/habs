#!/bin/bash
ARCHIPEL_CHAIN_VERSION="0.0.1"
# Launch Archipel node in docker container
function launch_node () {
  echo "Starting $1..."
  # Launching docker container of node
  docker run -d --name "$1" $3 \
    --network archipel \
    --ip "$2" \
    -v $(pwd):/tmp/files luguslabs/archipel-chain:$ARCHIPEL_CHAIN_VERSION \
    --rpc-cors "all" \
    --unsafe-rpc-external \
    --unsafe-ws-external \
    --base-path /tmp/files/$1 \
    --chain /tmp/files/customSpecRaw.json \
    --validator \
    --name "$1" $4 \

  echo "Waiting 5 seconds to be sure that node is started..."
  sleep 5
}

# Add key to nodes keystore
function add_key () {
  echo "Inserting aura key in $1 keystore..."
  # Adding wallet by curl request in node keystore
  docker exec $1 curl http://localhost:9933 -H "Content-Type:application/json;charset=utf-8" -d \
    '{
      "jsonrpc":"2.0",
      "id":1,
      "method":"author_insertKey",
      "params": [
        "'"$2"'",
        "'"$3"'",
        "'"$4"'"
      ]
  }'
}

# Add keys to node keystore
function add_keys_to_node () {
  # Add aura key to keystore
  add_key "$1" "aura" "$2" "$3"
  # Add granpa key to keystore
  add_key "$1" "gran" "$2" "$4"
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
launch_node "node1" "$NODE1_IP" "-p 9944:9944 -p 9933:9933 -p 9955:9955" ""

# Adding key to node1
add_keys_to_node "node1" \
  "mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud" \
  "0xa412ff27d62c6f40943242e9be88bebb9d3ac95293f3f8be732465f66f79853c" \
  "0x9c1e71dc004b8bd118f479051b85bf4c7afd256df7883a94c3fbf96fc8b3513b" \

# Starting node2
launch_node "node2" "$NODE2_IP" "" ""

# Adding key to node2
add_keys_to_node "node2" \
  "fiscal toe illness tunnel pill spatial kind dash educate modify sustain suffer" \
  "0xda778eef939033b7137f78e22cfa1c751c3c95a69710bb3bf8756195e3e0b377" \
  "0xcdc031baee1d418c3979dc7e642989e8e8d81996ca3b46e3eb95a6e2dab27695" \

# Starting node3
launch_node "node3" "$NODE3_IP" "" ""

# Adding key to node3
add_keys_to_node "node3" \
  "borrow initial guard hunt corn trust student opera now economy thumb argue" \
  "0x4e303afc1135b3927beaddf5e1462fd7f3c62ee2922e7beee21ae7d32681d10d" \
  "0x61a9acd57b43de72b68152ee1b5685cd89af28753d05dd7958da0d1f1c9de7cd" \

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

# Recreating nodes containers
# Removing nodes containers
docker rm -f node1 node2 node3
echo "Sleeping 5 seconds to be shure that nodes are stopped and deleted..."
sleep 5

# Relaunching nodes with bootnodes list
launch_node "node1" "$NODE1_IP" "-p 9944:9944 -p 9933:9933 -p 9955:9955" "$BOOTNODES_LIST"
#launch_node "node1" "$NODE1_IP" "" "$BOOTNODES_LIST"
launch_node "node2" "$NODE2_IP" "" "$BOOTNODES_LIST"
launch_node "node3" "$NODE3_IP" "" "$BOOTNODES_LIST"

echo "Chain is fully initilized!"
docker ps
