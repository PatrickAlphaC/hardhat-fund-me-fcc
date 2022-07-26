import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"

const DECIMALS = "18"
const INITIAL_PRICE = "2000000000000000000000" // 2000
const deployMocks: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { network, getNamedAccounts } = hre
  const { deployer } = await getNamedAccounts()

  const chainId = network.config.chainId
  // If we are on a local development network, we need to deploy mocks!
  if (chainId == 31337) {
    console.log("Local network detected! Deploying mocks...")
    const mockV3AggregatorFactory = await ethers.getContractFactory(
      "MockV3Aggregator",
      deployer
    )
    await mockV3AggregatorFactory.deploy(DECIMALS, INITIAL_PRICE)
    console.log("Mocks Deployed!")
    console.log("----------------------------------")
    console.log(
      "You are deploying to a local network, you'll need a local network running to interact"
    )
    console.log(
      "Please run `yarn hardhat console` to interact with the deployed smart contracts!"
    )
    console.log("----------------------------------")
  }
}
export default deployMocks
deployMocks.tags = ["all", "mocks"]
