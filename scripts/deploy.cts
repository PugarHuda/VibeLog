const hre = require("hardhat");

async function main() {
  console.log("Deploying VibeProof...");

  const VibeProof = await hre.ethers.getContractFactory("VibeProof");
  const contract = await VibeProof.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`VibeProof deployed to: ${address}`);

  // Wait for a few blocks before verifying
  console.log("Waiting for block confirmations...");
  await new Promise((resolve) => setTimeout(resolve, 10000));

  try {
    console.log("Verifying contract on explorer...");
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log("Contract verified!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("Contract already verified.");
    } else {
      console.log("Verification failed:", error.message);
      console.log("You can verify manually later.");
    }
  }

  console.log("\n--- Deployment Summary ---");
  console.log(`Contract: ${address}`);
  console.log(`Network: ${(await hre.ethers.provider.getNetwork()).name}`);
  console.log(`Chain ID: ${(await hre.ethers.provider.getNetwork()).chainId}`);
  console.log("\nAdd this to your .env:");
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
