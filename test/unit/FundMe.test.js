const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

describe("FundMe", async () => {
  let fundMe
  let mockV3Aggregator
  let deployer
  const sendValue = ethers.utils.parseEther("0.777")
  beforeEach(async () => {
    // if (!developmentChains.includes(network.name)) {
    //   throw "You need to be on a development chain to run tests"
    //
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    await deployments.fixture(["all"])
    fundMe = await ethers.getContract("FundMe", deployer)
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
  })

  describe("constructor", () => {
    it("sets the aggregator addresses correctly", async () => {
      const response = await fundMe.getPriceFeed()
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
      await fundMe.fund({ value: sendValue })
      const response = await fundMe.getAddressToAmountFunded(deployer.address)
      assert.equal(response.toString(), sendValue.toString())
    })
    it("Adds funder to array of funders", async () => {
      await fundMe.fund({ value: sendValue })
      const response = await fundMe.getFunder(0)
      assert.equal(response, deployer.address)
    })
  })
  describe("withdraw", () => {
    beforeEach(async () => {
      await fundMe.fund({ value: sendValue })
    })
    it("withdraws ETH from a single funder", async () => {
      // Arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      )

      // Act
      const transactionResponse = await fundMe.withdraw()
      const transactionReceipt = await transactionResponse.wait()
      const { gasUsed, effectiveGasPrice } = transactionReceipt
      const gasCost = gasUsed.mul(effectiveGasPrice)

      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const endingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      )

      // Assert
      // Maybe clean up to understand the testing
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
      for (i = 1; i < 6; i++) {
        await fundMe.connect(accounts[i]).fund({ value: sendValue })
      }
      // Act
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      )
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
      const endingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      )
      // Assert
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(withdrawGasCost).toString()
      )
      // Make a getter for storage variables
      await expect(fundMe.getFunder(0)).to.be.reverted

      for (i = 1; i < 6; i++) {
        assert.equal(
          await fundMe.getAddressToAmountFunded(accounts[i].address),
          0
        )
      }
    })
  })
})
