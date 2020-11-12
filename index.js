const {
  BigintIsh,
  ChainId,
  Fetcher,
  WETH,
  Route,
  Trade,
  Token,
  TokenAmount,
  TradeType,
  Percent,
} = require("@uniswap/sdk");
const { ethers } = require("ethers");

const Web3 = require("web3");

const web3 = new Web3("http://localhost:8545");


const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

const PRIVATE_KEY =
  "0x1e3b6140bdc9389b2023f48b949de8251014b0043a38ac03f6e493958add7167";

const chainId = ChainId.MAINNET;

// "borrow" from this account - must be unlocked in ganache-cli
//not necessary as ganache generated accounts as 100 ethers
const ethBorrowAccount = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

const init = async () => {
  try {
    const provider = new ethers.providers.JsonRpcProvider();

    const signer = new ethers.Wallet(PRIVATE_KEY);

    const account = signer.connect(provider);

    const dai = await Fetcher.fetchTokenData(chainId, daiAddress);

    const weth = WETH[chainId];

    //token pair
    const pair = await Fetcher.fetchPairData(dai, weth);

    const route = new Route([pair], weth);

    // trade object
    const trade = new Trade(
      route,
      new TokenAmount(weth, "100000000000000000"),
      TradeType.EXACT_INPUT
    );

    console.log(route.midPrice.toSignificant(6));

    console.log(route.midPrice.invert().toSignificant(6));

    console.log(trade.executionPrice.toSignificant(6));

    console.log(trade.nextMidPrice.toSignificant(6));

    
    const slippageTolerance = new Percent("50", "10000");

    //this bastard alone was causing my issues
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;

    //converting it to hex using ethers BigNumber works
    const amountOutMinHex = ethers.BigNumber.from(
      amountOutMin.toString()
    ).toHexString();

    console.log(amountOutMinHex);

    //trade path
    const path = [weth.address, dai.address];

    //recepient account
    const to = account.address;

    //trade deadline
    const deadline = Math.floor(Date.now() / 1000) + 60 * 2;

    //this bastard was also causing my issues
    const inputAmount = trade.inputAmount.raw;
    // this fixed it  
    const inputAmountHex = ethers.BigNumber.from(
      inputAmount.toString()
    ).toHexString();

    // // do the transfer
    // const txHash = await web3.eth
    //   .sendTransaction({
    //     from: ethBorrowAccount,
    //     to: account.address,
    //     value: web3.utils.toWei("100", "ether"),
    //   })
    //   .catch((e) => {
    //     throw Error("Error sending transaction: " + e.message);
    //   });

    // console.log("txHash: " + txHash.transactionHash);

    //get ether balance
    const ethBalance = await web3.eth.getBalance(account.address);
    console.log("eth balance: " + web3.utils.fromWei(ethBalance, "ether"));

    //declare the Uniswap inteface
    const uniswap = new ethers.Contract(
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      [
        "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
      ],
      account
    );

    // declare the DAI contract interfaces
    const daiContract = new ethers.Contract(
      daiAddress,
      [
        "function balanceOf(address owner) external view returns (uint)",
        "function decimals() external view returns (uint8)",
      ],
      account
    );

    // work out our current Dai balance
    let balance = await daiContract.balanceOf(account.address);
    const decimals = await daiContract.decimals();
    console.log(
      "initial Dai balance: " +
        ethers.utils.formatUnits(balance.toString(), decimals)
    );

    console.log(inputAmountHex, "value");

    //get current gas price
    const gasPrice = await provider.getGasPrice();


    //implement the swap
    const tx = await uniswap.swapExactETHForTokens(
      amountOutMinHex,
      path,
      to,
      deadline,
      {
        value: inputAmountHex,
        gasPrice: gasPrice.toHexString(),
        gasLimit: ethers.BigNumber.from(150000).toHexString(),
      }
    );
    console.log(`Transaction hash: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`Transaction receipt ${receipt.blockNumber}`);

    // display the final balance
    balance = await daiContract.balanceOf(account.address);
    console.log(
      "final Dai balance: " + ethers.utils.formatUnits(balance.toString(), decimals)
    );
  } catch (err) {
    console.log(err);
  }
};

init();
