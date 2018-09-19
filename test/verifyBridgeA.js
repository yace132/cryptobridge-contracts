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
require('buffer').Buffer

const transactionProof = 
{ transactionsRoot:
   [ '0xe58bea8d560d19add278816f7224cb9b2f41cf7ae4810847f859667331c47c66',
     '0x316e16099e7119a3ca03706b74d94267d5931021665733864d626cf64f15c571',
     '0x44d158d26dcf4c4788ade23e6beede61c5132d29add673cb3d47f1dc86b7a365' ],
  path: '0x8180',
  parentNodes: '0xf90164f891a0452cb2fb2642df062a5a26cc1249206cba079af0d7ae996a2f9cecf0b50fba25a0e7913816fb21b39cf7e4cec67e410cf0dccdc91ed6191fadcc790155b09eb4c8a048adb0e042dafcc73183d5763dfb98a510f899d1bbcab35241a08ab346e8c5a48080808080a0d8e5df4e14c704f6373dc51d3cb47c19d2163edba962c87a22839537b96e7de98080808080808080f8cf30b8ccf8ca4885174876e800836691b794af64d428352a8fce537da7efb4e942212952b83d80b8648340f549000000000000000000000000dde12a12a6f67156e0da672be05c374e1b0a3e57000000000000000000000000345ca3e014aaf5dca488057592ee47305d9b3e1000000000000000000000000000000000000000000000000000000000000bde311ca0e58bea8d560d19add278816f7224cb9b2f41cf7ae4810847f859667331c47c66a0316e16099e7119a3ca03706b74d94267d5931021665733864d626cf64f15c571',
  rlpDepositTxData: "0xf8ca4885174876e800836691b794af64d428352a8fce537da7efb4e942212952b83d80b8648340f549000000000000000000000000dde12a12a6f67156e0da672be05c374e1b0a3e57000000000000000000000000345ca3e014aaf5dca488057592ee47305d9b3e1000000000000000000000000000000000000000000000000000000000000bde311ca0e58bea8d560d19add278816f7224cb9b2f41cf7ae4810847f859667331c47c66a0316e16099e7119a3ca03706b74d94267d5931021665733864d626cf64f15c571"
}
const proof = 
{ logsCat: '0xaf64d428352a8fce537da7efb4e942212952b83da856e8f098813135735b4d4f52d96083d1dbb35fd5603ff424661413f59c281000000000000000000000000007c7d469878c23c8414d7bd747476555cd3ccc8a000000000000000000000000345ca3e014aaf5dca488057592ee47305d9b3e10000000000000000000000000dde12a12a6f67156e0da672be05c374e1b0a3e57000000000000000000000000af64d428352a8fce537da7efb4e942212952b83d00000000000000000000000000000000000000000000000000000000000bde31',
  cumulativeGasUsed: 27199,
  logsBloom: '0x00000000000000000000100000001000000000000000100000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000100000000000000000000000080000000000000000000000000000000200000000000000020000000020000000008000000000000000000000080000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000',
  receiptsRoot: '0x1ecdd13c1e7e7c67269931c028ce37716d121458e46d9d643c6df7537e12a9eb',
  path: '0x8180',
  parentNodes: '0xf90285f891a08ea988171e83cdccc86dd4bc94b3c9272adefff7931a93b10b9e992103a05bbea04ff965b0bb00c3bccb10f0208738a81773dc7996ed62c3195d93f0a30fa41b24a07bde4f009a8d5789e8bb1aa6c57386e5137b872b175d67fbb9684b29a2b3223e8080808080a01212c88896be473b51bcfa0f9536040a9ffae6ce1a1bc70925b30995a8b192288080808080808080f901ef30b901ebf901e801826a3fb9010000000000000000000000100000001000000000000000100000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000100000000000000000000000080000000000000000000000000000000200000000000000020000000020000000008000000000000000000000080000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000f8dff8dd94af64d428352a8fce537da7efb4e942212952b83df884a0a856e8f098813135735b4d4f52d96083d1dbb35fd5603ff424661413f59c2810a000000000000000000000000007c7d469878c23c8414d7bd747476555cd3ccc8aa0000000000000000000000000345ca3e014aaf5dca488057592ee47305d9b3e10a0000000000000000000000000dde12a12a6f67156e0da672be05c374e1b0a3e57b840000000000000000000000000af64d428352a8fce537da7efb4e942212952b83d00000000000000000000000000000000000000000000000000000000000bde31' }

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
    console.log({BridgeAat:BridgeA.address})
  });

  it('verify tx proof on chain', async () => {
    let rlpDepositTxData = transactionProof.rlpDepositTxData
    rlpDepositTxData = Buffer.from(rlpDepositTxData)
    // Make the transaction
    const verifyTxPatriciaProof = await BridgeA.verifyTxPatriciaProof(
      //Eason : signature
      //deposit.v, 
      transactionProof.transactionsRoot,
      
      //Eason: cross chain tx ( B --> A )
      //[BridgeB.address, tokenB.address, tokenA.address], 
      
      //Eason: balance
      //5,
      
      //Eason: merkle proof
      transactionProof.path, 
      transactionProof.parentNodes, 
      //version,
      //LAZ: passing as 'hex' results in ascii beeing received in contract
      //Eason: tx on each chain
      rlpDepositTxData.toString("binary"),
      //rlpWithdrawTxData.toString('binary'),
      { /*from: wallets[2][0]*/ gas: 500000 }
    );

    console.log('verifyTxPatriciaProof gas usage:', verifyTxPatriciaProof.receipt.gasUsed);
    assert(verifyTxPatriciaProof.receipt.gasUsed < 500000);
  })



  /****************************************************************************/
  
    
  it('Should verify the state root', async () => {
      let {logsCat,cumulativeGasUsed,logsBloom,receiptsRoot,path,parentNodes} = proof
      console.log("\n*************** let's encode logs on evm *****************")
      console.log({logsCat,cumulativeGasUsed})
      const proveReceipt = await BridgeA.proveReceipt(
        logsCat,
        cumulativeGasUsed,
        logsBloom,
        receiptsRoot,
        path,
        parentNodes,
        { gas: 500000 }
      )
      
      console.log("!!!!!!!!!!!! node");
      //console.log("\n\nvalue in client proof: ( that is, parentNodes[-1] of proof )",parentNodes[0][1].toString('hex'))
      console.log("\n\n\n")
      //console.log(depositBlock)
      //assert(1==3)
      console.log('proveReceipt gas usage:', proveReceipt.receipt.gasUsed);
  });

})