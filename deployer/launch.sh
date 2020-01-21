#!/bin/bash

#!/bin/bash
ARCHIPEL_VERSION="latest"
# Launch Archipel orchestrator in docker container
function launch_archipel () {
  echo "Starting $1..."
  # Launching docker container of node
  docker run -d --name "$1" $9 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v $(pwd)/$1:/root/chain/data \
    --network archipel \
    --ip "${10}" \
    --env ARCHIPEL_NODE_ALIAS=$1 \
    --env POLKADOT_NAME=$3 \
    --env POLKADOT_KEY=$4 \
    --env POLKADOT_IMAGE=$5 \
    --env POLKADOT_PREFIX=$6 \
    --env ARCHIPEL_KEY_SEED="$2" \
    --env ARCHIPEL_AUTHORITIES_SR25519_LIST="$7" \
    --env ARCHIPEL_AUTHORITIES_ED25519_LIST="$8" \
    --env DEBUG="app,chain,docker,metrics,polkadot,service" \
    luguslabs/archipel:$ARCHIPEL_VERSION

  echo "Waiting 5 seconds to be sure that archipel is started..."
  sleep 5
}

# Creating a docker network for Archipel chain
echo "Creating docker network for archipel test..."
docker network create archipel --subnet=172.28.42.0/16

launch_archipel "archipel1" \
                "mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud" \
                "validator1" \
                "0x5e4b8a226eb3435598b72ffbef1b4d37a64c10bea3b8d6ff28800e0b9898dcb7" \
                "chevdor/polkadot:0.4.4" \
                "node1-" \
                "5FmqMTGCW6yGmqzu2Mp9f7kLgyi5NfLmYPWDVMNw9UqwU2Bs,5H19p4jm177Aj4X28xwL2cAAbxgyAcitZU5ox8hHteScvsex,5DqDvHkyfyBR8wtMpAVuiWA2wAAVWptA8HtnsvQT7Uacbd4s" \
                "5FbQNUq3kDC9XHtQP6iFP5PZmug9khSNcSRZwdUuwTz76yQY,5GiUmSvtiRtLfPPAVovSjgo6NnDUDs4tfh6V28RgZQgunkAF,5EGkuW6uSqiZZiZCyVfQZB9SKw5sQc4Cok8kP5aGEq3mpyVj" \
                "-p 9944:9944" \
                "172.28.42.2"

launch_archipel "archipel2" \
                "fiscal toe illness tunnel pill spatial kind dash educate modify sustain suffer" \
                "validator2" "0x5e4b8a226eb3435598b72ffbef1b4d37a64c10bea3b8d6ff28800e0b9898dcb7" \
                "chevdor/polkadot:0.4.4" \
                "node2-" \
                "5FmqMTGCW6yGmqzu2Mp9f7kLgyi5NfLmYPWDVMNw9UqwU2Bs,5H19p4jm177Aj4X28xwL2cAAbxgyAcitZU5ox8hHteScvsex,5DqDvHkyfyBR8wtMpAVuiWA2wAAVWptA8HtnsvQT7Uacbd4s" \
                "5FbQNUq3kDC9XHtQP6iFP5PZmug9khSNcSRZwdUuwTz76yQY,5GiUmSvtiRtLfPPAVovSjgo6NnDUDs4tfh6V28RgZQgunkAF,5EGkuW6uSqiZZiZCyVfQZB9SKw5sQc4Cok8kP5aGEq3mpyVj" \
                "" \
                "172.28.42.3"

launch_archipel "archipel3" \
                "borrow initial guard hunt corn trust student opera now economy thumb argue" \
                "validator3" \
                "0x5e4b8a226eb3435598b72ffbef1b4d37a64c10bea3b8d6ff28800e0b9898dcb7" \
                "chevdor/polkadot:0.4.4" \
                "node3-" \
                "5FmqMTGCW6yGmqzu2Mp9f7kLgyi5NfLmYPWDVMNw9UqwU2Bs,5H19p4jm177Aj4X28xwL2cAAbxgyAcitZU5ox8hHteScvsex,5DqDvHkyfyBR8wtMpAVuiWA2wAAVWptA8HtnsvQT7Uacbd4s" \
                "5FbQNUq3kDC9XHtQP6iFP5PZmug9khSNcSRZwdUuwTz76yQY,5GiUmSvtiRtLfPPAVovSjgo6NnDUDs4tfh6V28RgZQgunkAF,5EGkuW6uSqiZZiZCyVfQZB9SKw5sQc4Cok8kP5aGEq3mpyVj" \
                "" \
                "172.28.42.4"

echo "Launching and Opening Archipel UI..."
docker run -d -p 8080:80 --name archipel-ui luguslabs/archipel-ui
echo "Archipel UI is running at http://localhost:8080 ..."

echo "Archipel was created."
docker ps
