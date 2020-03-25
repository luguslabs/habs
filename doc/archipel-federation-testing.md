# Archipel Federation Testing

## Requirements

- Linux or macOS machine
- Docker installed
- Wireguard Kernel modules installed 
  - https://www.wireguard.com/install/

## Step 1: Bootstrap a federation of 3 nodes

What will be launched:
- **3 Archipel nodes** (Archipel Substrate Validator Node + Orchestrator)
- **3 Polkadot KUSAMA Nodes**
  - 1 Validator Node
  - 2 Sentry Nodes
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

Archipel UI will be available at http://172.28.42.5/


<p align="center">
 <img src=./images/archipel-ui-1.png width = 1000>
</p>

Archipel UI will show you the full state of the Archipel Federation.

It also gives you ability to manipulate orchestrator:
 * **disable/enable orchestration**
 * **disable/enable metrics send**
 * **stop/start service container**

If you don't see any metrics or master elected, please wait a little bit!

By default the Archipel UI uses Archipel Node 1 API endpoint. You can change API endpoint in order to see other nodes state.

| Node | Endpoint |
| ---- | -------- |
| Node 1 | http://172.28.42.2:3000 |
| Node 2 | http://172.28.42.3:3000 |
| Node 3 | http://172.28.42.4:3000 |

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
- **3 Archipel nodes**: archipel1, archipel2, archipel3
- **Archipel UI**: archipel-ui
- **3 Polkadot KUSAMA nodes**
  - 1 Validator Node: node1-polkadot-validator
  - 2 Sentry Nodes: node2-polkadot-sync, node3-polkadot-sync

### 2.3 Check Polkadot Kusama Telemetry
https://telemetry.polkadot.io/#/Kusama%20CC3

- You must see 3 archipel nodes running
  - test-archipel-node-1-{active or passive}
  - test-archipel-node-2-{active or passive}
  - test-archipel-node-3-{active or passive}
- Active node = Validator Node
- Passive node = Sentry Node

<p align="center">
 <img src=./images/archipel-testing-telemetry-1.png width = 1000>
</p>

- Here node 1 was elected as leader, so it is active = launched as Validator
- Nodes 2 and 3 are in passive mode = launched as Sentry Node

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

### 3.3 Wait for Archipel Orchestration (Generally takes about 1 minute)

### 3.4 Track orchestration

**Archipel UI**

Available at: http://172.28.42.5/

The Node 1 API endpoint is not available cause we stopped it. So you must change the API endpoint. 
You can use: **http://172.28.42.3:3000**

<p align="center">
 <img src=./images/archipel-ui-3.png width = 1000>
</p>

**Telemetry**

https://telemetry.polkadot.io/#/Kusama%20CC3
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
**Warning!** Archipel must have minimum **2 nodes** alive to have an active service (validator) running! 
- If you stop 2 nodes the third node will remain in passive mode! 
- If you stop 2 passive nodes, the active node will switch in passive mode!

We are considering that if 1 node is alone in Archipel Federation, there is a problem, so it should not continue to validate.
