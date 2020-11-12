
const { BigintIsh, ChainId, Fetcher, WETH, Route, Trade, Token, TokenAmount, TradeType, Percent } = require('@uniswap/sdk')
const {ethers} = require('ethers');

const tokenAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

const PRIVATE_KEY = '0x20fcf0f14933bc2776ae189fa92c165976f840038e2fcf8c63c6708bf9e168c6'

const chainId = ChainId.MAINNET;

const init = async () => {

  try {

    const dai = await Fetcher.fetchTokenData(chainId, tokenAddress);

    const weth = WETH[chainId];
    
    const pair = await Fetcher.fetchPairData(dai, weth);
    
    const route = new Route([pair], weth);
    
    const trade = new Trade(route, new TokenAmount(weth, '100000000000000000'), TradeType.EXACT_INPUT);
    
    console.log(route.midPrice.toSignificant(6));
    
    console.log(route.midPrice.invert().toSignificant(6));
    
    console.log(trade.executionPrice.toSignificant(6));
    console.log(trade)
    console.log(trade.nextMidPrice.toSignificant(6));
  
     const slippageTolerance = new Percent(50, 10000);
    
   // const amountOutMin = trade.minimumAmountOut.raw;
  
    const amountOutMin = trade.outputAmount.raw;
    
    const path = [weth.address, dai.address];
    
    const to = '0x2750a4156eA4eA2D4240B256802efe94A41B3924';
    
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    
    const value = trade.inputAmount.raw;
  
    const url = 'https://eth-mainnet.alchemyapi.io/v2/2gdCD03uyFCNKcyEryqJiaPNtOGdsNLv' 

    const provider = new ethers.providers.JsonRpcProvider(url);    
  
    const signer = new ethers.Wallet(PRIVATE_KEY);
    const account = signer.connect(provider);
    const uniswap = new ethers.Contract(
      '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      ['function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)'],
      account
    );
  
    console.log("amount out", amountOutMin, )
    console.log("path", path)
    console.log("to", to)
    console.log("deadline", deadline);
    console.log("value", value);
    const tx = await uniswap.swapExactETHForTokens(
      amountOutMin,
      path,
      to,
      deadline,
      { value, gasPrice: 20e9 }
    );
    console.log(`Transaction hash: ${tx.hash}`);
  
    const receipt = await tx.wait();
    console.log(`Transaction was mined in block ${receipt.blockNumber}`);

  }catch(err){
    console.log(err)
  }

 
}


init();