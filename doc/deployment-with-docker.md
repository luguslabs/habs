# Archipel Deployment with Docker

## Requirements

- 3 Linux or macOS machines
- Docker and Docker Compose installed
- Wireguard Kernel modules installed 
  - https://www.wireguard.com/install/
- Opened ports
    - 51820:51820/udp - WireGuard VPN
    - 3000:3000/tcp - Orchestrator API port (**WARNING!** The external access to this port must be denied! For now there is no authentication mechanism!)

## Process

### Step 1: Initialize Polkadot Keys
- [Polkadot Keys Initialization](https://github.com/luguslabs/archipel/blob/master/doc/polkadot-keys-initialization.md)

### Step 2: Generate Archipel Federation configuration file
- Using [Archipel CLI](../cli/README.md)
- Save it with name **"archipel-config.zip"**
- Remember password provided in Archipel CLI it will be asked later
- Copy this file to each machine

### Step 3: Create docker-compose file
#### On each machine
```bash
version: '3.4'
services:
  archipel:
    image: luguslabs/archipel:latest
    volumes:
      - 'archipel:/root/chain/data'
      - 'archipel_service:/service'
      - '/var/run/docker.sock:/var/run/docker.sock'
      - './archipel-config.zip:/config/archipel-config.zip'
    ports:
      - '51820:51820/udp'
      - '3000:3000/tcp'
    privileged: true
    env_file:
      - .env
    restart: always

volumes:
  archipel: {}
  archipel_service: {}

```

### Step 4: Create .env file
#### On each machine
```bash
CONFIG_FILE='true'
NODE_ID=3
CONFIG_FILE_PASSWORD='your_password'
```
* At every machine you must select node id from 1 to 3 and put in NODE_ID variable in .env file. 
  * **WARNING!!!** Each node must have unique NODE_ID! If not Archipel federation will not boot or will be broken.
* **CONFIG_FILE_PASSWORD** must contain password provided to **Archipel CLI** in **Step 2**.

**Environment variables**

| Variable | Description | Values |
|----------|-------------|--------|
| `CONFIG_FILE` | Try to load configuration from configuration archive or not. | boolean |
| `CONFIG_FILE_PASSWORD` | Configuration archive can be protected by a password. | string |
| `NODE_ID` | Every configuration archive contains configuration of multiple nodes.<br> You must select node number. | integer |

### Step 5: Boot and enjoy

#### On each machine
4.1 Launch Archipel
```bash
docker-compose up -d
```

### Step 6: Check Archipel Orchestrator API

Try to access Archipel Orchestrator API:
```bash
curl -s http://host_or_container_ip:3000
```

* If you have `jq` installed you can add `| jq .` to curl command to see well formatted json.
* **WARNING!!!** You must be sure that Archipel Orchestrator API is not accessible from exterior. For now there is no authentication mechanism!

### Step 7: Launch Archipel UI
Switch to another directory.

#### Create docker-compose.yaml file
```bash
version: '3.4'
services:
  archipel-ui:
    image: luguslabs/archipel-ui:latest
    ports:
      - '8080:80/tcp'
    env_file:
      - .env
    restart: always
```

#### Create .env file
```bash
REACT_APP_API_URL=http://host_or_container_ip:3000
```

#### Launch Archipel UI
```bash
docker-compose up -d
```

#### Use localhost or open port 8080 at host machine
* Archipel UI will be available at **http://localhost:8080** or **http://host_ip:8080**.

#### How to use Archipel UI
- deploy Archipel UI at every machine with good orchestrator API URL
- deploy Archipel UI at one machine and then change API URL in UI

### Step 8: Check the Archipel Federation with Archipel UI
- Check if every node has any peers
- Check if node has received metrics from other nodes
- Check if one of nodes is in active mode

**Congratulations! Your first Archipel federation is working!**

# For Ninjas - Archipel Deployment without config file

## Process
```
# Create an .env file
cat <<EOF >.env
ARCHIPEL_NODE_ALIAS=archipel1
ARCHIPEL_LISTEN_PORT=30334 
ARCHIPEL_KEY_SEED=mushroom ladder ...
ARCHIPEL_NODE_KEY_FILE=
ARCHIPEL_RESERVED_PEERS=
ARCHIPEL_SUSPEND_SERVICE=false
ARCHIPEL_NAME=test-archipel
ARCHIPEL_AUTHORITIES_SR25519_LIST=5FmqMTG...
ARCHIPEL_AUTHORITIES_ED25519_LIST=5FbQNUq...
SERVICE=polkadot
POLKADOT_NAME=test-name
POLKADOT_PREFIX=node-
POLKADOT_IMAGE=parity/polkadot:latest
POLKADOT_KEY_GRAN=april shift ...
POLKADOT_KEY_BABE=region run ...
POLKADOT_KEY_IMON=screen sustain ...
POLKADOT_KEY_PARA=produce hover ...
POLKADOT_KEY_AUDI=oak tail ...
POLKADOT_RESERVED_NODES=
POLKADOT_TELEMETRY_URL=
POLKADOT_NODE_KEY_FILE=
POLKADOT_SIMULATE_SYNCH=true
POLKADOT_ADDITIONAL_OPTIONS=--db-cache 512
# WireGuard config
WIREGUARD_PRIVATE_KEY=SJWzBT8....
WIREGUARD_ADDRESS=10.0.1.1/32
WIREGUARD_LISTEN_PORT=51820
WIREGUARD_PEERS_PUB_ADDR=9dcIYKj...,xg3wSS+...,gMjvfQGXWYJ...
WIREGUARD_PEERS_ALLOWED_IP=10.0.1.1/32,10.0.1.2/32,10.0.1.3/32
WIREGUARD_PEERS_EXTERNAL_ADDR=<public_ip>:51820,<public_ip>:51820,<public_ip>:51820
EOF

# Creating docker volumes
docker volume create archipel
docker volume create archipel_service

# Launch docker container
docker run -d --name "archipel" \
  --cap-add net_admin --cap-add sys_module \
  -p 51820:51820 \
  -v archipel:/root/chain/data \
  -v archipel_service:/service \
  --env-file .env \
  luguslabs/archipel:latest
```

## Environment Variables Information
- [DAppNode Package Archipel Environment Variables](https://github.com/luguslabs/DAppNodePackage-archipel#without-config-file)
