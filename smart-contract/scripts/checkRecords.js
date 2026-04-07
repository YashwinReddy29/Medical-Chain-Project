const hre = require("hardhat");

const CONTRACTS = [
  "0xce20761568F3bc3572f04d3de718806D18Dc0606",
  "0x37A8398C7b63FB696Ff946b706D593cb01f6C825",
  "0xD2F25Ba09FE1e60d3ab8A48666c3e6f5707f6196",
];

const WALLET = "0x703d7290f3a8770F27993668B96b6cE57e1E7639";

async function main() {
  for (const addr of CONTRACTS) {
    try {
      const contract = await hre.ethers.getContractAt("MedChain", addr);
      const records = await contract.getRecords(WALLET);
      const isHosp = await contract.hospitals(WALLET);
      console.log(`\n📋 Contract: ${addr}`);
      console.log(`   Records: ${records.length}`);
      console.log(`   Is Hospital: ${isHosp}`);
    } catch(e) {
      console.log(`\n❌ Contract ${addr} failed: ${e.message}`);
    }
  }
}

main();
