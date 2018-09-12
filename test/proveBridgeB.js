const txProof = require('./util/txProof.js')
const rProof = require('./util/receiptProof.js');
const rlp = require('rlp')
const Bridge = artifacts.require('./Bridge.sol')
const sha3 = require('js-sha3').keccak256;
const JOY = "0xdde12a12a6f67156e0da672be05c374e1b0a3e57"
const Web3 = require('web3');
const Promise = require('bluebird');
if (typeof web3.eth.getAccountsPromise === 'undefined') {
  Promise.promisifyAll(web3.eth, { suffix: 'Promise' });
}


// Global variables (will be references throughout the tests)
let BridgeA;
let BridgeB;
let BridgeBat = "0xAf64D428352a8fcE537dA7EfB4e942212952B83D";


let deposit;
let depositBlock;
let depositBlockSlim;


// Eason: Variables for merkle proof
let path;
let parentNodes;
let rlpDepositTxData;
let rlpWithdrawTxData;
let txhash = '0x0747356961201071c383490cfc315d95a6e805b8c0095a20aacbdb80c820ca19'

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
    
  it('deposit at bridgeB',async()=>{
    deposit = await web3.eth.getTransactionPromise(txhash);
    console.log({deposit})

    assert (deposit !=null)
    console.log("\ndeposit index (path):\n",rlp.encode(deposit.transactionIndex))   
    console.log("\n******************************************\n")
    depositBlock = await web3.eth.getBlockPromise(deposit.blockHash, true);
    depositBlockSlim = await web3.eth.getBlockPromise(deposit.blockHash, false);
    console.log({depositBlock})
    console.log("\n******************************************\n")
    depositReceipt = await web3.eth.getTransactionReceiptPromise(txhash);
    console.log({depositReceipt})
    console.log(depositReceipt.logs)
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
      BridgeBat,
      '', 
      deposit.input, 
      version, 
      "", 
      ""
    ]);
	console.log(rlpDepositTxData)
	rlpDepositTxData=rlpDepositTxData.toString('hex')

    let outputProof = {
    	transactionsRoot:[deposit.r, deposit.s, depositBlock.transactionsRoot],
     	path, 
      	parentNodes, 
      	rlpDepositTxData
    }
	console.log(rlpDepositTxData)
  })

//<<<<<<< HEAD:test/bridge.js
/****************************************************************************/

//=======
//>>>>>>> proveBridgeB:test/proveBridgeB.js


  /****************************************************************************/
  
    
  it('Should prove the state root', async () => {
      // Get the receipt proof
      const receiptProof = await rProof.buildProof(depositReceipt, depositBlockSlim, web3);
      //console.log({path:receiptProof.path})
      //console.log({parents: receiptProof.parentNodes})
      //console.log("\n**********")
      const path = ensureByte(rlp.encode(receiptProof.path).toString('hex'));
      parentNodes = ensureByte(rlp.encode(receiptProof.parentNodes).toString('hex'));
      const checkpoint2 = txProof.verify(receiptProof, 5);
      
      //console.log("[ evm >> ] logs \n",depositReceipt.logs)
      console.log("\n************** let's encode logs on client side *****************")
      const encodedLogs = rProof.encodeLogs(depositReceipt.logs);//logs to buffer
      //console.log("\n* [ client ] logs --> buffers array* \n",encodedLogs)
      

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
      //console.log({addrs},{topics},{data})
      
      let logsCat = `0x${addrs[1].toString('hex')}${topics[1][0].toString('hex')}`
      logsCat += `${topics[1][1].toString('hex')}${topics[1][2].toString('hex')}`
      logsCat += `${topics[1][3].toString('hex')}${data[1].toString('hex')}`;
      console.log("\n* [ client ] buffers --> string; concate string; *\n")
      //console.log({logsCat})
      console.log("\n* [ client >> ] proof *\n")

      let proof = {
        logsCat,
        cumulativeGasUsed:depositReceipt.cumulativeGasUsed,
        logsBloom:depositReceipt.logsBloom,
        receiptsRoot:depositBlock.receiptsRoot,
        path,
        parentNodes
      }
      //console.log(proof)
  });
})