// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Staking is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;

    uint256 public maxStakePeriod;
    uint256 public multiplier;
    uint256 public minLockPeriod;
    uint256 public rewardAmount;

    IERC20 public testToken;

    struct StakingItem {
        uint256 itemId;
        uint256 stakedAmount;
        uint256 stakedBlock;
        address tokenOwner;
    }

    mapping(uint256 => StakingItem) public items;

    mapping(address => uint256) public itemIdToUser;

    Counters.Counter public stakingItemCount;

    constructor(
        uint256 _maxStakePeriod,
        uint256 _multiplier,
        uint256 _minLockPeriod,
        IERC20 _testToken
    ) {
        maxStakePeriod = _maxStakePeriod;
        multiplier = _multiplier;
        testToken = _testToken;
        minLockPeriod = _minLockPeriod;
    }

    function setMaxStakePeriod(uint256 _maxStakePeriod) public onlyOwner {
        require(
            maxStakePeriod != 0,
            "Max Stake Period couldn't be zero!"
        );
        maxStakePeriod = _maxStakePeriod;
    }

    function setMultiplier(uint256 _multiplier) public onlyOwner {
        require(
            _multiplier != 0,
            "Multiplier Value couldn't be zero!"
        );
        multiplier = _multiplier;
    }

    function depositReward(uint256 _amount) public onlyOwner {
        require(_amount != 0, "Reward Amount couldn't be zero!");
    
        testToken.transferFrom(msg.sender, address(this), _amount);
        rewardAmount += _amount;
    }

    function setMinLockPeriod(uint256 _minLockPeriod) public onlyOwner {
        require(
            _minLockPeriod != 0,
            "Multiplier Value couldn't be zero!"
        );
        minLockPeriod = _minLockPeriod;
    }

    function stakeToken(uint256 stakeAmount) public nonReentrant{
        require(stakeAmount != 0, "Stake Amount couldn't be zero!");
        require(itemIdToUser[msg.sender] == 0, "You can't stake again!");

        stakingItemCount.increment();
        uint256 _itmeId = stakingItemCount.current();
        testToken.transferFrom(msg.sender, address(this), stakeAmount);
        
        items[_itmeId] = StakingItem(
            _itmeId,
            stakeAmount,
            block.number,
            msg.sender
        );

        itemIdToUser[msg.sender] = _itmeId;
    }

    function withdrawToken() public nonReentrant{
        require(itemIdToUser[msg.sender] != 0, "You are not user who did stake!");

        uint256 passedBlocks = block.number - items[itemIdToUser[msg.sender]].stakedBlock;

        require(passedBlocks > minLockPeriod, "You need to wait for Minimal Lock Period!");
        
        if(passedBlocks > maxStakePeriod) passedBlocks = maxStakePeriod;

        uint256 userReward = multiplier * items[itemIdToUser[msg.sender]].stakedAmount * passedBlocks / maxStakePeriod;

        require(rewardAmount >= userReward, "Reward Token insufficant");


        testToken.transfer(msg.sender, userReward + items[itemIdToUser[msg.sender]].stakedAmount);

        itemIdToUser[msg.sender] = 0;
    }

    function getRewardTokenAmount(address _user) external view returns (uint256 userReward) {
        require(itemIdToUser[_user] != 0, "You are not user who did stake!");

        uint256 passedBlocks = block.number - items[itemIdToUser[_user]].stakedBlock;

        if(passedBlocks > maxStakePeriod) passedBlocks = maxStakePeriod;

        userReward = multiplier * items[itemIdToUser[_user]].stakedAmount * passedBlocks / maxStakePeriod;
        
    }

    function getStakedAmount(address _user) external view returns (uint256 stakedAmount) {
        require(itemIdToUser[_user] != 0, "You are not user who did stake!");
        stakedAmount = items[itemIdToUser[_user]].stakedAmount;
    }

}