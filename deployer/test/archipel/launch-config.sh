#!/bin/bash
ARCHIPEL_VERSION="test"

SCRIPTPATH="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

echo "$SCRIPTPATH"

# Launch Archipel orchestrator in docker container
function launch_archipel () {
  echo "Starting $1..."
  # Launching docker container of node
  docker run -d --name "$1" \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v $(pwd)/test-config.zip:/config/archipel-config.zip \
    -v $1:/root/chain/data \
    -v $1_service:/service \
    -p ${3}:3000 \
    --network archipel \
    --ip "$2" \
    --cap-add=NET_ADMIN \
    --cap-add=SYS_MODULE \
    --privileged \
    --env CONFIG_FILE=true \
    --env CONFIG_FILE_PASSWORD=test \
    --env NODE_ID=$4 \
    luguslabs/archipel:$ARCHIPEL_VERSION

  echo "Waiting 10 seconds to be sure that archipel is started..."
  sleep 10
}

echo "$(pwd)/test-config.zip"

NODE1_IP="172.28.42.2"
NODE2_IP="172.28.42.3"
NODE3_IP="172.28.42.4"
NODE4_IP="172.28.42.5"

# Creating a docker network for Archipel chain
echo "Creating docker network for archipel test..."
docker network create archipel --subnet=172.28.42.0/16

docker volume create archipel1
docker volume create archipel1_service
docker volume create archipel2
docker volume create archipel2_service
docker volume create archipel3
docker volume create archipel3_service
docker volume create archipel4
docker volume create archipel4_service


launch_archipel "archipel1" \
                "$NODE1_IP" \
                3001 \
                1 \

launch_archipel "archipel2" \
                "$NODE2_IP" \
                3002 \
                2 \

launch_archipel "archipel3" \
                "$NODE3_IP" \
                3003 \
                3 \

launch_archipel "archipel4" \
                "$NODE4_IP" \
                3004 \
                4 \


echo "Launching UI..."

ARCHIPEL_UI_IP="172.28.42.6"

echo "Launching Archipel UI..."
docker run -d -p 3000:80 --name "archipel-ui" \
           --network archipel \
           --ip "$ARCHIPEL_UI_IP" \
           --env REACT_APP_API_URL="http://localhost:3001" \
           luguslabs/archipel-ui:$ARCHIPEL_VERSION
echo "Archipel was launched..."
echo "-------------------- [Dockers Containers List] ---------------------"
docker ps
echo "--------------------------------------------------------"

echo "-------------------- [API Entpoints] ---------------------"
echo "Archipel Node 1 API Endpoint http://$NODE1_IP:3000/ is available at http://localhost:3001/" 
echo "Archipel Node 2 API Endpoint http://$NODE2_IP:3000/ is available at http://localhost:3002/" 
echo "Archipel Node 3 API Endpoint http://$NODE3_IP:3000/ is available at http://localhost:3003/" 
echo "Archipel Node 4 API Endpoint http://$NODE4_IP:3000/ is available at http://localhost:3004/" 
echo "--------------------------------------------------------"

echo "-------------------- [ARCHIPEL UI] ---------------------"
echo "Archipel UI http://$ARCHIPEL_UI_IP/ is available at http://localhost:3000/" 
echo "--------------------------------------------------------"
