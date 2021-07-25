#!/bin/bash
ARCHIPEL_ORCHESTRATOR_VERSION="test"
# Launch Archipel orchestrator in docker container
function launch_orchestrator () {
  echo "Starting $1..."
  # Launching docker container of node
  docker run -d --name "$1" \
    --network archipel \
    -v $1_service:/service \
    -v /var/run/docker.sock:/var/run/docker.sock \
    --env DEBUG="app,chain,docker,heartbeats,polkadot,service" \
    --env NODE_WS="$2" \
    --env MNEMONIC="$3" \
    --env ALIVE_TIME=12 \
    --env SERVICES="polkadot" \
    --env ARCHIPEL_SERVICE_MODE="orchestrator" \
    --env NODES_WALLETS="5FmqMTGCW6yGmqzu2Mp9f7kLgyi5NfLmYPWDVMNw9UqwU2Bs,5H19p4jm177Aj4X28xwL2cAAbxgyAcitZU5ox8hHteScvsex,5DqDvHkyfyBR8wtMpAVuiWA2wAAVWptA8HtnsvQT7Uacbd4s" \
    --env ARCHIPEL_NAME="test-archipel" \
    --env NODE_GROUP=1 \
    --env NODE_GROUP_ID=1 \
    --env POLKADOT_NAME="$4" \
    --env POLKADOT_PREFIX="$5" \
    --env POLKADOT_IMAGE="parity/polkadot:latest" \
    --env POLKADOT_DATABASE_PATH="/polkadot/.local/share/polkadot/chains/polkadot" \
    --env POLKADOT_BACKUP_URL="http://127.0.0.1:4343/db.tar.gz" \
    --env POLKADOT_KEY_GRAN="april shift pupil quit mandate school cost oven gospel castle brain student" \
    --env POLKADOT_KEY_BABE="region run sunset rule light gap cool element angle example laundry stadium" \
    --env POLKADOT_KEY_IMON="screen sustain clog husband assist noble artist sea fringe afford coil hawk" \
    --env POLKADOT_KEY_PARA="produce hover hurdle lobster december slight hat note quit bomb drama notice" \
    --env POLKADOT_KEY_ASGN="rough open marine belt rib violin december gesture word fall catalog side" \
    --env POLKADOT_KEY_AUDI="oak tail stomach fluid trade aunt fire fringe mercy roast style garlic" \
    --env POLKADOT_ADDITIONAL_OPTIONS="--db-cache 512" \
    --env POLKADOT_SIMULATE_SYNCH="true" \
    luguslabs/archipel-orchestrator:$ARCHIPEL_ORCHESTRATOR_VERSION 

  echo "Waiting 5 seconds to be sure that orchestrator is started..."
  sleep 5
}

docker network create archipel

docker volume create orchestrator1_service
docker volume create orchestrator2_service
docker volume create orchestrator3_service

launch_orchestrator "orchestrator1" "ws://172.28.42.2:9944" "mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud" "validator1" "node1-"

launch_orchestrator "orchestrator2" "ws://172.28.42.3:9944" "fiscal toe illness tunnel pill spatial kind dash educate modify sustain suffer" "validator2" "node2-"

launch_orchestrator "orchestrator3" "ws://172.28.42.4:9944" "borrow initial guard hunt corn trust student opera now economy thumb argue" "validator3" "node3-"

echo "Orchestrators were created."
docker ps
