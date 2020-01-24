# Archipel Orchestrator
Archipel Orchestrator is the decision making component in Archipel federation.
It stops, starts, activates or deactivates the validator node according to the Archipel Chain state.

## Launch Orchestrator

### Create .env file
```bash
# .env
NODE_ENV='development'
DEBUG='app,chain,docker,metrics,polkadot,service'

# Setting Archipel Variables
NODE_WS='ws://127.0.0.1:9944'
MNEMONIC='mushroom ladder...'
ALIVE_TIME=60000
SERVICE='polkadot'

# Polkadot Validator Variables
POLKADOT_NAME='validator1'
POLKADOT_IMAGE='parity/polkadot:latest'
POLKADOT_PREFIX='node1-'
POLKADOT_KEY_GRAN='april shift pupil quit ...'
POLKADOT_KEY_BABE='region run sunset rule ...'
POLKADOT_KEY_IMON='screen sustain clog husband ...'
POLKADOT_KEY_PARA='produce hover hurdle lobster ...'
POLKADOT_KEY_AUDI='oak tail stomach fluid ...'

```

### Run
```bash
yarn install
yarn run start
```

## Note 

Please use **eslint** before every commit.

```bash
yarn run eslint
yarn run eslint-fix
```

## Appendix

### Polkadot Sessions Keys explained

In orchestrator env you must valorize 5 sessions keys to be able to launch Polkadot validator node and validate the network.

```bash
POLKADOT_KEY_GRAN='april shift pupil quit ...'
POLKADOT_KEY_BABE='region run sunset rule ...'
POLKADOT_KEY_IMON='screen sustain clog husband ...'
POLKADOT_KEY_PARA='produce hover hurdle lobster ...'
POLKADOT_KEY_AUDI='oak tail stomach fluid ...'
```

This orchestrator programm will insert at start thoses 5 sessions keys into the polkadot node keystore.

It simulates what the rotateKeys function call do. Instead of one rpc call of **rotate_keys**, it calls 5 times insertKey rpc call. But the end result is the same.
You can see how to call and details of rotate_keys function [here](
https://wiki.polkadot.network/docs/en/maintain-guides-how-to-validate-kusama#generating-the-session-key)

RotateKeys function call generate 5 sessions keys. 

5 keys are generated in the keystore by rotate_keys rpc call.
In the keystore path, key file name is formated like this :  

stringToHex("keyType")+<Public key>

For the 5 keys generated in the keystore, file **prefix** are :
- stringToHex("gran")=6772616e
- stringToHex("babe")=62616265
- stringToHex("imon")=696d6f6e
- stringToHex("para")=70617261
- stringToHex("audi")=61756469

The file itself contains the 12 seed words secret. 

To find the accurate Public key ( using subkey tool for instance ) here keyType mapping:

- gran = ed25519
- babe = sr25519
- imon = sr25519
- para = sr25519
- audi = sr25519

RotateKeys function call return an aggregate key of all 5 public Keys. Here the format retunr :
0x"ed25519 **gran** Public Key" +
"sr25519 **babe** Public Key" +
"sr25519 **imon** Public Key" +
"sr25519 **para** Public Key" +
"sr25519 **audi** Public Key" 

then, this full aggregate key must submit on chain before beeing able to validate on the network as explained [here](https://wiki.polkadot.network/docs/en/maintain-guides-how-to-validate-kusama#submitting-the-setkeys-transaction)



