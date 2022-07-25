import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import verify from "../utils/verify"
import { networkConfig, developmentChains } from "../helper-hardhat-config"

const DECIMALS = "18"
const INITIAL_PRICE = "2000000000000000000000" // 2000
const deployFundMe: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  // @ts-ignore
  const { network } = hre
  const accounts = await ethers.getSigners()
  const deployer = accounts[0]
  const chainId: number = network.config.chainId!

  let ethUsdPriceFeedAddress: string
  if (chainId == 31337) {
    const mockV3AggregatorFactory = await ethers.getContractFactory(
      "MockV3Aggregator",
      deployer
    )
    const ethUsdAggregator = await mockV3AggregatorFactory.deploy(
      DECIMALS,
      INITIAL_PRICE
    )
    ethUsdPriceFeedAddress = ethUsdAggregator.address
  } else {
    ethUsdPriceFeedAddress = networkConfig[network.name].ethUsdPriceFeed!
  }
  console.log("----------------------------------------------------")
  console.log("Deploying FundMe and waiting for confirmations...")
  const fundMeFactory = await ethers.getContractFactory("FundMe", deployer)
  const fundMe = await fundMeFactory.deploy(ethUsdPriceFeedAddress)
  await fundMe.deployed()
  console.log(`FundMe deployed at ${fundMe.address}`)
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await fundMe.deployTransaction.wait(6)
    await verify(fundMe.address, [ethUsdPriceFeedAddress])
  }
}
export default deployFundMe
deployFundMe.tags = ["all", "fundMe"]
