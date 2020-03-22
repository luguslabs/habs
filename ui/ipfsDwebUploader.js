#!/usr/bin/env node

const IPFS = require("ipfs");
const ipfsClient = require("ipfs-http-client");
const ipfsProvider = "http://ipfs.dappnode:5001";
const ipfsGateway = "http://my.ipfs.dnp.dappnode.eth:8080";
const ipfs = ipfsClient(ipfsProvider);
const { globSource } = IPFS;

const args = process.argv.slice(2);
const path = args[0];

const uploadWebsite = async () => {
  let results = [];
  for await (const file of ipfs.add(
    globSource(path, { recursive: true, wrapWithDirectory: true })
  )) {
    results.push(file);
    console.log(file);
  }
  const dwebHash = results[results.length - 1].cid;
  console.log("\n\n\n");
  console.log(
    `To point an .eth domain to this website, use this hash as value:`
  );
  console.log("\x1b[36m%s\x1b[0m", `\n   ${dwebHash}\n`);
  console.log(`To preview you website immediately go to:`);
  console.log("\x1b[36m%s\x1b[0m", `\n   ${ipfsGateway}/ipfs/${dwebHash}\n`);
  return;
};

uploadWebsite();
