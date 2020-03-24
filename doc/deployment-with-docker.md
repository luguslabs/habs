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