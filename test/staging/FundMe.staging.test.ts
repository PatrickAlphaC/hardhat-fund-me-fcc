import { assert } from "chai"
import { ethers, network } from "hardhat"
import { developmentChains, networkConfig } from "../../helper-hardhat-config"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { FundMe, FundMe__factory } from "../../typechain-types"

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe Staging Tests", async function () {
      let fundMe: FundMe
      let deployer: SignerWithAddress

      const sendValue = ethers.utils.parseEther("0.1")
      beforeEach(async function () {
        const accounts = await ethers.getSigners()
        deployer = accounts[0]

        //Deploying FundMe Contract
        const fundMeFactory = (await ethers.getContractFactory(
          "FundMe",
          deployer
        )) as FundMe__factory
        fundMe = (await fundMeFactory.deploy(
          networkConfig[network.name].ethUsdPriceFeed!
        )) as FundMe
      })

      it("Allows people to fund and withdraw", async function () {
        await fundMe.fund({ value: sendValue })
        await fundMe.withdraw({
          gasLimit: 100000,
        })
        const endingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        )
        console.log(
          endingFundMeBalance.toString() +
            " should equal 0, running assert equal..."
        )
        assert.equal(endingFundMeBalance.toString(), "0")
      })
    })
