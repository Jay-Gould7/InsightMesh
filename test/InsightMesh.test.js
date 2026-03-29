const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("InsightMesh contracts", function () {
  async function deployFixture() {
    const [owner, creator, alice, bob, carol] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy("Mock USDT0", "mUSDT0", 6);
    await token.waitForDeployment();

    const RewardVault = await ethers.getContractFactory("RewardVault");
    const vault = await RewardVault.deploy(await token.getAddress(), owner.address);
    await vault.waitForDeployment();

    const BountyRegistry = await ethers.getContractFactory("BountyRegistry");
    const bountyRegistry = await BountyRegistry.deploy();
    await bountyRegistry.waitForDeployment();

    const SubmissionRegistry = await ethers.getContractFactory("SubmissionRegistry");
    const submissionRegistry = await SubmissionRegistry.deploy(await bountyRegistry.getAddress());
    await submissionRegistry.waitForDeployment();
    await bountyRegistry.setSubmissionRegistry(await submissionRegistry.getAddress());

    return { owner, creator, alice, bob, carol, token, vault, bountyRegistry, submissionRegistry };
  }

  it("deposits and distributes rewards only once", async function () {
    const { owner, alice, bob, token, vault } = await deployFixture();
    await token.mint(owner.address, 2_000_000);
    await token.approve(await vault.getAddress(), 2_000_000);

    await expect(vault.deposit(1, 1_000_000)).to.emit(vault, "RewardDeposited");
    await expect(vault.distribute(1, [alice.address, bob.address], [400_000, 600_000]))
      .to.emit(vault, "RewardDistributed")
      .withArgs(1, alice.address, 400_000);

    expect(await token.balanceOf(alice.address)).to.equal(400_000);
    expect(await token.balanceOf(bob.address)).to.equal(600_000);
    await expect(vault.distribute(1, [alice.address], [1])).to.be.revertedWith("already settled");
  });

  it("rejects duplicate submissions, self support, duplicate support, and late actions", async function () {
    const { creator, alice, bob, carol, bountyRegistry, submissionRegistry } = await deployFixture();
    const deadline = (await time.latest()) + 3600;
    await bountyRegistry.connect(creator).createBounty("Insight sprint", "hash", 100_000, deadline);

    await submissionRegistry.connect(alice).submit(0, ethers.id("alice"), bob.address);
    await expect(submissionRegistry.connect(alice).submit(0, ethers.id("alice-2"), bob.address)).to.be.revertedWith("already submitted");

    await expect(submissionRegistry.connect(alice).support(0, 0)).to.be.revertedWith("self support");
    await submissionRegistry.connect(bob).support(0, 0);
    await expect(submissionRegistry.connect(bob).support(0, 0)).to.be.revertedWith("already supported");

    await time.increaseTo(deadline + 1);
    await expect(submissionRegistry.connect(carol).submit(0, ethers.id("carol"), bob.address)).to.be.revertedWith("deadline passed");
    await expect(submissionRegistry.connect(carol).support(0, 0)).to.be.revertedWith("deadline passed");
  });
});
