import { expect } from "chai";
import { ethers } from "hardhat";

describe("VibeProof", function () {
  async function deployFixture() {
    const [owner, builder1, builder2] = await ethers.getSigners();
    const VibeProof = await ethers.getContractFactory("VibeProof");
    const vibeProof = await VibeProof.deploy();
    return { vibeProof, owner, builder1, builder2 };
  }

  describe("attestVibe", function () {
    it("should create a checkpoint with valid data", async function () {
      const { vibeProof, builder1 } = await deployFixture();
      const summary = "Day 1 - Core contracts deployed";
      const logHash = ethers.keccak256(ethers.toUtf8Bytes("test-log-data"));

      await vibeProof.connect(builder1).attestVibe(summary, logHash);

      const count = await vibeProof.getCheckpointCount(builder1.address);
      expect(count).to.equal(1);

      const cp = await vibeProof.getCheckpoint(builder1.address, 0);
      expect(cp.logHash).to.equal(logHash);
      expect(cp.summary).to.equal(summary);
      expect(cp.sessionCount).to.equal(1);
      expect(cp.timestamp).to.be.greaterThan(0);
    });

    it("should emit VibeAttested event", async function () {
      const { vibeProof, builder1 } = await deployFixture();
      const summary = "Checkpoint 1";
      const logHash = ethers.keccak256(ethers.toUtf8Bytes("data"));

      await expect(vibeProof.connect(builder1).attestVibe(summary, logHash))
        .to.emit(vibeProof, "VibeAttested")
        .withArgs(builder1.address, logHash, summary, (v: any) => v > 0, 0);
    });

    it("should increment sessionCount for multiple checkpoints", async function () {
      const { vibeProof, builder1 } = await deployFixture();
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("log-1"));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("log-2"));
      const hash3 = ethers.keccak256(ethers.toUtf8Bytes("log-3"));

      await vibeProof.connect(builder1).attestVibe("CP 1", hash1);
      await vibeProof.connect(builder1).attestVibe("CP 2", hash2);
      await vibeProof.connect(builder1).attestVibe("CP 3", hash3);

      const count = await vibeProof.getCheckpointCount(builder1.address);
      expect(count).to.equal(3);

      const cp3 = await vibeProof.getCheckpoint(builder1.address, 2);
      expect(cp3.sessionCount).to.equal(3);
    });

    it("should reject summary longer than 200 characters", async function () {
      const { vibeProof, builder1 } = await deployFixture();
      const longSummary = "A".repeat(201);
      const logHash = ethers.keccak256(ethers.toUtf8Bytes("data"));

      await expect(
        vibeProof.connect(builder1).attestVibe(longSummary, logHash)
      ).to.be.revertedWith("Summary too long");
    });

    it("should reject zero hash", async function () {
      const { vibeProof, builder1 } = await deployFixture();
      const zeroHash = ethers.ZeroHash;

      await expect(
        vibeProof.connect(builder1).attestVibe("Test", zeroHash)
      ).to.be.revertedWith("Invalid hash");
    });

    it("should allow exactly 200 character summary", async function () {
      const { vibeProof, builder1 } = await deployFixture();
      const summary = "A".repeat(200);
      const logHash = ethers.keccak256(ethers.toUtf8Bytes("data"));

      await vibeProof.connect(builder1).attestVibe(summary, logHash);

      const cp = await vibeProof.getCheckpoint(builder1.address, 0);
      expect(cp.summary).to.equal(summary);
    });
  });

  describe("getCheckpointCount", function () {
    it("should return 0 for address with no checkpoints", async function () {
      const { vibeProof, builder2 } = await deployFixture();
      const count = await vibeProof.getCheckpointCount(builder2.address);
      expect(count).to.equal(0);
    });
  });

  describe("getCheckpoint", function () {
    it("should revert for invalid index", async function () {
      const { vibeProof, builder1 } = await deployFixture();

      await expect(
        vibeProof.getCheckpoint(builder1.address, 0)
      ).to.be.revertedWith("Invalid index");
    });
  });

  describe("multi-builder isolation", function () {
    it("should keep checkpoints separate per builder", async function () {
      const { vibeProof, builder1, builder2 } = await deployFixture();
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("builder1-data"));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("builder2-data"));

      await vibeProof.connect(builder1).attestVibe("Builder 1 CP", hash1);
      await vibeProof.connect(builder2).attestVibe("Builder 2 CP", hash2);

      expect(await vibeProof.getCheckpointCount(builder1.address)).to.equal(1);
      expect(await vibeProof.getCheckpointCount(builder2.address)).to.equal(1);

      const cp1 = await vibeProof.getCheckpoint(builder1.address, 0);
      const cp2 = await vibeProof.getCheckpoint(builder2.address, 0);
      expect(cp1.logHash).to.equal(hash1);
      expect(cp2.logHash).to.equal(hash2);
    });
  });
});
