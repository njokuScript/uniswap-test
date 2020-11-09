const Web3 = require('web3');
const web3 = new Web3("HTTP://127.0.0.1:8545");
const { ChainId, Fetcher, WETH, Route, Trade, Token, TokenAmount, TradeType, Percent } = require('@uniswap/sdk')
const Uniswap = require('./uniswap.json');


const run = async () => {

//chain id 
const chainId = ChainId.MAINNET;

// dai token address
const tokenAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

// token decimals
const decimals = 18;

// new dai object
const DAI = new Token(chainId, tokenAddress, decimals);

//get pair data for uniswap and WETH
const pair = await Fetcher.fetchPairData(DAI, WETH[DAI.chainId]);

console.log('pair', pair);

//trade route
const route = new Route([pair], WETH[DAI.chainId])

/* global BigInt */
 const amountIn = BigInt(100000000000000000) // 1 WETH

   // new trade object
   const trade = new Trade(route, new TokenAmount(WETH[DAI.chainId], amountIn), TradeType.EXACT_INPUT)

   console.log( "trade object", trade);
   
   const slippageTolerance = new Percent('50', '10000') // 50 bips, or 0.50%

   const amountOutMin = trade.minimumAmountOut(slippageTolerance) // needs to be converted to e.g. hex

   console.log("slippage tolerance", amountOutMin)

   const path = [WETH[DAI.chainId].address, DAI.address]

   const to = '0x8d1d225ACcD96774963d47c108F097392C5f1ebC';

   const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current time


   console.log(route.midPrice.toSignificant(6));
   console.log(route.midPrice.invert().toSignificant(6));
   console.log(trade.executionPrice.toSignificant(6));
   console.log(trade.nextMidPrice.toSignificant(6));

   const value = trade.inputAmount.raw
   
   const uniswap = new web3.eth.Contract(Uniswap.abi, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',)

   const transaction = await uniswap.methods.swapExactETHForTokens(amountOutMin, path, to, deadline).send({ from: '0x8d1d225ACcD96774963d47c108F097392C5f1ebC', value: value})


   console.log(transaction, "transaction receipt object");

}

run();