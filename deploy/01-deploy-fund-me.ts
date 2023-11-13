import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { network } from 'hardhat'

import { developmentChains, networkConfig } from '../helper-hardhat-config'
import verify from '../utils/verify'

const deployFunction: DeployFunction = async function ({
    getNamedAccounts,
    deployments
}: HardhatRuntimeEnvironment) {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId!

    let ethUsdPriceFeedAddress

    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await get('MockV3Aggregator')
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed
    }

    const args = [ethUsdPriceFeedAddress]

    const fundMe = await deploy('FundMe', {
        from: deployer,
        args,
        log: true,
        waitConfirmations: 1
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }

    log('---------------------------')
}

export default deployFunction

deployFunction.tags = ['all', 'fundme']
