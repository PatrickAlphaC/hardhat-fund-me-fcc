const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

describe("FundMe", function () {
    let fundMe
    let deployer
    const sendValue = ethers.utils.parseEther("0.777")
    beforeEach(async () => {
        // if (!developmentChains.includes(network.name)) {
        //   throw "You need to be on a development chain to run tests"
        //
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        await deployments.fixture(["fundMe"])
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    })
})
