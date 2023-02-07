// SPDX-License-Identifier: MIT
// @CRYP70

import "./TestToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";


contract SimpleSwap is ERC20 {
    using SafeMath for uint256;

    ERC20 tokenA;
    ERC20 tokenB;

    uint256 tokenAPrice;
    uint256 tokenBPrice;

    uint256 tokenABalance;
    uint256 tokenBBalance;

    struct LPUserBalances {
        uint256 balanceA;
        uint256 balanceB;
    }

    mapping(address => LPUserBalances) lpBalances;

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

    // Param is the amount of token b to supply
    function getTokenAPrice(uint256 tokenBAmount) view public returns(uint256) {
        return (tokenBAmount * (tokenAPrice)) / 10 ** tokenA.decimals();
    }

    function getTokenBPrice(uint256 tokenAAmount) view public returns(uint256){
        return (tokenAAmount * (tokenBPrice)) / 10 ** tokenB.decimals();
    }

    function addLiquidity(uint256 amountA, uint256 amountB, uint256 deadline) external nonReentrant {
        
        require(block.timestamp < deadline, "Deadline reached!");

        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);

        tokenABalance += amountA;
        tokenBBalance += amountB;

        tokenAPrice = (tokenABalance * (10 ** tokenA.decimals())) / (tokenBBalance);
        tokenBPrice = (tokenBBalance * (10 ** tokenB.decimals())) / (tokenABalance);

        LPUserBalances memory userBal = LPUserBalances(amountA, amountB);
        lpBalances[msg.sender] = userBal; 

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
            tokenAPrice = tokenBBalance; // if balance == 0, the price is the balance amount of the other token
        }
        if(tokenBBalance != 0){
            tokenBPrice = (tokenBBalance * (10 ** tokenB.decimals())) / (tokenABalance);
        }
        else {
            tokenBPrice = tokenABalance;
        }

        _burn(msg.sender, lpAmount);

        tokenA.transfer(msg.sender, tokenAOut);
        tokenB.transfer(msg.sender, tokenBOut);

        emit RemoveLiquidity(msg.sender, lpAmount);

    }

    function swap(
        uint256 tokenAIn, 
        uint256 tokenBIn,  
        uint256 minTokenAOut,
         uint256 minTokenBOut
    ) external nonReentrant {
        require(tokenA.balanceOf(address(this)) > 0, "A: Insufficient liquidity!");
        require(tokenB.balanceOf(address(this)) > 0, "B: Insufficient liquidity!");
        require(tokenAIn > 0 || tokenBIn > 0, "TA || TB !> 0");

        // Handle token a swap first - swap a for b
        if(tokenAIn > 0 ){
            // Slippage protection
            uint256 amountTokenBOut = getTokenBPrice(tokenAIn);
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
            uint256 amountTokenAOut = getTokenAPrice(tokenBIn);
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