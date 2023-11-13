import { ethers } from 'hardhat'
import { FundMe } from '../typechain-types'

async function main() {
    const accounts = await ethers.getSigners()

    const deployer = accounts[0]

    const fundMe: FundMe = await ethers.getContract('FundMe', deployer)

    const transactionResponse = await fundMe.fund({
        value: ethers.parseEther('1')
    })

    await transactionResponse.wait(1)

    console.log('Funded!')
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
