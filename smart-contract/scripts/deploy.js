const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying MedChain...");
  const MedChain = await hre.ethers.getContractFactory("MedChain");
  const contract = await MedChain.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("✅ Deployed to:", address);
  console.log("\nAdd this to frontend/.env:");
  console.log(`REACT_APP_CONTRACT_ADDRESS=${address}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
