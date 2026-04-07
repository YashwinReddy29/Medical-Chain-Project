const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Checking with wallet:", signer.address);
  
  const contract = await hre.ethers.getContractAt(
    "MedChain",
    "0xD2F25Ba09FE1e60d3ab8A48666c3e6f5707f6196"
  );

  const records = await contract.getRecords(signer.address);
  console.log("\nTotal records:", records.length);
  
  records.forEach((r, i) => {
    console.log(`\nRecord ${i}:`);
    console.log("  fileName:", r.fileName);
    console.log("  ipfsHash:", r.ipfsHash);
    console.log("  active:", r.active);
    console.log("  hospital:", r.hospital);
    console.log("  timestamp:", r.timestamp.toString());
  });
}

main();
