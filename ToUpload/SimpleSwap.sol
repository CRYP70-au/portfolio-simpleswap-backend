// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./TestToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";


// To be deployed on goreli testnet
contract SimpleSwap is ERC20 {
    using SafeMath for uint256;

    ERC20 public tokenA;
    ERC20 public tokenB;

    uint256 public tokenAPrice;
    uint256 public tokenBPrice;

    uint256 public tokenABalance;
    uint256 public tokenBBalance;

    struct LPUserBalances {
        uint256 balanceA;
        uint256 balanceB;
    }

    mapping(address => LPUserBalances) public lpBalances;

    uint256 entered = 0;
    modifier nonReentrant() {
        require(entered != 1, "Reentrancy detected");
        entered = 1;
        _;
        entered = 0;
    }

    event AddLiquidity(address, uint256, uint256);
    event RemoveLiquidity(address, uint256);
    event SimpleSwapped(address, uint256, uint256);

    constructor(address _tokenA, address _tokenB) ERC20("Token A / Token B LP Pool", "ABLP") {
        tokenA = ERC20(_tokenA);
        tokenB = ERC20(_tokenB);
    }

    // How much of token b we get out for supplying token a
    function getTokenAPrice(uint256 tokenAAmount) view public returns(uint256) {
        return (tokenAAmount * (tokenBPrice)) / 10 ** tokenB.decimals();
    }

    // How much of token a we get out for supplying token b
    function getTokenBPrice(uint256 tokenBAmount) view public returns(uint256) {
        return (tokenBAmount * (tokenAPrice)) / 10 ** tokenA.decimals();
    }


    function getLPBalance() view external returns(uint256, uint256) {
        LPUserBalances memory lpBalance = lpBalances[msg.sender];
        return (lpBalance.balanceA, lpBalance.balanceB);
    }

    function getTokenABalance() view external returns(uint256) {
        return tokenABalance;
    }    

    function getTokenBBalance() view external returns(uint256) {
        return tokenBBalance;
    }

    function addLiquidity(uint256 amountA, uint256 amountB, uint256 deadline) external nonReentrant {
        // TODO - maintain x*y=k
        require(block.timestamp < deadline, "Deadline reached!");

        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);

        tokenABalance += amountA;
        tokenBBalance += amountB;

        tokenAPrice = (tokenABalance * (10 ** tokenA.decimals())) / (tokenBBalance);
        tokenBPrice = (tokenBBalance * (10 ** tokenB.decimals())) / (tokenABalance);

        
        if(lpBalances[msg.sender].balanceA == 0 && lpBalances[msg.sender].balanceB == 0){
            LPUserBalances memory userBal = LPUserBalances(amountA, amountB);
            lpBalances[msg.sender] = userBal; 
        } 
        else {
            LPUserBalances memory userBal = lpBalances[msg.sender];
            userBal.balanceA += amountA;
            userBal.balanceB += amountB;
            lpBalances[msg.sender] = userBal;
        }

        uint256 lpToMint = amountA+ amountB;
        _mint(msg.sender, lpToMint);

        emit AddLiquidity(msg.sender, amountA, amountB);

    }

    function removeLiquidity(uint256 tokenAOut, uint256 tokenBOut, uint256 deadline) external nonReentrant {
        require(block.timestamp < deadline, "Deadline reached!");
        uint256 lpAmount = tokenAOut + tokenBOut;

        LPUserBalances memory userBal = lpBalances[msg.sender];
        userBal.balanceA -= tokenAOut;
        userBal.balanceB -= tokenBOut;

        // Updates User Balances
        lpBalances[msg.sender] = userBal;

        tokenABalance -= tokenAOut;
        tokenBBalance -= tokenBOut;


        if(tokenABalance != 0){
            tokenAPrice = (tokenABalance * (10 ** tokenA.decimals())) / (tokenBBalance);
        }
        else{
            tokenAPrice = tokenBBalance; // if balance == 0, the price is the balance amount of the other token perserving x * y = k
        }
        if(tokenBBalance != 0){
            tokenBPrice = (tokenBBalance * (10 ** tokenB.decimals())) / (tokenABalance);
        }
        else {
            tokenBPrice = tokenABalance;
        }

        if(userBal.balanceA == 0 && userBal.balanceB == 0){
            delete lpBalances[msg.sender];
        }

        _burn(msg.sender, lpAmount);

        tokenA.transfer(msg.sender, tokenAOut);
        tokenB.transfer(msg.sender, tokenBOut);

        emit RemoveLiquidity(msg.sender, lpAmount);

    }

    function swap(
        uint256 tokenAIn, 
        uint256 tokenBIn,  
        uint256 minTokenBOut,
        uint256 minTokenAOut
    ) external nonReentrant {
        require(tokenA.balanceOf(address(this)) > 0, "A: Insufficient liquidity!");
        require(tokenB.balanceOf(address(this)) > 0, "B: Insufficient liquidity!");
        require(tokenAIn > 0 || tokenBIn > 0, "TA || TB !> 0");

        if(tokenAIn > 0 ){
            // Slippage protection
            uint256 amountTokenBOut = getTokenAPrice(tokenAIn);
            require(amountTokenBOut >= minTokenBOut , "A: Too much slippage!");
            // Update balances
            tokenABalance += tokenAIn;
            tokenBBalance -= amountTokenBOut;

            // Update Prices
            tokenAPrice = (tokenABalance * (10 ** tokenA.decimals())) / (tokenBBalance);
            tokenBPrice = (tokenBBalance * (10 ** tokenB.decimals())) / (tokenABalance);

            // Conduct transfer
            tokenA.transferFrom(msg.sender, address(this), tokenAIn);
            tokenB.transfer(msg.sender, amountTokenBOut);
        }
        if(tokenBIn > 0 ){
            // Slippage protection
            uint256 amountTokenAOut = getTokenBPrice(tokenBIn);
            require(amountTokenAOut >= minTokenAOut , "B: Too much slippage!");

            // Update balances
            tokenBBalance += tokenBIn;
            tokenABalance -= amountTokenAOut;

            // Update Prices
            tokenAPrice = (tokenABalance * (10 ** tokenA.decimals())) / (tokenBBalance);
            tokenBPrice = (tokenBBalance * (10 ** tokenB.decimals())) / (tokenABalance);

            // Conduct transfer
            tokenB.transferFrom(msg.sender, address(this), tokenBIn);
            tokenA.transfer(msg.sender, amountTokenAOut);
        }
        emit SimpleSwapped(msg.sender, tokenAIn, tokenBIn);

    }

}