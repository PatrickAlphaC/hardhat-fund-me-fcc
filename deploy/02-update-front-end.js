import { frontEndContractsFile } from "../helper-hardhat-config"
import * as fs from "fs"
import { network } from "hardhat"

module.exports = async () => {
  if (process.env.UPDATE_FRONT_END) {
    console.log("Writing to front end...")
    const fundMe = await ethers.getContract("FundMe")
    const contractAddresses = JSON.parse(
      fs.readFileSync(frontEndContractsFile, "utf8")
    )
    if (network.config.chainId.toString() in contractAddresses) {
      if (
        !contractAddresses[network.config.chainId.toString()].includes(
          fundMe.address
        )
      ) {
        contractAddresses[network.config.chainId.toString()].push(
          fundMe.address
        )
      }
    } else {
      contractAddresses[network.config.chainId.toString()] = [fundMe.address]
    }
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
    console.log("Front end written!")
  }
}
export default updateFrontEnd
updateFrontEnd.tags = ["all", "frontend"]
