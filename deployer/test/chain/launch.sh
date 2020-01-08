#!/bin/bash 
echo "Creating docker network for archipel chain test..."
docker network create archipel --subnet=172.28.42.0/16

echo "Starting node 1..."
docker run -d --name node1 -p 9944:9944 -p 9933:9933 -p 9955:9955 --network archipel --ip 172.28.42.2 -v $(pwd):/tmp/files archipel/chain --base-path /tmp/files/node1 --chain /tmp/files/customSpecRaw.json --validator --name Node1

echo "Installing curl in node 1 container..."
docker exec node1 apt-get install -y curl

echo "Inserting aura key in node 1 keystore..."
docker exec node1 curl http://localhost:9933 -H "Content-Type:application/json;charset=utf-8" -d \
  '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"author_insertKey",
    "params": [
      "aura",
      "mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud",
      "0xa412ff27d62c6f40943242e9be88bebb9d3ac95293f3f8be732465f66f79853c"
    ]
}'

echo "Inserting granpa key in node 1 keystore..."
docker exec node1 curl http://localhost:9933 -H "Content-Type:application/json;charset=utf-8" -d \
  '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"author_insertKey",
    "params": [
      "gran",
      "mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud",
      "0x9c1e71dc004b8bd118f479051b85bf4c7afd256df7883a94c3fbf96fc8b3513b"
    ]
}'

sleep 5

echo "Getting local node1 identity..."
NODE1_LOCAL_ID=$(docker logs node1 2>&1 | grep "Local node identity is" | tail -1 | grep -oE '[^ ]+$' --color=never)
echo "Local node1 identity is '$NODE1_LOCAL_ID'"

echo "Restarting node 1 container..."
docker restart node1

echo "Starting node 2..."
docker run -d --name node2 --network archipel --ip 172.28.42.3 -v $(pwd):/tmp/files archipel/chain --base-path /tmp/files/node2 --chain /tmp/files/customSpecRaw.json --validator --name Node2 --bootnodes /ip4/172.28.42.2/tcp/30333/p2p/$NODE1_LOCAL_ID

echo "Installing curl in node 2 container..."
docker exec node2 apt-get install -y curl

echo "Inserting aura key in node 2 keystore..."
docker exec node2 curl http://localhost:9933 -H "Content-Type:application/json;charset=utf-8" -d \
  '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"author_insertKey",
    "params": [
      "aura",
      "fiscal toe illness tunnel pill spatial kind dash educate modify sustain suffer",
      "0xda778eef939033b7137f78e22cfa1c751c3c95a69710bb3bf8756195e3e0b377"
    ]
}'

echo "Inserting granpa key in node 2 keystore..."
docker exec node2 curl http://localhost:9933 -H "Content-Type:application/json;charset=utf-8" -d \
  '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"author_insertKey",
    "params": [
      "gran",
      "fiscal toe illness tunnel pill spatial kind dash educate modify sustain suffer",
      "0xcdc031baee1d418c3979dc7e642989e8e8d81996ca3b46e3eb95a6e2dab27695"
    ]
}'

echo "Restarting node 2 container..."
docker restart node2

echo "Starting node 3..."
docker run -d --name node3 --network archipel --ip 172.28.42.4 -v $(pwd):/tmp/files archipel/chain --base-path /tmp/files/node3 --chain /tmp/files/customSpecRaw.json --validator --name Node3 --bootnodes /ip4/172.28.42.2/tcp/30333/p2p/$NODE1_LOCAL_ID

echo "Installing curl in node 3 container..."
docker exec node3 apt-get install -y curl

echo "Inserting aura key in node 3 keystore..."
docker exec node3 curl http://localhost:9933 -H "Content-Type:application/json;charset=utf-8" -d \
  '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"author_insertKey",
    "params": [
      "aura",
      "borrow initial guard hunt corn trust student opera now economy thumb argue",
      "0x4e303afc1135b3927beaddf5e1462fd7f3c62ee2922e7beee21ae7d32681d10d"
    ]
}'

echo "Inserting granpa key in node 3 keystore..."
docker exec node3 curl http://localhost:9933 -H "Content-Type:application/json;charset=utf-8" -d \
  '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"author_insertKey",
    "params": [
      "gran",
      "borrow initial guard hunt corn trust student opera now economy thumb argue",
      "0x61a9acd57b43de72b68152ee1b5685cd89af28753d05dd7958da0d1f1c9de7cd"
    ]
}'

echo "Restarting node 3 container..."
docker restart node3

echo "Chain is initilized!"
docker ps