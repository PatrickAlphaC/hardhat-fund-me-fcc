import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import verify from "../deploy-helpers/verify"

import { networkConfig, developmentChains } from "../helper-hardhat-config"

const deployFundMe: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, network } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId: number = network.config.chainId!

  let ethUsdPriceFeedAddress: any
  if (chainId == 31337) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator")
    ethUsdPriceFeedAddress = ethUsdAggregator.address
  } else {
    // ethUsdPriceFeedAddress = networkConfig[chainId!].ethUsdPriceFeed
    const fourty = 42
    ethUsdPriceFeedAddress = networkConfig[chainId!]
    // ethUsdPriceFeedAddress = network.config.ethUsdPriceFeed
  }
  log("----------------------------------------------------")
  log("Deploying FundMe and waiting for confirmations...")
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: [ethUsdPriceFeedAddress],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: network.config.blockConfirmations || 0,
  })
  log(`FundMe deployed at ${fundMe.address}`)

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, [ethUsdPriceFeedAddress])
  }
}

module.exports.tags = ["all", "fundMe"]
