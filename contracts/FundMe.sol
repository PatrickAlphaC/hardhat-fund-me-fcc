// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

contract FundMe {
  using PriceConverter for uint256;

  mapping(address => uint256) public s_addressToAmountFunded;
  address[] public s_funders;
  address public s_owner;
  AggregatorV3Interface public s_priceFeed;

  constructor(address priceFeed) {
    s_priceFeed = AggregatorV3Interface(priceFeed);
    s_owner = msg.sender;
  }

  function fund() public payable {
    uint256 minimumUSD = 50 * 10**18;
    require(
      msg.value.getConversionRate(s_priceFeed) >= minimumUSD,
      "You need to spend more ETH!"
    );
    // require(PriceConverter.getConversionRate(msg.value) >= minimumUSD, "You need to spend more ETH!");
    s_addressToAmountFunded[msg.sender] += msg.value;
    s_funders.push(msg.sender);
  }

  function getVersion() public view returns (uint256) {
    return s_priceFeed.version();
  }

  modifier onlyOwner() {
    require(msg.sender == s_owner);
    _;
  }

  function withdraw() public onlyOwner {
    payable(msg.sender).transfer(address(this).balance);
    for (
      uint256 funderIndex = 0;
      funderIndex < s_funders.length;
      funderIndex++
    ) {
      address funder = s_funders[funderIndex];
      s_addressToAmountFunded[funder] = 0;
    }
    s_funders = new address[](0);
  }

  function cheaperWithdraw() public onlyOwner {
    payable(msg.sender).transfer(address(this).balance);
    address[] memory funders = s_funders;
    // mappings can't be in memory, sorry!
    for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++) {
      address funder = funders[funderIndex];
      s_addressToAmountFunded[funder] = 0;
    }
    s_funders = new address[](0);
  }
}
