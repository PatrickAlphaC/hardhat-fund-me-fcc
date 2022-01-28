const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

describe("FundMe", async () => {
  let fundMe
  let mockV3Aggregator
  let deployer
  beforeEach(async () => {
    if (!developmentChains.includes(network.name)) {
      throw "You need to be on a development chain to run tests"
    }
    deployer = (await getNamedAccounts()).deployer
    await deployments.fixture(["all"])
    fundMe = await ethers.getContract("FundMe", deployer)
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
  })

  describe("constructor", () => {
    it("sets the aggregator addresses correctly", async () => {
      const response = await fundMe.s_priceFeed()
      assert.equal(response, mockV3Aggregator.address)
    })
  })

  describe("fund", () => {
    // https://ethereum-waffle.readthedocs.io/en/latest/matchers.html
    // could also do assert.fail
    it("Fails if you don't send enough ETH", async () => {
      await expect(fundMe.fund()).to.be.revertedWith(
        "You need to spend more ETH!"
      )
    })
    // we could be even more precise here by making sure exactly $50 works
    // but this is good enough for now
    it("Updates the amount funded data structure", async () => {
      await fundMe.fund({ value: ethers.utils.parseEther("1") })
      const response = await fundMe.s_addressToAmountFunded(deployer)
      assert.equal(response.toString(), ethers.utils.parseEther("1").toString())
    })
    it("Adds funder to array of funders", async () => {
      await fundMe.fund({ value: ethers.utils.parseEther("1") })
      const response = await fundMe.s_funders(0)
      assert.equal(response, deployer)
    })
  })
  describe("withdraw", () => {
    beforeEach(async () => {
      await fundMe.fund({ value: ethers.utils.parseEther("1") })
    })
    it("gives a single funder all their ETH back", async () => {
      // Arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

      // Act
      const transactionResponse = await fundMe.withdraw()
      const transactionReceipt = await transactionResponse.wait()
      const { gasUsed, effectiveGasPrice } = transactionReceipt
      const gasCost = gasUsed.mul(effectiveGasPrice)

      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

      // Assert
      assert.equal(endingFundMeBalance, 0)
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      )
    })
    // this test is overloaded. Ideally we'd split it into multiple tests
    // but for simplicity we left it as one
    it("is allows us to withdraw with multiple funders", async () => {
      // Arrange
      accounts = await ethers.getSigners()
      await fundMe
        .connect(accounts[1])
        .fund({ value: ethers.utils.parseEther("1") })
      await fundMe
        .connect(accounts[2])
        .fund({ value: ethers.utils.parseEther("1") })
      await fundMe
        .connect(accounts[3])
        .fund({ value: ethers.utils.parseEther("1") })
      await fundMe
        .connect(accounts[4])
        .fund({ value: ethers.utils.parseEther("1") })
      await fundMe
        .connect(accounts[5])
        .fund({ value: ethers.utils.parseEther("1") })
      // Act
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const startingDeployerBalance = await fundMe.provider.getBalance(deployer)
      const transactionResponse = await fundMe.cheaperWithdraw()
      // Let's comapre gas costs :)
      // const transactionResponse = await fundMe.withdraw()
      const transactionReceipt = await transactionResponse.wait()
      const { gasUsed, effectiveGasPrice } = transactionReceipt
      const withdrawGasCost = gasUsed.mul(effectiveGasPrice)
      console.log(`GasCost: ${withdrawGasCost}`)
      console.log(`GasUsed: ${gasUsed}`)
      console.log(`GasPrice: ${effectiveGasPrice}`)
      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
      // Assert
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(withdrawGasCost).toString()
      )
      await expect(fundMe.s_funders(0)).to.be.reverted
      assert.equal(await fundMe.s_addressToAmountFunded(accounts[1].address), 0)
      assert.equal(await fundMe.s_addressToAmountFunded(accounts[2].address), 0)
      assert.equal(await fundMe.s_addressToAmountFunded(accounts[3].address), 0)
      assert.equal(await fundMe.s_addressToAmountFunded(accounts[4].address), 0)
      assert.equal(await fundMe.s_addressToAmountFunded(accounts[5].address), 0)
    })
  })
})
