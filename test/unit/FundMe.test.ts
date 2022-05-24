import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { assert, expect } from "chai"
import { network, deployments, ethers } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"
import { FundMe, MockV3Aggregator } from "../../typechain-types"

describe("FundMe", function () {
  let fundMe: FundMe
  let mockV3Aggregator: MockV3Aggregator
  let deployer: SignerWithAddress
  beforeEach(async () => {
    if (!developmentChains.includes(network.name)) {
      throw "You need to be on a development chain to run tests"
    }
    const accounts = await ethers.getSigners()
    deployer = accounts[0]
    await deployments.fixture(["all"])
    fundMe = await ethers.getContract("FundMe")
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator")
  })

  describe("constructor", function() {
    it("sets the aggregator addresses correctly", async () => {
      const response = await fundMe.s_priceFeed()
      assert.equal(response, mockV3Aggregator.address)
    })
  })

  describe("fund", function() {
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
      const response = await fundMe.s_addressToAmountFunded(deployer.address)
      assert.equal(response.toString(), ethers.utils.parseEther("1").toString())
    })
    it("Adds funder to array of funders", async () => {
      await fundMe.fund({ value: ethers.utils.parseEther("1") })
      const response = await fundMe.s_funders(0)
      assert.equal(response, deployer.address)
    })
  })
  describe("withdraw", function() {
    beforeEach(async () => {
      await fundMe.fund({ value: ethers.utils.parseEther("1") })
    })
    it("gives a single funder all their ETH back", async () => {
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
      assert.equal(endingFundMeBalance.toString(), "0")
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      )
    })
    // this test is overloaded. Ideally we'd split it into multiple tests
    // but for simplicity we left it as one
    it("is allows us to withdraw with multiple funders", async () => {
      // Arrange
      const accounts = await ethers.getSigners()
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
      await expect(fundMe.s_funders(0)).to.be.reverted
      assert.equal(
        (await fundMe.s_addressToAmountFunded(accounts[1].address)).toString(),
        "0"
      )
      assert.equal(
        (await fundMe.s_addressToAmountFunded(accounts[2].address)).toString(),
        "0"
      )
      assert.equal(
        (await fundMe.s_addressToAmountFunded(accounts[3].address)).toString(),
        "0"
      )
      assert.equal(
        (await fundMe.s_addressToAmountFunded(accounts[4].address)).toString(),
        "0"
      )
      assert.equal(
        (await fundMe.s_addressToAmountFunded(accounts[5].address)).toString(),
        "0"
      )
    })
  })
})
