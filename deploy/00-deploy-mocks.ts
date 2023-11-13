import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { network } from 'hardhat'

import {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER
} from '../helper-hardhat-config'

const deployFunction: DeployFunction = async function ({
    getNamedAccounts,
    deployments
}: HardhatRuntimeEnvironment) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    if (developmentChains.includes(network.name)) {
        log('Local network detected! Deploying mocks...')

        await deploy('MockV3Aggregator', {
            contract: 'MockV3Aggregator',
            from: deployer,
            args: [DECIMALS, INITIAL_ANSWER],
            log: true
        })

        log('Mocks deployed!')
        log('---------------------------')
    }
}

export default deployFunction

deployFunction.tags = ['all', 'mocks']
