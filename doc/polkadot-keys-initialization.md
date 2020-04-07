# Polkadot Keys initialization

The bootstrap of an Archipel chain needs a pre-requiste keys generation.
Those keys will be used for the node identities in the federation and use for authoring blocks and chain consensus, transaction propagation of runtime functions calls. Moreover, in addition to [Archipel keys](https://github.com/luguslabs/archipel/blob/master/doc/archipel-keys-initialization.md#archipel-keys), you need to create keys for your external service. For the first supported external service polkadot, you have to generate [Polkadot keys](#polkadot-keys) for the validator service to operate properly.


## Subkey Tool

Archipel and polkadot use [Substrate](https://substrate.dev/) framework. This framwork has a utility tool to generate keys. You will use it to facilitate the keys generation. The first step is to [download and install subkey](https://substrate.dev/docs/en/ecosystem/subkey#installation). Then check subkey installation and options available :

```bash
subkey --version
subkey --help
```
Create a specific folder and generate thoses keys on a secure device with all securities regarding privates keys generation in crypto in general (internet cut-off etc ...).

## Polkadot keys

Start by understanding the key concept of polkadot keys by reading the [official documentation here](https://wiki.polkadot.network/docs/en/learn-keys).

In this doc, we will only concentrate on the creation of the 5 sessions keys. Because this is what is necessary to operate the validator node that running on the DAppNode. Thoses sessions keys must be valorize when you generate your archipel ZIP config file with [archipel CLI](https://github.com/luguslabs/archipel/tree/master/cli). Indeed, you must edit the [archipel.json file](https://github.com/luguslabs/archipel/tree/master/cli#archipeljson) with the accurate sessions keys of your validator you want to operate. All others keys requirement explained in the offical Polkadot doc must be respected and done for those who want to [run a validator on kusama](https://wiki.polkadot.network/docs/en/maintain-guides-how-to-validate-kusama).

All 3 DappNodes form the archipel will share the same 5 sessions keys.

### Polkadot Sessions Keys format explained

In orchestrator env you must valorize 5 sessions keys to be able to launch Polkadot validator node and validate the network.

This orchestrator programm will insert at start thoses 5 sessions keys into the polkadot node keystore.

It simulates what the rotateKeys function call do. Instead of one rpc call of **rotate_keys**, it calls 5 times insertKey rpc call. But the end result is the same.
You can see how to call and details of rotate_keys function [here](https://wiki.polkadot.network/docs/en/maintain-guides-how-to-validate-kusama#generating-the-session-keys)

RotateKeys function call generate 5 sessions keys.

5 keys are generated in the keystore by rotate_keys rpc call.
In the keystore path, key file name is formatted like this :  

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


### Create 5 Polkadot sessions keys

#### Polkadot Step by step session keys creation

- Gran session key
```bash
subkey -n kusama --ed25519 generate > kusama-session-gran-ed25519.keys
cat kusama-session-gran-ed25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-gran.seed
```

- Babe session key
```bash
subkey -n kusama --sr25519 generate > kusama-session-babe-sr25519.keys
cat kusama-session-babe-sr25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-babe.seed
```

- Imon session key
```bash
subkey -n kusama --sr25519 generate > kusama-session-imon-sr25519.keys
cat kusama-session-imon-sr25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-imon.seed
```

- Para session key
```bash
subkey -n kusama --sr25519 generate > kusama-session-para-sr25519.keys
cat kusama-session-para-sr25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-para.seed
```

- Audi session key
```bash
subkey -n kusama --sr25519 generate > kusama-session-audi-sr25519.keys
cat kusama-session-audi-sr25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-audi.seed
```

#### Polkadot Full steps session keys creation

```bash
subkey -n kusama --ed25519 generate > kusama-session-gran-ed25519.keys
cat kusama-session-gran-ed25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-gran.seed
subkey -n kusama --sr25519 generate > kusama-session-babe-sr25519.keys
cat kusama-session-babe-sr25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-babe.seed
subkey -n kusama --sr25519 generate > kusama-session-imon-sr25519.keys
cat kusama-session-imon-sr25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-imon.seed
subkey -n kusama --sr25519 generate > kusama-session-para-sr25519.keys
cat kusama-session-para-sr25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-para.seed
subkey -n kusama --sr25519 generate > kusama-session-audi-sr25519.keys
cat kusama-session-audi-sr25519.keys | grep phrase | cut -d"\`" -f2 > kusama-session-audi.seed
```

### Matching Polkadot sessions files keys with Archipel env variables


```bash
export POLKADOT_KEY_GRAN=$(cat kusama-session-gran.seed)
export POLKADOT_KEY_BABE=$(cat kusama-session-babe.seed)
export POLKADOT_KEY_IMON=$(cat kusama-session-imon.seed)
export POLKADOT_KEY_PARA=$(cat kusama-session-para.seed)
export POLKADOT_KEY_AUDI=$(cat kusama-session-audi.seed)
```

### Generate setKey value from 5 sesssion keys
As explained aboven the format generated by `rotate_key` is :
0x"ed25519 **gran** Public Key" +
"sr25519 **babe** Public Key" +
"sr25519 **imon** Public Key" +
"sr25519 **para** Public Key" +
"sr25519 **audi** Public Key"

You need to send this information on chain to be able to validate. you can read more on [submitting-the-setkeys-transaction doc](https://wiki.polkadot.network/docs/en/maintain-guides-how-to-validate-kusama#submitting-the-setkeys-transaction).
Here how to extract the value from env varibale :

```bash
export ROTATE_KEY=$(cat kusama-session-gran-ed25519.keys | grep Public | cut -d":" -f2)$(cat kusama-session-babe-sr25519.keys | grep Public | cut -d":" -f2 | cut -c 4-)$(cat kusama-session-imon-sr25519.keys | grep Public | cut -d":" -f2 | cut -c 4-)$(cat kusama-session-para-sr25519.keys | grep Public | cut -d":" -f2 | cut -c 4-)$(cat kusama-session-audi-sr25519.keys | grep Public | cut -d":" -f2 | cut -c 4-)
```

### Check 5 sesssion keys correctly installed on your node with ROTATE_KEY value check

Connect to the container polkadot like this:

```bash
docker exec -it kusama-data-polkadot-synch sh
```

Export the ROTATE_KEY you want to verify as well install in your node :

```bash
       export ROTATE_KEY=0x00000000000000000001....
       echo $ROTATE_KEY
```

Call of `author_hasSessionKeys` must return true.

```bash
> curl http://localhost:9993 -H 'Content-Type:application/json;charset=utf-8' -d "{\"jsonrpc\":\"2.0\",\"id\":1, \"method\":\"author_hasSessionKeys\", \"params\": [\"$ROTATE_KEY\"]}"
> {"jsonrpc":"2.0","result":true,"id":1}
```

Check on you 3 Archipel polkadot running nodes. If all nodes are ready to operate on this sessions key, you are now confident to [Submitting the setKeys Transaction](https://wiki.polkadot.network/docs/en/maintain-guides-how-to-validate-kusama#submitting-the-setkeys-transaction).
