// Merkle-Patricia proof for a transaction receipt.
// Modified from eth-proof
const Promise = require('bluebird').Promise;
const Trie = require('merkle-patricia-tree');
const rlp = require('rlp');
const async = require('async');
const EthereumBlock = require('ethereumjs-block/from-rpc');

exports.buildProof = buildProof;
exports.encodeLogs = encodeLogs;
var receiptsTrie = new Trie();
function buildProof(receipt, block, web3) {
  return new Promise((resolve, reject) => {

    //var receiptsTrie = new Trie();
    Promise.map(block.transactions, (siblingTxHash) => {
      return web3.eth.getTransactionReceiptPromise(siblingTxHash)
    })
    .map( (siblingReceipt) => {
      console.log("go to map 2")  
      console.log("go to put receipt")
      console.log("input",receiptsTrie._root)
      var path = siblingReceipt.transactionIndex

      var cummulativeGas = numToBuf(siblingReceipt.cumulativeGasUsed)
      var bloomFilter = strToBuf(siblingReceipt.logsBloom)
      var setOfLogs = encodeLogs(siblingReceipt.logs)
      var rawReceipt;
      if (siblingReceipt.status !== undefined && siblingReceipt.status != null) {
        var status = strToBuf(siblingReceipt.status);
        //console.log("the status?",status)
        rawReceipt = rlp.encode([status, cummulativeGas, bloomFilter, setOfLogs]);
      } else {
        var postTransactionState = strToBuf(siblingReceipt.root)
        //console.log("the root?",postTransactionState)
        rawReceipt = rlp.encode([postTransactionState, cummulativeGas, bloomFilter, setOfLogs])
      }
        //console.log("receipt path of same block",rlp.encode(path))
        //console.log("receipt of same block",rawReceipt)
        //console.log(cummulativeGas,bloomFilter,setOfLogs,rawReceipt)
        console.log("put input",receiptsTrie._root)
        receiptsTrie.put(rlp.encode(path), rawReceipt, function (error) {
          console.log("go to put")
        
          console.log("put", rawReceipt,"at",rlp.encode(path))
          console.log("exit",receiptsTrie._root)
          //error != null ? cb2(error, null) : cb2(error, true)
          return new Promise((resolve,reject) => {
            if(error != null)reject(error);
            else resolve(1);  
          });
        })
        
      })
    .then((results) => {
      console.log("go to then")
      //console.log("----->\n",receiptsTrie.sem.queue)
      //console.log("----->\n",receiptsTrie.sem.queue[0].task)
      //console.log("----->\n",receiptsTrie.sem.queue[1].task)
      receiptsTrie.findPath(rlp.encode(receipt.transactionIndex), (e,rawReceiptNode,remainder,stack) => {
        console.log("find path fall back")
        var prf = {
          blockHash: Buffer.from(receipt.blockHash.slice(2),'hex'),
          header:    getRawHeader(block),
          parentNodes:     rawStack(stack),
          path:      rlp.encode(receipt.transactionIndex),
          value:     rlp.decode(rawReceiptNode.value)
        }
        return resolve(prf)
      })
    })
    .catch((err) => { return reject(err); });
  })
}
/*
var putReceipt =  (siblingReceipt,  cb2) => {//need siblings to rebuild trie
  console.log("go to put receipt")
  console.log("input",receiptsTrie._root)
  var path = siblingReceipt.transactionIndex

  var cummulativeGas = numToBuf(siblingReceipt.cumulativeGasUsed)
  var bloomFilter = strToBuf(siblingReceipt.logsBloom)
  var setOfLogs = encodeLogs(siblingReceipt.logs)
  var rawReceipt;
  if (siblingReceipt.status !== undefined && siblingReceipt.status != null) {
    var status = strToBuf(siblingReceipt.status);
    //console.log("the status?",status)
    rawReceipt = rlp.encode([status, cummulativeGas, bloomFilter, setOfLogs]);
  } else {
    var postTransactionState = strToBuf(siblingReceipt.root)
    //console.log("the root?",postTransactionState)
    rawReceipt = rlp.encode([postTransactionState, cummulativeGas, bloomFilter, setOfLogs])
  }
  //console.log("receipt path of same block",rlp.encode(path))
  //console.log("receipt of same block",rawReceipt)
  //console.log(cummulativeGas,bloomFilter,setOfLogs,rawReceipt)
  console.log("put input",receiptsTrie._root)
  receiptsTrie.put(rlp.encode(path), rawReceipt, function (error) {
    console.log("go to put")
    
    console.log("put", rawReceipt,"at",rlp.encode(path))
    console.log("exit",receiptsTrie._root)
    error != null ? cb2(error, null) : cb2(error, true)
  })
}
*/
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
