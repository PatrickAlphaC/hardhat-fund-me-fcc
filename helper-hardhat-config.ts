export interface networkConfigItem {
  name: string
  ethUsdPriceFeed?: string
  blockConfirmations?: number
}

export interface networkConfigInfo {
  [key: number]: networkConfigItem
}

export const networkConfig: networkConfigInfo = {
  // Price Feed Address, values can be obtained at https://docs.chain.link/data-feeds/price-feeds/addresses
  // Default one is ETH/USD contract on Sepolia
  31337: {
    name: "localhost",
  },
  11155111: {
    name: "sepolia",
    ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    blockConfirmations: 6,
  },
}

export const developmentChains = ["hardhat", "localhost"]
export const DECIMALS = 8
export const INITIAL_ANSWER = 200000000000
