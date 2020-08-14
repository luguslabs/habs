# Archipel Federation Testing

## Requirements

- Linux or macOS machine
- Docker installed
- Wireguard Kernel modules installed
  - https://www.wireguard.com/install/

## Step 1: Bootstrap a federation of 4 nodes

What will be launched:

- **4 Archipel nodes** (Archipel Substrate Validator Node + Orchestrator)
- **4 Polkadot KUSAMA Nodes**

  - 1 Validator Node
  - 2 Passive Nodes
  - 1 Sentry node

- **Archipel UI instance**

Connection between Archipel nodes and Polkadot KUSAMA nodes are secured by **WireGuard VPN**!

### 1.1 Clone Archipel Repository

```bash
git clone https://github.com/luguslabs/archipel.git
```

### 1.2 Launch federation

```bash
cd archipel/deployer/test
./launch.sh
```

## Step 2: Check if federation was launched

### 2.1 Check Archipel UI

The execution of **[launch.sh](../deployer/test/launch.sh)** script will generate the URL for Archipel UI.

<p align="center">
 <img src=./images/archipel-launch-ui.png width = 465>
</p>

Archipel UI will be available at http://172.28.42.6/ on container and http://localhost:3000 on host.

<p align="center">
 <img src=./images/archipel-ui-1.png width = 1000>
</p>

Archipel UI will show you the full state of the Archipel Federation.

It also gives you ability to manipulate orchestrator:

- **disable/enable orchestration**
- **disable/enable heartbeats send**
- **stop/start service container**

If you don't see any heartbeats or master elected, **please wait a little bit!**

By default the Archipel UI uses Archipel Node 1 API endpoint. You can change API endpoint in order to see other nodes state.

| Node   | API Endpoint Container  | API Endpoint on host  |
| ------ | ----------------------- | --------------------- |
| Node 1 | http://172.28.42.2:3000 | http://localhost:3001 |
| Node 2 | http://172.28.42.3:3000 | http://localhost:3002 |
| Node 3 | http://172.28.42.4:3000 | http://localhost:3003 |
| Node 3 | http://172.28.42.5:3000 | http://localhost:3004 |

**Example**

<p align="center">
 <img src=./images/archipel-ui-2.png width = 1000>
</p>

### 2.2 Check containers launched

```bash
docker ps
```

<p align="center">
 <img src=./images/archipel-testing-docker-ps-1.png width = 1000>
</p>

You must see multiple containers launched:

- **4 Archipel nodes**: archipel1, archipel2, archipel3, archipel4
- **Archipel UI**: archipel-ui
- **4 Polkadot KUSAMA nodes**
  - 1 Validator Node: node1-polkadot-validator
  - 2 Passives Nodes: node2-polkadot-sync, node3-polkadot-sync
  - 1 Sentry Nodes: node4-polkadot-sentry

### 2.3 Check Polkadot Kusama Telemetry

https://telemetry.polkadot.io/#/Kusama

- You must see 4 archipel nodes running
  - test-archipel-node-active
  - test-archipel-node-2-passive
  - test-archipel-node-3-passive
  - test-archipel-node-4-sentry
- Active node = Validator Node
- Passive node = Full node ready to backup the validator Node in clase of failure

<p align="center">
 <img src=./images/archipel-testing-telemetry-1.png width = 1000>
</p>

- Here node 1 was elected as leader, so it is active = launched as Validator
- Nodes 2 and 3 are in passive mode

## Step 3: Simulating active node failure

### 3.1 Stop active node

```bash
./stop-archipel.sh {node_number}
```

- Here you must choose the active node number

**Example**

If Node 1 is active:

```bash
./stop-archipel.sh 1
```

- Stop node script will stop the Archipel Node.

### 3.2 Check if the active node was stopped

```bash
docker ps
```

<p align="center">
 <img src=./images/archipel-testing-docker-ps-2.png width = 1000>
</p>

### 3.3 Wait for Archipel Orchestration

**Wait 15 blocks for Archipel Orchestration (Generally takes about 2 minutes)**

### 3.4 Track orchestration

**Archipel UI**

Archipel UI http://172.28.42.6/ available at: http://localhost:3000/

The Node 1 API endpoint is not available cause we stopped it. **So you must change the API endpoint**.
You can use Node 2 API : **http://172.28.42.3:3000** at **http://localhost:3002**

<p align="center">
 <img src=./images/archipel-ui-3.png width = 1000>
</p>

**Telemetry**

You must still see test-archipel-node-active ( but only 3 nodes test-archipel-node\* instead of 4).

https://telemetry.polkadot.io/#/Kusama

<p align="center">
 <img src=./images/archipel-testing-telemetry-2.png width = 1000>
</p>

```bash
docker ps
```

<p align="center">
 <img src=./images/archipel-testing-docker-ps-3.png width = 1000>
</p>

- Node 1 was stopped in step 3.1
- After orchestration, the new leader was elected (Node 2)
- The node 2 was relaunched in active mode (Validator)

## Step 4: Relaunch node

### 4.1 Relaunch old active node

```bash
./restart-archipel.sh {node_number}
```

- Here you must choose the node number

**Example**

Node 1 was active and was stopped so restarting it

```bash
./restart-archipel.sh 1
```

### 4.2 Track old active node state

**Docker**

```bash
docker ps
```

<p align="center">
 <img src=./images/archipel-testing-docker-ps-4.png width = 1000>
</p>

**Telemetry**

<p align="center">
 <img src=./images/archipel-testing-telemetry-3.png width = 1000>
</p>

The old active node was restarted in passive mode.

## Step 5: Remove all launched containers and created folders

```bash
./remove.sh
```

- removes all containers launched by test scripts and all directories created by containers

## Play: Feel free to play with Archipel!
