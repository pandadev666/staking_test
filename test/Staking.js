
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Staking", function () {
  let deployer, david, jhon, alison;

  /** Test Token balance of owner & users */
  let testToken;

  let lastRewardBlock = 0;
  before(async () => {
    // Get the user accounts including owner and users
    [deployer, david, jhon, alison] = await ethers.getSigners();

    // Deploy the Mock Test Token for test
    testToken = await (await ethers.getContractFactory('TestToken', deployer)).deploy(); // total supply: 300000000, decimals: 9
    testToken.deployed();

    // Send Test Tokens to users as initialize for each 100 tokens

    await testToken.connect(deployer).approve(david.address, ethers.utils.parseUnits("100", "gwei"));
    await testToken.connect(david).transferFrom(deployer.address, david.address, ethers.utils.parseUnits("100", "gwei"));

    await testToken.connect(deployer).approve(jhon.address, ethers.utils.parseUnits("100", "gwei"));
    await testToken.connect(jhon).transferFrom(deployer.address, jhon.address, ethers.utils.parseUnits("100", "gwei"));

    await testToken.connect(deployer).approve(alison.address, ethers.utils.parseUnits("100", "gwei"));
    await testToken.connect(alison).transferFrom(deployer.address, alison.address, ethers.utils.parseUnits("100", "gwei"));

    expect(await testToken.balanceOf(david.address)).to.be.eq(ethers.utils.parseUnits("100", "gwei"))
    expect(await testToken.balanceOf(jhon.address)).to.be.eq(ethers.utils.parseUnits("100", "gwei"))
    expect(await testToken.balanceOf(alison.address)).to.be.eq(ethers.utils.parseUnits("100", "gwei"))

    // Deploy the Staking Contract with parameters(Max Stake Period => 100 Blocks - 20 minutes, Multiplier => 5, Minimum Lock Period => 4, Test Token Address)

    staking = await (await ethers.getContractFactory('Staking', deployer)).deploy(100, 5, 4, testToken.address);
    staking.deployed();

    lastRewardBlock = await ethers.provider.getBlockNumber();

    // Send the Test Token to Staking Contract as rewardable Tokens by owner (1000 tokens)

    await testToken.connect(deployer).approve(staking.address, ethers.utils.parseUnits("10000", "gwei"));
    await staking.connect(deployer).depositReward(ethers.utils.parseUnits('10000', 'gwei'));
    expect(await testToken.balanceOf(staking.address)).to.be.eq(ethers.utils.parseUnits("10000", "gwei"))
  })

  /** David stakes 10 Test Tokens */
  it("First Deposit Test Token to Staking Contract By David", async function () {

    await testToken.connect(david).approve(staking.address, ethers.utils.parseUnits('10', "gwei"));
    await staking.connect(david).stakeToken(ethers.utils.parseUnits('10', 'gwei'));
    lastRewardBlock = await ethers.provider.getBlockNumber();

    // Current Reward Token Amount is zero
    expect(await staking.getRewardTokenAmount(david.address)).to.be.equal(ethers.utils.parseUnits("0", "gwei"));
    // Should reverted cause of Minimal Lock Period
    await expect(staking.connect(david).withdrawToken()).to.be.revertedWith("You need to wait for Minimal Lock Period!");

    expect(await staking.getRewardTokenAmount(david.address)).to.be.equal(ethers.utils.parseUnits("0.5", "gwei"));

  })

  /** Jhon Stakes 20 Test Tokens */
  it("Another Stake by Jhon", async function () {
    await testToken.connect(jhon).approve(staking.address, ethers.utils.parseUnits('20', "gwei"));
    await staking.connect(jhon).stakeToken(ethers.utils.parseUnits('20', 'gwei'));
    lastRewardBlock = await ethers.provider.getBlockNumber();

    // Current Reward Token Amount is zero
    expect(await staking.getRewardTokenAmount(jhon.address)).to.be.equal(ethers.utils.parseUnits("0", "gwei"));
    // Should reverted cause of Minimal Lock Period
    await expect(staking.connect(jhon).withdrawToken()).to.be.revertedWith("You need to wait for Minimal Lock Period!");

    expect(await staking.getRewardTokenAmount(jhon.address)).to.be.equal(ethers.utils.parseUnits("1", "gwei"));

  })

  /** Withdraw Test Token with reward by David */

  it("Withdraw token by David", async function () {
    // Check balance before withdraw token
    expect(await testToken.balanceOf(david.address)).to.be.eq(ethers.utils.parseUnits("90", "gwei"))

    expect(await staking.getStakedAmount(david.address)).to.be.equal(ethers.utils.parseUnits("10", "gwei"));
    expect(await staking.getRewardTokenAmount(david.address)).to.be.equal(ethers.utils.parseUnits("2", "gwei"));

    // Withdraw staked token and reward token
    await staking.connect(david).withdrawToken();
    // Check balance after withdraw token
    expect(await testToken.balanceOf(david.address)).to.be.eq(ethers.utils.parseUnits("102.5", "gwei"))
  })

    /** Withdraw Test Token with reward by Jhon */
  
    it("Withdraw token by Jhon", async function () {
        // Check balance before withdraw token
        expect(await testToken.balanceOf(jhon.address)).to.be.eq(ethers.utils.parseUnits("80", "gwei"))
    
        expect(await staking.getStakedAmount(jhon.address)).to.be.equal(ethers.utils.parseUnits("20", "gwei"));
        expect(await staking.getRewardTokenAmount(jhon.address)).to.be.equal(ethers.utils.parseUnits("2", "gwei"));
    
        await expect(staking.connect(jhon).withdrawToken()).to.be.revertedWith("You need to wait for Minimal Lock Period!");

        // Passing 1 block with mining
        await ethers.provider.send('evm_mine');

        // Withdraw staked token and reward token
        await staking.connect(jhon).withdrawToken();
        // Check balance after withdraw token
        expect(await testToken.balanceOf(jhon.address)).to.be.eq(ethers.utils.parseUnits("105", "gwei"))
      })
      
})