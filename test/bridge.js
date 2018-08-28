const txProof = require('./util/txProof.js')
const rlp = require('rlp')
const Bridge = artifacts.require('./Bridge.sol')
const sha3 = require('js-sha3').keccak256;



// Global variables (will be references throughout the tests)
let BridgeA;
let BridgeB;


let deposit;
let depositBlock;


// Eason: Variables for merkle proof
let path;
let parentNodes;
let rlpDepositTxData;
let rlpWithdrawTxData;
let txhash

// left-pad half-bytes
function ensureByte(s) {
    if (s.substr(0, 2) == '0x') { s = s.slice(2); }
	if (s.length % 2 == 0) { return `0x${s}`; }
	else { return `0x0${s}`; }
}

contract('Bridge', (accounts) => {
  assert(accounts.length > 0);
	function isEVMException(err) {
		return err.toString().includes('VM Exception') || err.toString().includes('StatusError');
	}



  it('Should create the Bridges for test merkle proof', async () => {
    BridgeA = await Bridge.new();
    BridgeB = await Bridge.new();
    console.log({BridgeAat:BridgeA.address})
    console.log({BridgeBat:BridgeB.address})
  });

  it ('create multiple txs for testing',async () => {
    for(let i=1; i<=30; i++){
    	await web3.eth.sendTransaction({from:accounts[1], to:BridgeB.address, value:1000*i })
    }
  })
    
  it('deposit at the latest block', async () =>{
    depositBlock = await web3.eth.getBlock('latest',true)
    let txs = await depositBlock.transactions
    let i
    if(web3.currentProvider.host == "http://127.0.0.1:9545/"){
      i=0
      console.log("using truffle dev chain, only 1 tx in 1 block\n")
    }else i=2
    console.log("hehehehe",{depositBlock}) 
    console.log("\n******************************************\n")
    deposit = txs[2]
    console.log(i,"\-th transaction is the deposit transaction")
    console.log({deposit})
    assert (deposit !=null)
    console.log("\ndeposit index (path):\n",rlp.encode(deposit.transactionIndex))       
  })


/****************************************************************************/
	
    
  it('prepare patricia proof off chain', async () => {
    
    let {prf, txTrie} = await txProof.build(deposit, depositBlock)
    console.log("prf.parentNodes ( include itself )",prf.parentNodes)
    console.log("\n******************************************\n")
    //console.log({txTrie})
    proof = prf


    //Eason: Create merkle proofs from deposit tx and block. Prove deposit tx is at depositBlock.
    path = ensureByte(rlp.encode(proof.path).toString('hex'));// tx index
    parentNodes = ensureByte(rlp.encode(proof.parentNodes).toString('hex'));//merkle proofs
    const nonce = ensureByte(`0x${parseInt(deposit.nonce).toString(16)}`);
    const gasPrice = ensureByte(`0x${parseInt(deposit.gasPrice).toString(16)}`);
    const gas = ensureByte(`0x${parseInt(deposit.gas).toString(16)}`);

    // Get the network version
    version = parseInt(deposit.chainId);

    rlpDepositTxData = rlp.encode(proof.value);
    rlpWithdrawTxData = rlp.encode([
      nonce, 
      gasPrice, 
      gas, 
      BridgeB.address,
      '', 
      deposit.input, 
      version, 
      "", 
      ""
    ]);



       
  })

/****************************************************************************/
  it('verify merkle proof on chain', async () => {
 
    // Make the transaction
    const verifyTxPatriciaProof = await BridgeA.verifyTxPatriciaProof(
      //Eason : signature
      //deposit.v, 
      [deposit.r, deposit.s, depositBlock.transactionsRoot],
      
      //Eason: cross chain tx ( B --> A )
      //[BridgeB.address, tokenB.address, tokenA.address], 
      
      //Eason: balance
      //5,
      
      //Eason: merkle proof
      path, 
      parentNodes, 
      //version,
      //LAZ: passing as 'hex' results in ascii beeing received in contract
      //Eason: tx on each chain
      rlpDepositTxData.toString('binary'),
      //rlpWithdrawTxData.toString('binary'),
      { /*from: wallets[2][0]*/ gas: 500000 }
    );

    console.log('verifyTxPatriciaProof gas usage:', verifyTxPatriciaProof.receipt.gasUsed);
    assert(verifyTxPatriciaProof.receipt.gasUsed < 500000);
  })    
})