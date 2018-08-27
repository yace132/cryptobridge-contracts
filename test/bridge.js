const txProof = require('./util/txProof.js')
const rlp = require('rlp')
const Bridge = artifacts.require('./Bridge.sol')




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

  xit ('create multiple txs before deposit',async () => {
    for(let i=1; i<=10; i++){
    	await web3.eth.sendTransaction({from:accounts[1],to: BridgeB.address, value:1000*i })
    }
  })

  xit ('create deposit tx',async () => {
    web3.eth.sendTransaction({from:accounts[1], to:BridgeB.address, value:123456},function(err, transactionHash){
      if(!err){
        txhash = transactionHash
        console.log({txhash})
    	}
    })
  })

  it ('create multiple txs after deposit',async () => {
    for(let i=11; i<=30; i++){
    	await web3.eth.sendTransaction({from:accounts[1], to:BridgeB.address, value:1000*i })
    }
  })

    
  xit('get deposit tx ( create by self )', async () =>{
    await web3.eth.getTransaction(txhash, async function(err, tx){
      if(!err) {
      	deposit = tx
      	console.log({deposit})
      	depositBlock = await web3.eth.getBlock(deposit.blockHash,true)
      	console.log({depositBlock}) 
      }else{
      	console.log({err})
      }
    })
  })

  it('get newest tx as deposit tx', async () =>{
    depositBlock = await web3.eth.getBlock('latest',true)
    let txs = depositBlock.transactions
    //txhash = txs[0]
    deposit = txs[0]//await web3.eth.getTransaction(txhash)
    console.log({depositBlock}) 
    console.log("\n******************************************\n")
    console.log({deposit})
    assert (deposit !=null)
    console.log("deposit hash:\n",rlp.encode(deposit.hash))
    console.log("deposit index:\n",rlp.encode(deposit.transactionIndex))       
  })

   	//{"status":"1","message":"OK","result":{"blockNumber":"4000000","timeStamp":"1499633567","blockMiner":"0x1e9939daaad6924ad004c2560e90804164900341","blockReward":"5080541147548670819","uncles":[],"uncleInclusionReward":"0"}}


/****************************************************************************/
	
    
  it('prepare merkle proof off chain', async () => {
    
    let {prf, txTrie} = await txProof.build(deposit, depositBlock)
    console.log("prf.parentNodes",prf.parentNodes)
    console.log("\n******************************************\n")
    console.log({txTrie})
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
    const merkleWithdraw = await BridgeA.merkleWithdraw(
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

    console.log('merkleWithdraw gas usage:', merkleWithdraw.receipt.gasUsed);
    assert(merkleWithdraw.receipt.gasUsed < 500000);
  })    
})