# Archipel Deployment with Docker

## Requirements

- 3 Linux or macOS machines
- Docker and Docker Compose installed
- Opened ports
    - 30333/tcp - **Warning!** This port must be accessible only by Archipel machines! (Filter by source IP addresses)

## Process

### Step 1: Initialize Archipel Keys
- [Archipel Keys Initialization](https://github.com/luguslabs/archipel/blob/master/doc/archipel-keys-initialization.md)


### Step 2: Initialize Polkadot Keys
- [Polkadot Keys Initialization](https://github.com/luguslabs/archipel/blob/master/doc/polkadot-keys-initialization.md)

### Step 3: Create docker-compose and .env files

#### On each machine
3.1 Create docker-compose.yml file
```bash
version: '3.4'
services:
  archipel:
    image: luguslabs/archipel
    volumes:
      - 'data:/root/chain/data'
      - '/var/run/docker.sock:/var/run/docker.sock'
    env_file:
      - .env
    ports:
      - '30333:30333'
    restart: always
volumes:
  data: {}
```

3.2 Create .env file
```bash
ARCHIPEL_NODE_ALIAS=archipel-x
ARCHIPEL_KEY_SEED=suspect curtain...
ARCHIPEL_AUTHORITIES_SR25519_LIST=5ESKBji...
ARCHIPEL_AUTHORITIES_ED25519_LIST=5D4ZijF...
ARCHIPEL_CHAIN_ADDITIONAL_PARAMS=
SERVICE=polkadot
POLKADOT_NAME=archipel-validator-x
POLKADOT_IMAGE=parity/polkadot:latest
POLKADOT_PREFIX=kusama-
POLKADOT_KEY_GRAN=fly wife...
POLKADOT_KEY_BABE=daughter denial...
POLKADOT_KEY_PARA=disorder embark...
POLKADOT_KEY_IMON=canal barely...
POLKADOT_KEY_AUDI=shoe absorb...
```
- Set environment variables to good values on each machine. 
    - Set every variable except `ARCHIPEL_CHAIN_ADDITIONAL_PARAMS` that must be empty for now.
    - You can choose any value for `ARCHIPEL_NODE_ALIAS` and `POLKADOT_NAME`. (Please avoid spaces and special characters)
    - `ARCHIPEL_KEY_SEED`, `ARCHIPEL_AUTHORITIES_SR25519_LIST`, `ARCHIPEL_AUTHORITIES_ED25519_LIST` variables were created during [Archipel Keys Initialisation](https://github.com/luguslabs/archipel/blob/master/doc/archipel-keys-initialisation.md).
    - `POLKADOT_KEY_GRAN`, `POLKADOT_KEY_BABE`, `POLKADOT_KEY_PARA`, `POLKADOT_KEY_IMON`, `POLKADOT_KEY_AUDI` mnemonics were created during [Polkadot Keys Initialisation](https://github.com/luguslabs/archipel/blob/master/doc/polkadot-keys-initialisation.md).
    - All variables except `ARCHIPEL_NODE_ALIAS`, `ARCHIPEL_KEY_SEED`, `POLKADOT_NAME` must be the same on each machine.
- [Detailed Environment Variables Explanation](https://github.com/luguslabs/archipel#environment-variables)

### Step 4: First boot and `Peer ID` extraction

#### On each machine
4.1 Launch Archipel
```bash
docker-compose up -d
```
- Please wait a little bit before `Peer Id` retrieval.

4.2 Retrieve `Peer ID`
```bash
docker-compose logs | grep "Peer ID"
```
- You will see `archipel_1  | Peer ID: QmdrzHAHz...` multiple times.
    - Save it for every Archipel node.

### Step 5: Bootnode list contruction
5.1 Construct Bootnode list
- You must have 3 different `Peer ID` extracted in the last step.
- You must know the IP address of each machine and assure that the port `30333/tcp` can be accessed by any machine of Archipel federation.

5.2 Create an entry for every node

**Example**
```bash
# Bootnodes entry example
--bootnodes /ip4/$IP_ADDRESS_OF_MACHINE/tcp/30333/p2p/$PEER_ID
```

5.3 Create the bootnodes list

**Example**
```bash
--bootnodes /ip4/10.166.0.2/tcp/30333/p2p/QmdCC9eZoZmDUxn6KJU3HzSwLk4HcbUJdHXPjxxK9A8tJ6 --bootnodes /ip4/10.138.0.2/tcp/30333/p2p/QmNsHE7uUysQu2PGAzFRU8gkFwd1Dbt9P3XUEFyRLHFDef --bootnodes /ip4/10.140.0.3/tcp/30333/p2p/QmTZGdEdK4sKkX8KBxVcmwPhVbbP62puhn2xX4qNH299VU
```

### Step 6: The final boot with bootnode list
#### On each machine

6.1 Put bootnode list value in `ARCHIPEL_CHAIN_ADDITIONAL_PARAMS` variable in `.env` file

**Example**
```bash
...
ARCHIPEL_CHAIN_ADDITIONAL_PARAMS=--bootnodes /ip4/10.166.0.2/tcp/30333/p2p/QmdCC9eZoZmDUxn6KJU3HzSwLk4HcbUJdHXPjxxK9A8tJ6 --bootnodes /ip4/10.138.0.2/tcp/30333/p2p/QmNsHE7uUysQu2PGAzFRU8gkFwd1Dbt9P3XUEFyRLHFDef --bootnodes /ip4/10.140.0.3/tcp/30333/p2p/QmTZGdEdK4sKkX8KBxVcmwPhVbbP62puhn2xX4qNH299VU
...
```

6.2 Restart Archipel node
```bash
docker-compose up -d
```

### Step 7: Check the Archipel Federation

7.1 Check peer number
```bash
docker-compose logs | grep "Peer number"
```
- You must see at least one entry `Peer number` different from 0.

**Example**
```bash 
archipel_1  | Peer number: 2
```

7.2 Check Archipel Federation

**Docker**

#### On each machine
```bash
docker ps
```
- At least at one machine will run a container named "`POLKADOT_PREFIX`-polkadot-validator".
    - `POLKADOT_PREFIX` - env variable set in .env file.
    - The Archipel node on this machine was elected as leader of the federation.

- On all other machines, a conatainer named "`POLKADOT_PREFIX`-polkadot-sync" will be running.
    - The Archipel nodes on these machines are in passive mode.

**Congratulations! Your first Archipel federation is working!**

## Bonus: Archipel UI and Archipel Non-Validator Node Deployment

## Requirements

- Linux or macOS machine
- Docker and Docker Compose installed
- Opened ports
    - 80/tcp 
    - 443/tcp
- A domain name

## In this section you will deploy

- **Archipel UI** - Connects to an Archipel node to show Archipel Federation information.
- **Archipel Non-Validator Node** - Synchronize with Archipel Federation to get its state.
- **Nginx Proxy** - HTTPS proxy for Archipel UI and Archipel Node.
- **Lets Encrypt Proxy Compagnon** - Automatic letsencrypt certificate generation and renewal.

### Step 1: Subdomains creation

1.1 Create a subdomain for Archipel UI

**Example**
```
archipel-ui.domain.com
```
- Make point this subdomain to the machine on which Archipel UI and Archipel Non-Validator node will be deployed.

1.2 Create a subdomain for Archipel Non-Validator Node

**Example** 
```
archipel-node.domain.com
```
- Make point this subdomain to the machine on which Archipel UI and Archipel Non-Validator node will be deployed.

### Step 2: Deployment

2.1 Create a docker-compose.yml file
```bash
version: '2'
services:
  archipel:
    image: luguslabs/archipel-node:latest
    volumes:
      - 'data:/root/chain/data'
    env_file:
      - .env
    restart: always

  archipel-ui:
    image: luguslabs/archipel-ui:latest
    environment:
      - VIRTUAL_HOST=archipel-ui.domain.com
      - LETSENCRYPT_HOST=archipel-ui.domain.com

  nginx-proxy:
    image: jwilder/nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/etc/nginx/vhost.d"
      - "/usr/share/nginx/html"
      - "/var/run/docker.sock:/tmp/docker.sock:ro"
      - "/etc/nginx/certs"
    restart: always

  letsencrypt-nginx-proxy-companion:
    image: jrcs/letsencrypt-nginx-proxy-companion
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
    volumes_from:
      - "nginx-proxy"
    restart: always

volumes:
  data: {}
```

- Fill the variables `VIRTUAL_HOST`, `LETSENCRYPT_HOST` with the subdomain name created for the Archipel UI.

2.2 Create .env file
```bash
ARCHIPEL_NODE_ALIAS=archipel-node
ARCHIPEL_AUTHORITIES_SR25519_LIST=5ESK...
ARCHIPEL_AUTHORITIES_ED25519_LIST=5D4Z...
ARCHIPEL_CHAIN_ADDITIONAL_PARAMS=--bootnodes /ip4/...

VIRTUAL_HOST=archipel-node.domain.com
VIRTUAL_PORT=9944
LETSENCRYPT_HOST=archipel-node.domain.com
```

- Fill the variables `ARCHIPEL_AUTHORITIES_SR25519_LIST`, `ARCHIPEL_AUTHORITIES_ED25519_LIST`, `ARCHIPEL_CHAIN_ADDITIONAL_PARAMS` with the same values as in main section.
- Fill the variables `VIRTUAL_HOST`, `LETSENCRYPT_HOST` with the subdomain name created for the Archipel Non-Validator Node.

2.3 Launch Archipel UI and Archipel Non-Validator Node

```bash
docker-compose up -d
```
- Please wait one or several minutes for Letsencrypt to generate certificates.

### Step 3: Checking Archipel UI and Archipel Non-Validator Node access

Go to subdomain created for the Archipel UI.

**Archipel UI Access Example**
```bash
https://archipel-ui.domain.com
```

**Archipel Non-Validator Node Access Example**
```bash
wss://archipel-node.domain.com
```
