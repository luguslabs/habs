#!/bin/bash
ARCHIPEL_ORCHESTRATOR_VERSION="0.0.2"
# Launch Archipel orchestrator in docker container
function launch_orchestrator () {
  echo "Starting $1..."
  # Launching docker container of node
  docker run -d --name "$1" \
    --network archipel \
    -v /var/run/docker.sock:/var/run/docker.sock \
    --env NODE_WS="$2" \
    --env MNEMONIC="$3" \
    --env POLKADOT_NAME="$4" \
    --env POLKADOT_KEY="$5" \
    --env POLKADOT_IMAGE="$6" \
    --env POLKADOT_PREFIX="$7" \
    --env DEBUG="app,chain,docker,metrics,polkadot,service" \
    --env ALIVE_TIME=60000 \
    luguslabs/archipel-orchestrator:$ARCHIPEL_ORCHESTRATOR_VERSION 

  echo "Waiting 5 seconds to be sure that orchestrator is started..."
  sleep 5
}

launch_orchestrator "orchestrator1" "ws://172.28.42.2:9944" "mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud" "validator1" "0x5e4b8a226eb3435598b72ffbef1b4d37a64c10bea3b8d6ff28800e0b9898dcb7" "chevdor/polkadot:0.4.4" "node1-"

launch_orchestrator "orchestrator2" "ws://172.28.42.3:9944" "fiscal toe illness tunnel pill spatial kind dash educate modify sustain suffer" "validator2" "0x5e4b8a226eb3435598b72ffbef1b4d37a64c10bea3b8d6ff28800e0b9898dcb7" "chevdor/polkadot:0.4.4" "node2-"

launch_orchestrator "orchestrator3" "ws://172.28.42.4:9944" "borrow initial guard hunt corn trust student opera now economy thumb argue" "validator3" "0x5e4b8a226eb3435598b72ffbef1b4d37a64c10bea3b8d6ff28800e0b9898dcb7" "chevdor/polkadot:0.4.4" "node3-"

echo "Orchestrators were created."
docker ps
