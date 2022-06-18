const { assert } = require('chai');
const { default: Web3 } = require('web3');

const Token = artifacts.require("Token");
const EthSwap = artifacts.require("EthSwap");

require('chai')
  .use(require('chai-as-promised'))
  .should()

function tokens(n) {
  return web3.utils.toWei(n, 'ether');
}  

contract('EthSwap', ([deployer, investor]) => {
  let token,ethSwap
  
  before(async() => {
    token = await Token.new()
    ethSwap = await EthSwap.new(token.address)
    //transfer all the tokens to the eth swap smart contract
    await token.transfer(ethSwap.address , tokens('1000000'))
  })

  describe('Token deployment', async () => {
    it('contract has a name', async () => {
        const name = await token.name()
        assert.equal(name, 'Sample Token')
    })
  })

  describe('EthSwap deployment', async () => {
    it('contract has a name', async () => {
        const name = await ethSwap.name()
        assert.equal(name, 'EthSwap Instant Exchange')
    })

    it('Contract has tokens', async () => {
      let balance = await token.balanceOf(ethSwap.address)
      assert.equal(balance.toString(), tokens('1000000'))
    })
  })

  describe('buyTokens()', async () =>{
    let result

    before(async() => {
      // purchase tokens before every example
      result = await ethSwap.buyTokens({ from: investor, value: web3.utils.toWei('1', 'ether')})
    })
    it('allows the user to buy the custom created token at a fixed rate', async () => {
      // to check the investor token balance after purchase
      let investorBalance = await token.balanceOf(investor)
      assert.equal(investorBalance.toString(), tokens('100'))

      // Check the balance after purchase 
      let ethSwapBalance = await token.balanceOf(ethSwap.address)
      assert.equal(ethSwapBalance.toString(), tokens('999900'))
      ethSwapBalance = await web3.eth.getBalance(ethSwap.address)
      assert.equal(ethSwapBalance.toString(), web3.utils.toWei('1', 'Ether'))

      const event = result.logs[0].args
      assert.equal(event.account, investor)
      assert.equal(event.token, token.address)
      assert.equal(event.amount.toString(), tokens('100').toString())
      assert.equal(event.rate.toString(), '100')
    })
  })

  describe('sellTokens()', async () => {
    let result

    before(async() => {
      //investor should approve before selling
      await token.approve(ethSwap.address, tokens('100'), { from: investor})
      //Investor sells the tokens
      result = await ethSwap.sellTokens(tokens('100'), { from: investor})
    })
      it('allows the user to sell the custom created token at a fixed rate', async () => {
      //checking the investor balance after selling the tokens 
      let investorBalance = await token.balanceOf(investor)
      assert.equal(investorBalance.toString(), tokens('0'))

      // Check the balance after selling tokens 
      let ethSwapBalance = await token.balanceOf(ethSwap.address)
      assert.equal(ethSwapBalance.toString(), tokens('1000000'))
      ethSwapBalance = await web3.eth.getBalance(ethSwap.address)
      assert.equal(ethSwapBalance.toString(), web3.utils.toWei('0', 'Ether'))

      const event = result.logs[0].args
      assert.equal(event.account, investor)
      assert.equal(event.token, token.address)
      assert.equal(event.amount.toString(), tokens('100').toString())
      assert.equal(event.rate.toString(), '100')

      //Failure test case , trying to sell tokens than what he has 

      await ethSwap.sellTokens(tokens('500'), {from: investor}).should.be.rejected;
    })
  })
  

  



})