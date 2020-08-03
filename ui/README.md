# Archipel UI

Archipel UI is a component that connects to Archipel Node Orchestrator API and shows the state and heartbeats of the Archipel Federation. It allows also to perform several administration actions.

## Introduction

Archipel Orchestrator exposes [API heartbeats and commands](https://github.com/luguslabs/archipel/tree/master/orchestrator/src/routes) to access the current Archipel state and also stop or start service. Archipel UI is the frontend that renders heartbeats values and allows the Archipel Orchestrator management.
To operate, the Archipel UI must be connected to Archipel Orchestrator API exposed by Archipel Node.

### Enpoint

You can configure the Archipel Orchestrator API Endpoint in this field:

<p align="center">
 <img src=../doc/images/archipel-ui-api-endpoint.png width = 1000>
</p>

### Heartbeats

The first section presents heartbeats of all nodes of the current Archipel Federation. The heartbeats section includes some additional information:

- Node key address that identifies a node within an Archipel Federation
- Last detected heartbeat time for each node
- Label `Current Node` that indicates to which orchestrator API the UI is connected
- Labels `Active` and `Passive` show the current status of each node in a federation. There will always be only one `Active` and two `Passive` nodes.

<p align="center">
 <img src=../doc/images/archipel-ui-metrics.png width = 1000>
</p>

### Node Administration

Node administration section shows information relative to the Archipel Node.

Here you can also trigger two actions:

<p align="center">
 <img src=../doc/images/archipel-ui-node-admin.png width = 1000>
</p>

- **`Orchestration`** orchestrator is the decision making algorithm to start or stop the external service in active or passive mode. You can shut down this algorithm to take manual decisions in some emergency situations.

  **Warning! The orchestration deactivation can lead to an unstable Archipel state. Use it at your own risk.**

- **`Heartbeat Send`** Heartbeat is the ability of an Archipel node to send it's heartbeats and liveness information through a blockchain transaction. You can intentionally shutdown this propagation to take manual decisions in some emergency situations.

**Warning! The heartbeat send deactivation can lead to an unstable Archipel state. Use it at your own risk.**

- **`Heartbeat By Algorithm`** The heartbeat send can be deactivated in some situations by the Archipel orchestration algorithm.

| sign      | `Heartbeat By Algorithm` |
| --------- | ------------------------ |
| checkmark | Activated                |
| cross     | Deactivated              |

- **`Current Node Address`** node address identity.
- **`Leader Node Address`** current leader address.
- **`Connected To Chain`** if Archipel Orchestrator is connected to the Archipel chain.

| sign      | `Connected To Chain` |
| --------- | -------------------- |
| checkmark | Connected            |
| cross     | Connection Failed    |

- **`Synch State`**: Synch status of the Archipel chain.

| sign      | `Synch State`       |
| --------- | ------------------- |
| checkmark | Is synchronized     |
| spinner   | Is not synchronized |

- **`Peer Id`** Peer ID is used in the network layer to identify the Archipel chain node.
- **`Peer Number`** number of reserved Archipel peers connected with.

| Number | `Peer Number`                                              |
| ------ | ---------------------------------------------------------- |
| 2      | Normal                                                     |
| 1      | Warning: One node can be down                              |
| 0      | Problem: No peers. Network issue or 2 other peers are down |

### Service Administration

The last section shows the status of the service on which you want to maintain high availability. You can also do a manual stop or start of the service container.

**Warning! Avoid starting service in active mode while the orchestration is disabled. It can lead to multiple active services in the same Archipel Federation. (Double signs in Polkadot Validator)**

<p align="center">
 <img src=../doc/images/archipel-ui-service-admin-stop.png width = 1000>
</p>

- **`Service`** service on which you want to achieve HA. Supported service: `polkadot`

- **`Service Ready To Operate`** if service is considered ready to be launched in active mode. Every service can have its logic: like waiting and checking the blockchain to be synchronized, checking peer numbers or any other custom rules. The orchestration algorithm will only start an active service container if the service is ready to operate.
  In the example, the sign indicates that the service is currently ready to operate as an active node.

| sign      | `Service Ready To Operate`                                          |
| --------- | ------------------------------------------------------------------- |
| checkmark | Service ready to operate                                            |
| cross     | Service is nOT ready to operate ( blockchain still synching etc ..) |

- **`Current Service Mode`** the service mode is decided by orchestration algorithm. It takes into consideration heartbeats, service state, and much other information. The service mode can be `active` or `passive`.

| value   | `Current Service Mode`                                        |
| ------- | ------------------------------------------------------------- |
| active  | Orchestrator must start the service container in active mode  |
| passive | Orchestrator must start the service container in passive mode |

- **`Service Container Status`** the current status of the docker container on the host machine for the service.

| value   | `Current Service Mode`                                                |
| ------- | --------------------------------------------------------------------- |
| none    | No docker container is running for this service                       |
| active  | A docker container is running for this service and is in active mode  |
| passive | A docker container is running for this service and is in passive mode |

- **`Stop Service Container`** will stop and remove the service container. If the orchestrator is enabled, the service container will be restarted in the correct mode.

**Warning! Stopping containers can lead to an unstable Archipel state. Use it at your own risk.**

When the service container is stopped, you have the ability to restart it in different modes:

<p align="center">
 <img src=../doc/images/archipel-ui-service-admin-start.png width = 1000>
</p>

- **`Start Active Service Container`** will start the service container in active mode.

* **`Start Passive Service Container`** will start the service container in passive mode.

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

- After run step you can access the Archipel UI at http://localhost:8080.

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

At Each UI release, we update the IPFS resolver of **http://archipel.eth** for a decentralized access. Don't trust, verify the IPFS record here : https://app.ens.domains/name/archipel.eth according to your `npm run publish` own test from source.

## Configuration

The template's configuration is stored in the `src/config` directory, with
`common.json` being loaded first, then the environment-specific JSON file,
and finally environment variables, with precedence.

- `development.json` affects the development environment
- `test.json` affects the test environment, triggered in `yarn test` command.
- `production.json` affects the production environment, triggered in
  `yarn build` command.

Some environment variables are read and integrated into the template `config` object,
including:

- `REACT_APP_API_URL` overriding `config[API_URL]`
