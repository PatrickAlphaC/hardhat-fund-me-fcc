const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    let response = await ethers.provider.getStorageAt(fundMe.address, 0)
    console.log(response)
    response = await ethers.provider.getStorageAt(fundMe.address, 1)
    console.log(response)
    response = await ethers.provider.getStorageAt(fundMe.address, 2)
    console.log(response)
    response = await ethers.provider.getStorageAt(fundMe.address, 3)
    console.log(response)
    const mockV3Aggregator = await ethers.getContract("MockV3Aggregator")
    console.log(mockV3Aggregator.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
