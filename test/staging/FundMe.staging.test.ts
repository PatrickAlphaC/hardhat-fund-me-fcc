import { ethers, network } from 'hardhat'
import { FundMe } from '../../typechain-types'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import { assert } from 'chai'
import { developmentChains } from '../../helper-hardhat-config'

developmentChains.includes(network.name)
    ? describe.skip
    : describe('FundMe', async function () {
          let fundMe: FundMe
          let deployer: SignerWithAddress

          const sendValue = ethers.parseEther('1')

          beforeEach(async () => {
              const accounts = await ethers.getSigners()

              deployer = accounts[0]

              fundMe = await ethers.getContract('FundMe', deployer)
          })

          it('allows people to fund and withdraw', async () => {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()

              const fundMeAddress = await fundMe.getAddress()

              const endingFundMeBalance =
                  await ethers.provider.getBalance(fundMeAddress)

              assert.equal(endingFundMeBalance.toString(), '0')
          })
      })
