const txProof = require('./util/txProof.js')
const rProof = require('./util/receiptProof.js');
const rlp = require('rlp')
const Bridge = artifacts.require('./Bridge.sol')
const sha3 = require('js-sha3').keccak256;
const JOY = "0xdde12a12a6f67156e0da672be05c374e1b0a3e57"
const Web3 = require('web3');

// Global variables (will be references throughout the tests)
let BridgeA;
let BridgeB;


let deposit;
let depositBlock;
let depositBlockSlim;


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
    for(let i=1; i<=8; i++){
    	await web3.eth.sendTransaction({from:accounts[1], to:accounts[2], value:1000000+i })
    }
  })
    
  it('deposit at bridgeB',async()=>{
    const _deposit = await BridgeB.deposit(JOY, BridgeA.address, 777777)
    let r = _deposit.receipt
    deposit = await web3.eth.getTransaction(r.transactionHash);
    console.log({deposit})

    assert (deposit !=null)
    console.log("\ndeposit index (path):\n",rlp.encode(deposit.transactionIndex))   
    console.log("\n******************************************\n")
    depositBlock = await web3.eth.getBlock(r.blockHash, true);
    depositBlockSlim = await web3.eth.getBlock(r.blockHash, false);
    console.log({depositBlock})
    console.log("\n******************************************\n")
    depositReceipt = await web3.eth.getTransactionReceipt(r.transactionHash);
    console.log({depositReceipt})
    console.log(depositReceipt.logs)
  })

  xit ('create multiple txs after deposit',async () => {
    for(let i=10; i<=18; i++){
      await web3.eth.sendTransaction({from:accounts[2], to:accounts[1], value:1000000+i })
    }
  })

/****************************************************************************/
	
    
  xit('prepare patricia proof off chain', async () => {
    
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
  xit('verify merkle proof on chain', async () => {
 
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



  /****************************************************************************/
  
    
   it('Should prove the state root', async () => {
      // Get the receipt proof
      const receiptProof = await rProof.buildProof(depositReceipt, depositBlockSlim, web3);
      
      const path = ensureByte(rlp.encode(receiptProof.path).toString('hex'));
      parentNodes = ensureByte(rlp.encode(receiptProof.parentNodes).toString('hex'));
      const checkpoint2 = txProof.verify(receiptProof, 5);
      console.log("[ evm >> ] logs \n",depositReceipt.logs)
      console.log("\n************** let's encode logs on client side *****************")
      const encodedLogs = rProof.encodeLogs(depositReceipt.logs);//logs to buffer
      console.log("\n* [ client ] logs --> buffers array* \n",encodedLogs)
      

      /*
      const encodedReceiptTest = rlp.encode([depositReceipt.status, depositReceipt.cumulativeGasUsed,
        depositReceipt.logsBloom, encodedLogs]);
      const encodedReceiptValue = rlp.encode(receiptProof.value);

      assert(encodedReceiptTest.equals(encodedReceiptValue) == true);
      */


      let addrs = [0,encodedLogs[0][0]];
      let topics = [0,encodedLogs[0][1]];
      let data = [0,encodedLogs[0][2]];
      
      console.log("\n* [ client ] buffers array --> buffers object *\n")
      console.log({addrs},{topics},{data})
      
      let logsCat = `0x${addrs[1].toString('hex')}${topics[1][0].toString('hex')}`
      logsCat += `${topics[1][1].toString('hex')}${topics[1][2].toString('hex')}`
      logsCat += `${topics[1][3].toString('hex')}${data[1].toString('hex')}`;
      console.log("\n* [ client ] buffers --> string; concate string; *\n")
      console.log({logsCat})
      console.log("\n* [ client >> ] logsCat *\n")
      console.log("\n*************** let's encode logs on evm *****************")
      const proveReceipt = await BridgeA.proveReceipt(
        logsCat,
        depositReceipt.cumulativeGasUsed,
        depositReceipt.logsBloom,
        depositBlock.receiptsRoot,
        path,
        parentNodes,
        { /*from: wallets[2][0], */gas: 500000 }
      )
      
      console.log("!!!!!!!!!!!! node");
      console.log("\n\nvalue in client proof: ( that is, parentNodes[-1] of proof )",receiptProof.parentNodes[0][1].toString('hex'))
      console.log("\n\n\n")
      console.log(depositBlock)
      assert(1==3)
      console.log('proveReceipt gas usage:', proveReceipt.receipt.gasUsed);
  });

})