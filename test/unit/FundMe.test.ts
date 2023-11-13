import { ethers, deployments, network } from 'hardhat'
import { FundMe, MockV3Aggregator } from '../../typechain-types'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import { assert, expect } from 'chai'
import { ContractTransactionReceipt } from 'ethers'
import { developmentChains } from '../../helper-hardhat-config'

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('FundMe', () => {
          let fundMe: FundMe
          let mockV3Aggregator: MockV3Aggregator
          let deployer: SignerWithAddress
          const sendValue = ethers.parseEther('1')

          beforeEach(async () => {
              const accounts = await ethers.getSigners()

              deployer = accounts[0]

              await deployments.fixture(['all'])

              fundMe = await ethers.getContract('FundMe', deployer)
              mockV3Aggregator = await ethers.getContract(
                  'MockV3Aggregator',
                  deployer
              )
          })

          describe('constructor', async () => {
              it('sets the aggregator addresses correctly', async () => {
                  const response = await fundMe.getPriceFeed()
                  const mockAddress = await mockV3Aggregator.getAddress()

                  assert.equal(response, mockAddress)
              })
          })

          describe('fund', async () => {
              it("fails if you don' send enough ETH", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't send enough ETH!"
                  )
              })

              it('updates the amount funded data structure', async () => {
                  await fundMe.fund({ value: sendValue })

                  const response = await fundMe.getAddressToAmountFunded(
                      deployer.address
                  )

                  assert.equal(response.toString(), sendValue.toString())
              })

              it('adds funder to array of getFunder', async () => {
                  await fundMe.fund({ value: sendValue })

                  const funder = await fundMe.getFunder(0)

                  assert.equal(funder, deployer.address)
              })
          })

          describe('withdraw', async () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })

              it('withdraw ETH from a single funder', async () => {
                  // Arrange

                  fundMe.connect(deployer)

                  const fundMeAddress = await fundMe.getAddress()

                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMeAddress)

                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer.address)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = (await transactionResponse.wait(
                      1
                  )) as ContractTransactionReceipt

                  const { gasUsed, gasPrice } = transactionReceipt

                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance =
                      await ethers.provider.getBalance(fundMeAddress)
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer.address)

                  // Assert
                  assert.equal(endingFundMeBalance.toString(), '0')
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )
              })

              it('allows us to withdraw with multiple getFunder', async () => {
                  const accounts = await ethers.getSigners()

                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )

                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const fundMeAddress = await fundMe.getAddress()

                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMeAddress)

                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer.address)

                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = (await transactionResponse.wait(
                      1
                  )) as ContractTransactionReceipt

                  const { gasUsed, gasPrice } = transactionReceipt

                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance =
                      await ethers.provider.getBalance(fundMeAddress)
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer.address)

                  assert.equal(endingFundMeBalance.toString(), '0')
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )

                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          (
                              await fundMe.getAddressToAmountFunded(
                                  accounts[i].address
                              )
                          ).toString(),
                          '0'
                      )
                  }
              })

              it('only allows the owner to withdraw', async () => {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract =
                      await fundMe.connect(attacker)

                  await expect(attackerConnectedContract.withdraw()).to.be
                      .reverted
              })

              it('cheaperWithdraw testing...', async () => {
                  const accounts = await ethers.getSigners()

                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )

                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const fundMeAddress = await fundMe.getAddress()

                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMeAddress)

                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer.address)

                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = (await transactionResponse.wait(
                      1
                  )) as ContractTransactionReceipt

                  const { gasUsed, gasPrice } = transactionReceipt

                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance =
                      await ethers.provider.getBalance(fundMeAddress)
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer.address)

                  assert.equal(endingFundMeBalance.toString(), '0')
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )

                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          (
                              await fundMe.getAddressToAmountFunded(
                                  accounts[i].address
                              )
                          ).toString(),
                          '0'
                      )
                  }
              })
          })
      })
