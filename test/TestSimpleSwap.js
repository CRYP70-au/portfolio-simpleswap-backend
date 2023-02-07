const { ethers, upgrades, network } = require('hardhat');
const { expect } = require('chai');

describe('SimpleSwap Tests', function () {
    let deployer, alice, bob, charlie;

    beforeEach(async function () {
        [deployer, user1] = await ethers.getSigners();

        // Setup Scenario
        const testTokenFactory = await ethers.getContractFactory("TestToken", deployer);
        this.tokenA = await testTokenFactory.deploy("TokenA", "A");
        this.tokenB = await testTokenFactory.deploy("TokenB", "B");
      
        const swapFactory = await ethers.getContractFactory("SimpleSwap", deployer);
        this.swap = await swapFactory.deploy(this.tokenA.address, this.tokenB.address);

    });

    it('Should add the correct amount of liquidity', async function () {
        
        const amountA = ethers.utils.parseEther("1000.0");
        const amountB = ethers.utils.parseEther("500.0");
        await this.tokenA.approve(this.swap.address, amountA);
        await this.tokenB.approve(this.swap.address, amountB);

        const deadline = await (await ethers.provider.getBlock("latest")).timestamp + [60 * 60 * 24];

        await this.swap.addLiquidity(amountA, amountB, deadline);
        expect(ethers.utils.formatEther(await this.swap.balanceOf(deployer.address))).to.be.eq("1500.0")
    });

    it('Should add then remove the correct amount of liquidity', async function () {
        
        const amountA = ethers.utils.parseEther("1000.0");
        const amountB = ethers.utils.parseEther("500.0");
        await this.tokenA.approve(this.swap.address, amountA);
        await this.tokenB.approve(this.swap.address, amountB);

        const deadline = await (await ethers.provider.getBlock("latest")).timestamp + [60 * 60 * 24];

        await this.swap.addLiquidity(amountA, amountB, deadline);
        expect(ethers.utils.formatEther(await this.swap.balanceOf(deployer.address))).to.be.eq("1500.0")
        expect(ethers.utils.formatEther(await this.tokenA.balanceOf(this.swap.address))).to.be.eq("1000.0")
        expect(ethers.utils.formatEther(await this.tokenB.balanceOf(this.swap.address))).to.be.eq("500.0")

        // Test prices along the way
        expect(ethers.utils.formatEther(await this.swap.getTokenAPrice(ethers.utils.parseEther("1.0")))).to.be.eq("2.0")
        expect(ethers.utils.formatEther(await this.swap.getTokenBPrice(ethers.utils.parseEther("1.0")))).to.be.eq("0.5")

        let ABalance, BBalance;
        [ABalance, BBalance] = await this.swap.getLPBalance();

        await this.swap.approve(this.swap.address, await this.swap.balanceOf(deployer.address));
        await this.swap.removeLiquidity(ABalance, BBalance, deadline);
        expect(ethers.utils.formatEther(await this.tokenA.balanceOf(deployer.address))).to.be.eq("1000000.0");
        expect(ethers.utils.formatEther(await this.tokenB.balanceOf(deployer.address))).to.be.eq("1000000.0");
        expect(ethers.utils.formatEther(await this.swap.balanceOf(deployer.address))).to.be.eq("0.0");

    });

    it('Should add then remove partial amount of liquidity', async function () {
        
        const amountA = ethers.utils.parseEther("1000.0");
        const amountB = ethers.utils.parseEther("500.0");
        await this.tokenA.approve(this.swap.address, amountA);
        await this.tokenB.approve(this.swap.address, amountB);

        const deadline = await (await ethers.provider.getBlock("latest")).timestamp + [60 * 60 * 24];

        await this.swap.addLiquidity(amountA, amountB, deadline);
        expect(ethers.utils.formatEther(await this.swap.balanceOf(deployer.address))).to.be.eq("1500.0")
        expect(ethers.utils.formatEther(await this.tokenA.balanceOf(this.swap.address))).to.be.eq("1000.0")
        expect(ethers.utils.formatEther(await this.tokenB.balanceOf(this.swap.address))).to.be.eq("500.0")


        const removeA = ethers.utils.parseEther("500.0");
        const removeB = ethers.utils.parseEther("250.0");

        await this.swap.approve(this.swap.address, await this.swap.balanceOf(deployer.address));
        await this.swap.removeLiquidity(removeA, removeB, deadline);

        expect(ethers.utils.formatEther(await this.tokenA.balanceOf(deployer.address))).to.be.eq("999500.0");
        expect(ethers.utils.formatEther(await this.tokenB.balanceOf(deployer.address))).to.be.eq("999750.0");
        expect(ethers.utils.formatEther(await this.swap.balanceOf(deployer.address))).to.be.eq("750.0");

    });


    it('Should add liquidity then swap assets', async function () {
        
        const amountA = ethers.utils.parseEther("1000.0");
        const amountB = ethers.utils.parseEther("500.0");
        await this.tokenA.approve(this.swap.address, amountA);
        await this.tokenB.approve(this.swap.address, amountB);

        const deadline = await (await ethers.provider.getBlock("latest")).timestamp + [60 * 60 * 24];

        await this.swap.addLiquidity(amountA, amountB, deadline);
        expect(ethers.utils.formatEther(await this.swap.balanceOf(deployer.address))).to.be.eq("1500.0")
        expect(ethers.utils.formatEther(await this.tokenA.balanceOf(this.swap.address))).to.be.eq("1000.0")
        expect(ethers.utils.formatEther(await this.tokenB.balanceOf(this.swap.address))).to.be.eq("500.0")


        const user1ss = await this.swap.connect(user1);
        const user1A = await this.tokenA.connect(user1);
        const user1B = await this.tokenB.connect(user1);
        await this.tokenA.transfer(user1.address, ethers.utils.parseEther("100.0"));

        await user1A.approve(this.swap.address, ethers.utils.parseEther("100.0"));
        await user1ss.swap(ethers.utils.parseEther("100.0"), 0, 0, 0);

        expect(ethers.utils.formatEther( await this.tokenB.balanceOf(user1.address) )).to.be.eq("50.0");

    });


    it('Should add liquidity then swap assets and then test slippage tollerance', async function () {
        
        const amountA = ethers.utils.parseEther("1000.0");
        const amountB = ethers.utils.parseEther("500.0");
        await this.tokenA.approve(this.swap.address, amountA);
        await this.tokenB.approve(this.swap.address, amountB);

        const deadline = await (await ethers.provider.getBlock("latest")).timestamp + [60 * 60 * 24];

        await this.swap.addLiquidity(amountA, amountB, deadline);
        expect(ethers.utils.formatEther(await this.swap.balanceOf(deployer.address))).to.be.eq("1500.0")
        expect(ethers.utils.formatEther(await this.tokenA.balanceOf(this.swap.address))).to.be.eq("1000.0")
        expect(ethers.utils.formatEther(await this.tokenB.balanceOf(this.swap.address))).to.be.eq("500.0")


        const user1ss = await this.swap.connect(user1);
        const user1A = await this.tokenA.connect(user1);
        const user1B = await this.tokenB.connect(user1);
        await this.tokenA.transfer(user1.address, ethers.utils.parseEther("100.0"));

        await user1A.approve(this.swap.address, ethers.utils.parseEther("100.0"));
        await expect(user1ss.swap(ethers.utils.parseEther("100.0"), 0, ethers.utils.parseEther("51.0"), 0)).to.be.revertedWith('A: Too much slippage!')

    });

    it('Testing drips for play tokens', async function() {

        const user1token = await this.tokenA.connect(user1);
        expect(ethers.utils.formatEther(await this.tokenA.balanceOf(user1.address))).to.be.eq("0.0");

        await user1token.drip();
        expect(ethers.utils.formatEther(await this.tokenA.balanceOf(user1.address))).to.be.eq("750.0");

        await expect(user1token.drip()).to.be.revertedWith('Only allowed to mint once every 12 hours!');

        await network.provider.send("evm_increaseTime", [60 * 60 * 12]); // 12 hours later
        await user1token.drip();

        expect(ethers.utils.formatEther(await this.tokenA.balanceOf(user1.address))).to.be.eq("1500.0");

    });

});
