const { ApiPromise } = require('@polkadot/api')

async function main () {
  // Create our API with a default connection to the local node
  await ApiPromise.create()
}

main().catch(console.error)
