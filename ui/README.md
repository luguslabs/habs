# Archipel UI

Archipel UI is connecting to Archipel Node Orchestator API and shows states and metrics of the Archipel Federation. It allows also to perform administration actions on the current connected node.

## Introduction

Archipel Orchestrator expose [API metrics and commands](https://github.com/luguslabs/archipel/tree/master/orchestrator/src/routes) to access the current Archipel state and also stop or start service Archipel UI is frontend react that render metrics values and allow also to activate/deactivate service.
To operate, the Archipel UI must first connect to an exposed API.

### Enpoint
You can configuring the API Endpoint to target in the field :

<p align="center">
 <img src=../doc/images/archipel-ui-api-endpoint.png width = 1000>
</p>

### Metrics

The first tab will present metrics for all nodes of the current Archipel Federation state and status.
- It will give the node identity address of the Archipel chain and the node number: 1,2 or 3.
- Last detected heartbeat for each node.
- On the left corner, the current target node API is indicted in green with `Current Node` text.
- On the right corner, the current status of the node `Active (Orange)` or `Passive (Grey)`. There will be only one lader Active and 2 others in Passive mode.

<p align="center">
 <img src=../doc/images/archipel-ui-metrics.png width = 1000>
</p>

### Node Administration
The next tab, is the Node Administration tabs. It will details informations relative the the archipel node values and also 2 actions :
<p align="center">
 <img src=../doc/images/archipel-ui-node-admin.png width = 1000>
</p>

- `Orchestration` radio button: orchestrator is the decison making program to start or stop the external service in active or passive mode. You can shutdown this program to do manual decision in emergency situations.

 **Warning: Deactivate orchestration can lead to unstable Archipel High Availability state. Use it at your own risk and High Availability peril**
- `Heartbeat Send` radio button: Heartbeat is the ability of an archipel node to propagate his metrics and liveness information through a blockchain transaction. You can intentionally shutdown this propagation to do manual decision in emergency situtation.

**Warning: Deactivate heartbeat can lead to unstable Archipel High Availability state. Use it at your own risk and High Availability peril**
- `Heartbeat By Algorithm`: if you do not have manually deactivate the heartbeat, see Radio button above, this is the status value of the automatic heartbeat program. 

| sign | `Heartbeat By Algorithm` |
|------|--------------------------|
| checkmark | OK |
| cross | KO |

- `Current Node Address`: archipel chain node address identity.
- `Leader Node Address`: archipel chain node address identity that is curra ently leader and must active the service in ACTIVE mode.
- `Connected To Chain` : connection status between the API ochestratr program and the archipel chain node running program. 

| sign | `Connected To Chain` |
|------|----------------------|
| checkmark | OK (HTTP 200) |
| cross | Failed |

- `Synch State`: Synch status of the Archipel substrate chain.

| sign | `Synch State` |
|------|---------------|
| checkmark | SYNCH |
| spinner | NOT SYNCH |

- `Peer Id`: Peer ID used in the networking layer to identify reserved peers between Archipel nodes.
- `Peer Number`: number of reserved Archipel peers connected with.

| Number | `Peer Number` |
|------|---------------|
| 2 | Nominal |
| 1 | warning: 1 of the 2 reserved peers node is down.
| 0 | Problem: no peer. network issue or 2 reserved peers down?

### Service Administration

The last lab, show the status of the external service you initially wanted to maintain a High Availability on it. You can also decie to do mannual stop start on the service container and choose to start it active r passive mode. Warning : there is some saftey controls when you try to start the container. For instance, you cannot start the container it in active mode if orchestration is disable.


<p align="center">
 <img src=../doc/images/archipel-ui-service-admin-stop.png width = 1000>
</p>

- `Service` : service on which you want to achieve HA. Support service now : `polkadot`

- `Service Ready To Operate` : You can code some prerequisite logic decisions in order to consider a service ready to be launch in active mode. Like waiting and checking the blockchain to be synch, checking peers numbers or others custom rules according to each service supported. Here the sign indicate if the service it currently ready to be operate as an active node. Orchestration program will only start an active service container if the sign is a checkmark.

| sign | `Service Ready To Operate` |
|------|----------------------|
| checkmark | Service ready to operate in active mode |
| cross | Service NOT ready to operate in Active mode. ( blockchain still synching etc ..) |


- `Current Service Mode`: active or passive mode value decided by metrics and the decision logic. This informaton is used by the orchestrator to then start/restart/stop the service container in accurate mode.

| value | `Current Service Mode` |
|------|----------------------|
| active | orchestrator must start the service container in active mode |
| passive | orchestrator must start the service container in passive mode |


- `Service Container Status`: The current status of the docker container on the host machine for this service.

| value | `Current Service Mode` |
|------|----------------------|
| none | no docker container is running for this service |
| active | a docker container is running for this service and is in an active mode |
| passive | a docker container is running for this service and is in passive mode |

- `Stop Service Container` button: it will perform a `docker stop` and `docker rm` on the currently running container. If the orchestrator program is enabled, it will restart it in accurate mode immediately.

**Warning: Stopping containers can lead to unstable Archipel High Availability state. Use it at your own risk and High Availability peril**

 When container is stopped, you will have 2 admin new buttons to operate a restart of the service container :

<p align="center">
 <img src=../doc/images/archipel-ui-service-admin-start.png width = 1000>
</p>


- `Start Active Service Container`: It will perform a start of the docker container service in active mode.


- `Start Passive Service Container`: It will perform a start of the docker container service in passive mode.


## Installation

The code can be installed using [git](https://git-scm.com/) and [yarn](https://yarnpkg.com/).

```bash
# Clone the repository
git clone https://github.com/luguslabs/archipel.git
cd ./ui
```

```bash
yarn install
```

## Build latest with Docker
```bash
# Clone the repository
git clone https://github.com/luguslabs/archipel.git
cd ./ui
docker build -t luguslabs/archipel-ui: .
```

## Build test version with Docker
```bash
# Clone the repository
git clone https://github.com/luguslabs/archipel.git
cd ./ui
docker build -t luguslabs/archipel-ui:test .
```

## Usage

You can check and run eslint with: 

```bash
yarn run lint
```

You can start the template in development mode to connect to a locally running node

```bash
yarn start
```

You can also build the app in production mode,

```bash
yarn build
```
and open `build/index.html` in your favorite browser.

## Run with Docker
```bash
docker run -it -p 8080:80 luguslabs/archipel-ui
```
You can set REACT_APP_API_URL env at runtime with :
```bash
docker run -it -p 8080:80 --env REACT_APP_API_URL=http://127.0.1.1:3000 luguslabs/archipel-ui
```

* After run step you can access the Archipel UI at http://localhost:8080.

## Publish on IPFS

- connect to your dappnode wifi ( to target IPFS )
- launch :
```bash
npm install
npm run publish
```

Expected result :

```bash
To point an .eth domain to this website, use this hash as value:

   QmZ6VMAgEJr9QCBGW6urSNCcRfMyG6HxPFBG6kyqwxG9ZP

To preview you website immediately go to:

   http://my.ipfs.dnp.dappnode.eth:8080/ipfs/QmZ6VMAgEJr9QCBGW6urSNCcRfMyG6HxPFBG6kyqwxG9ZP
```

At Each UI release, we update the IPFS resolver of http://archipel.eth for a decentralized access. Don't trust, verify the IPFS record here : https://app.ens.domains/name/archipel.eth according to your `npm run publish` own test from source.

## Configuration

The template's configuration is stored in the `src/config` directory, with
`common.json` being loaded first, then the environment-specific JSON file,
and finally environment variables, with precedence.

* `development.json` affects the development environment
* `test.json` affects the test environment, triggered in `yarn test` command.
* `production.json` affects the production environment, triggered in
`yarn build` command.

Some environment variables are read and integrated into the template `config` object,
including:

* `REACT_APP_API_URL` overriding `config[API_URL]`

## References
* [Based on Substrate Front End Template](https://github.com/substrate-developer-hub/substrate-front-end-template)
