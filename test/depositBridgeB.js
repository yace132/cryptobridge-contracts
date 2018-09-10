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
let BridgeAat='0x345ca3e014aaf5dca488057592ee47305d9b3e10'

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
    BridgeB = await Bridge.new();
    console.log({BridgeBat:BridgeB.address})
  });

 
  it('deposit at bridgeB',async()=>{
    const _deposit = await BridgeB.deposit(JOY, BridgeAat, 777777)
    let r = _deposit.receipt
    deposit = await web3.eth.getTransactionPromise(r.transactionHash);
    console.log({deposit})
  })

})