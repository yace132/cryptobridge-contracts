// Merkle-Patricia proof for a transaction receipt.
// Modified from eth-proof
const Promise = require('bluebird').Promise;
const Trie = require('merkle-patricia-tree');
const rlp = require('rlp');
const async = require('async');
const EthereumBlock = require('ethereumjs-block/from-rpc');
if (typeof Trie.putPromise === 'undefined') {
  Promise.promisifyAll(Trie, { suffix: 'Promise' });
}

exports.buildProof = buildProof;
exports.encodeLogs = encodeLogs;
var receiptsTrie = new Trie();
function buildProof(receipt, block, web3) {
  return new Promise((resolve, reject) => {
    // console.log("In receipt proof ...")
    Promise.map(block.transactions, (siblingTxHash) => {
      return web3.eth.getTransactionReceiptPromise(siblingTxHash)
    })
    .map( (siblingReceipt) => {
      var path = siblingReceipt.transactionIndex

      var cummulativeGas = numToBuf(siblingReceipt.cumulativeGasUsed)
      var bloomFilter = strToBuf(siblingReceipt.logsBloom)
      var setOfLogs = encodeLogs(siblingReceipt.logs)
      var rawReceipt;
      if (siblingReceipt.status !== undefined && siblingReceipt.status != null) {
        var status = statusToBuf(siblingReceipt.status);
       
        rawReceipt = rlp.encode([status, cummulativeGas, bloomFilter, setOfLogs]);
      } else {
        var postTransactionState = strToBuf(siblingReceipt.root)
        rawReceipt = rlp.encode([postTransactionState, cummulativeGas, bloomFilter, setOfLogs])
      }
        /**
         * show put process
         * console.log("let's put rlp receipt",rawReceipt)
         * console.log("at",rlp.encode(path))
         * console.log("*****     p.s. raw receipt     *********\n",{status:siblingReceipt.status,cummulativeGas:siblingReceipt.cumulativeGasUsed,bloomFilter:siblingReceipt.logsBloom,setOfLogs:siblingReceipt.logs},"\n\n")
         * console.log("*****     receipt buffers      *********\n",{status,cummulativeGas,bloomFilter,setOfLogs},"\n\n ----------------------------------------------------------------- \n")
         */
        return receiptsTrie.putPromise(rlp.encode(path), rawReceipt)
      })
    .then((results) => {
      // console.log("go to then")
      let j = receipt.transactionIndex;
      // console.log("generate",j,"th receipt proof")
      receiptsTrie.findPath(rlp.encode(j), (e,rawReceiptNode,remainder,stack) => {
      // console.log("find path fall back")
        var prf = {
          blockHash: Buffer.from(receipt.blockHash.slice(2),'hex'),
          header:    getRawHeader(block),
          parentNodes:     rawStack(stack),
          path:      rlp.encode(j),
          value:     rlp.decode(rawReceiptNode.value)
        }
        // console.log("Receipt proof completes ")
        return resolve(prf)
      })
    })
    .catch((err) => { return reject(err); });
  })
}

function encodeLogs(input) {
  var logs = []
  for (var i = 0; i < input.length; i++) {
    var address = strToBuf(input[i].address);
    var topics = input[i].topics.map(strToBuf)
    var data = Buffer.from(input[i].data.slice(2),'hex')
    logs.push([address, topics, data])
  }
  return logs
}
var rawStack = (input) => {
  output = []
  for (var i = 0; i < input.length; i++) {
    output.push(input[i].raw)
  }
  return output
}
var getRawHeader = (_block) => {
  if(typeof _block.difficulty != 'string'){
    _block.difficulty = '0x' + _block.difficulty.toString(16)
  }
  var block = new EthereumBlock(_block)
  return block.header.raw
}
var squanchTx = (tx) => {
  tx.gasPrice = '0x' + tx.gasPrice.toString(16)
  tx.value = '0x' + tx.value.toString(16)
  return tx;
}
var numToBuf = (input)=>{ return Buffer.from(byteable(input.toString(16)), "hex") }
var byteable = (input)=>{ return input.length % 2 == 0 ? input : "0" + input }
var strToBuf = (input)=>{
  if(input.slice(0,2) == "0x"){
    return Buffer.from(byteable(input.slice(2)), "hex")
  }else{
    return Buffer.from(byteable(input), "hex")
  }
}

var statusToBuf = (input)=>{
  return input == "0x0"?0:1
}
