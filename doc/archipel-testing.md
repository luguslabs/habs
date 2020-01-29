# Archipel Testing

## Requirements

- Linux machine or MacOS
- Docker installed
- Ports available
    - 8080 for Archipel UI
    - 9944 for Archipel Chain Node WS Endpoint


## Step 1: Bootstrap a federation of 3 nodes

What will be launched:
- 3 Archipel Validator Nodes with Orchestrators
- 1 Archipel Non Validator Node
- Archipel UI
- Orchestrators will launch
    - 3 Polkadot Kusama Nodes

Process:

1.1 Clone Archipel Repository
```bash
git clone https://github.com/luguslabs/archipel.git
```
1.2 Launch federation
```bash
cd archipel/deployer/test 
./launch.sh
```

## Step 2: Check if federation was launched

2.1 Check Archipel UI

Archipel UI will show you the state of Archipel Federation.
You must see 3 Archipel Nodes with their addresses. In addition you must see the federation leader.
http://localhost:8080
If you don’t see any nodes or master elected please wait a little bit!

Example:
<p align="center">
  <img src=./images/deployment-on-dappnodes-configure.png width = 800>
</p>

2.2 Check containers launched
```bash
docker ps
```

You must see multiple containers launched:
- 3 Archipel validator nodes: archipel1, archipel2, archipel3
- 1 Archipel non validator node: archipel-node
- 1 Archipel UI container: archipel-ui
- 3 Polkadot Kusama nodes

2.3 Check Polkadot Kusama Telemetry
https://telemetry.polkadot.io/#/Kusama%20CC3

- You must see 3 archipel nodes running
    - archipel-validator1-{active or passive}
    - archipel-validator2-{active or passive}
    - archipel-validator3-{active or passive}
- Active node = validator node
- Passive node = sync only node
Example:

- Here node 1 was elected active = launched as validator
- Nodes 2 and 3 are in passive state = launched as non validator for sync only

## Step 3: Simulating active node failure

3.1 Stop active node 
```bash
./stop-archipel.sh {node_number} 
```
Here you must choose the active node number
Example: Node 1 is active
```bash
./stop-archipel.sh 1
```
Stop node script will stop Archipel Node

3.2 Check if active node was stopped

```bash
docker ps
```

3.3 Wait for Archipel Orchestration (Generally takes 1-2 mins)

Track orchestration :
- Archipel UI
http://localhost:8080
- Telemetry
https://telemetry.polkadot.io/#/Kusama%20CC3
- docker ps

Example:
Archipel UI:


```bash
docker ps
```

Telemetry:

- Node 1 was stopped in the step 3.1
- After orchestration the new leader was elected (Node 3)
- The node 3 was relaunched in active state (validator)

Step 4: Relaunch node

4.1 Relaunch old active node
```bash
./restart-archipel.sh {node_number}
```
Here you must choose the node number
Example: Node 1 was active and was stopped so restarting it
```bash
./restart-archipel.sh 1
```

4.2 Track old active node state

- Telemetry
https://telemetry.polkadot.io/#/Kusama%20CC3
- docker ps
Example:
```bash
docker ps:
```

Telemetry:

The old active node was restarted in passive mode.

## Step 5: Remove all launched containers and created folders
```bash
./remove.sh
```
 removes all containers launched by test scripts and all directories created by containers

## Play: Feel free to play with Archipel!
Warning! Archipel must have minimum 2 nodes alive! If you stop 2 nodes the third node will remain in passive mode! If you stop 2 passive nodes, the active node will also go in passive mode. 
We are considering that if 1 node is alone (with no peers) there is a problem, so it should not continue to validate.
