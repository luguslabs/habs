# Archipel Keys initialization 


**Archipel keys are now automatically generate by [archipel CLI](https://github.com/luguslabs/archipel/tree/master/cli). You do not need anymmore to generate them mannualy.
They are all generate with archipel CLI.
The following doc explaining how to generate env variable and Archipel keys work s is only on educational purpose for curious developers.**

By archipel keys, we means all keys needed for node identities in the federation and use for authoring blocks and chain consensus, transactions propagation of runtime functions calls. 
The only keys that you need to generate are for your external service. For the first supported external service polkadot, you have to generate [Polkadot sessions keys](https://github.com/luguslabs/archipel/blob/master/doc/polkadot-keys-initialization.md#polkadot-keys) for the validator service to operate properly.



## Subkey Tool

Archipel and polkadot use [Substrate](https://substrate.dev/) framework. This framwork has utility tool to generate keys. You will use it to facilitate the keys generation. The first step is to [download and install subkey](https://substrate.dev/docs/en/ecosystem/subkey#installation). Then check subkey installation and options available :

```bash
subkey --version
subkey --help
```
Create a specific folder and generate thoses keys on a secure device with all securities regarding privates keys generation in crypto in general (internet cut-off etc ...). 


## Archipel keys

The minimal nodes of an archipel is 3. You need to generate keys for this 3 nodes.

You can generate those keys [step-by-step](#archipel-step-by-step-keys-creation) to understand better and repeat 3 times for the 3 nodes.
There is also a [full steps command line](#archipel-full-steps-keys-creation) to generate quickly when you master it like a ninja.

### Archipel Step by step keys creation
```bash
subkey -n substrate generate > archipel-node1-sr25519.keys 
```

Note: the default keys generation is an `sr25519`. To be sure, you can also specify `-s or --sr25519` option.

You will need the format of the ed25519 keys from the same seed. To do this you will first extract the phrase seed 12 mnemonic words of node 1 from `archipel-node1-sr25519.keys` file. then you keep the seed phrase in another file : `archipel-node1.seed`

```bash
cat archipel-node1-sr25519.keys | grep phrase | cut -d"\`" -f2 > archipel-node1.seed
```

now you can extract ed25519 keys format from phrase of `archipel-node1.seed` with :

```bash
subkey -n substrate --ed25519 inspect "$(<archipel-node1.seed)" > archipel-node1-ed25519.keys 
```

repeat the same commands above for node 2 and node 3. Or use this shortcut loop :

### Archipel Full steps keys creation

```bash
for i in `seq 1 3`; do echo "create keys archipel-node$i" && subkey -n substrate generate > archipel-node$i-sr25519.keys && cat archipel-node$i-sr25519.keys | grep phrase | cut -d"\`" -f2 > archipel-node$i.seed && subkey -n substrate --ed25519 inspect "$(<archipel-node$i.seed)" > archipel-node$i-ed25519.keys ; done
```

### Archipel keys creation expected result

In your foder you must have now 9 files :
```bash
archipel-node1-ed25519.keys
archipel-node1.seed
archipel-node1-sr25519.keys
archipel-node2-ed25519.keys
archipel-node2.seed
archipel-node2-sr25519.keys
archipel-node3-ed25519.keys
archipel-node3.seed
archipel-node3-sr25519.keys
```

### Matching archipel files keys with Archpel env variables

- ARCHIPEL_KEY_SEED=what you find into your `archipel-node1|2|3.seed` file.

- ARCHIPEL_AUTHORITIES_SR25519_LIST='SS58 Address of archipel-node1-sr25519.keys','SS58 Address of archipel-node2-sr25519.keys','SS58 Address of archipel-node3-sr25519.keys'
- ARCHIPEL_AUTHORITIES_ED25519_LIST='SS58 Address of archipel-node1-ed25519.keys','SS58 Address of archipel-node2-ed25519.keys','SS58 Address of archipel-node3-ed25519.keys'


`ARCHIPEL_AUTHORITIES_SR25519_LIST` and `ARCHIPEL_AUTHORITIES_ED25519_LIST` are the same values for your 3 archipel nodes.

Lazy? Here utility commands to generate `ARCHIPEL_AUTHORITIES_SR25519_LIST` and `ARCHIPEL_AUTHORITIES_ED25519_LIST` value from files :

- ARCHIPEL_KEY_SEED
select line according to node number you want to valorize
```bash
export ARCHIPEL_KEY_SEED=$(cat archipel-node1.seed)
```
or
```bash
export ARCHIPEL_KEY_SEED=$(cat archipel-node2.seed)
```
or
```bash
export ARCHIPEL_KEY_SEED=$(cat archipel-node3.seed)
```

- ARCHIPEL_AUTHORITIES_SR25519_LIST
```bash
export ARCHIPEL_AUTHORITIES_SR25519_LIST=$(cat archipel-node1-sr25519.keys | grep SS58 | cut -d":" -f2 | sed -e 's/^[[:space:]]*//'),$(cat archipel-node2-sr25519.keys | grep SS58 | cut -d":" -f2 | sed -e 's/^[[:space:]]*//'),$(cat archipel-node3-sr25519.keys | grep SS58 | cut -d":" -f2 | sed -e 's/^[[:space:]]*//')
```

- ARCHIPEL_AUTHORITIES_ED25519_LIST
```bash
export ARCHIPEL_AUTHORITIES_ED25519_LIST=$(cat archipel-node1-ed25519.keys | grep SS58 | cut -d":" -f2 | sed -e 's/^[[:space:]]*//'),$(cat archipel-node2-ed25519.keys | grep SS58 | cut -d":" -f2 | sed -e 's/^[[:space:]]*//'),$(cat archipel-node3-ed25519.keys | grep SS58 | cut -d":" -f2 | sed -e 's/^[[:space:]]*//')
```