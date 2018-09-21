const Trie = require('merkle-patricia-tree');
const rlp = require('rlp');
const EthereumTx = require('ethereumjs-tx');
const EthereumBlock = require('ethereumjs-block/from-rpc')
const async = require('async');
const sha3 = require('js-sha3').keccak256;

exports.build = build;
exports.verify = verify;

function build(tx, block) { // Eason : prove tx is at block
  return new Promise((resolve, reject) => {
    let txTrie = new Trie();// Eason : 1. Construct merkle tree for block
    async.map(block.transactions, (siblingTx, cb) => {//tx --> cb(tx)
      let path = rlp.encode(siblingTx.transactionIndex);
      /**
       * Eason: match format of ethereumjs-tx
       * https://github.com/ethereumjs/ethereumjs-tx
       */
      const signedSiblingTx = new EthereumTx(squanchTx(siblingTx));
      const rawSignedSiblingTx = signedSiblingTx.serialize();//rlp encode tx
      txTrie.put(path, rawSignedSiblingTx, (err) => {
        if (err) { cb(err, null); }
        cb(null, true);
      })
    }, (err, r) => {
      if (err) { return reject(err); }
      txTrie.findPath(rlp.encode(tx.transactionIndex), (err, rawTxNode, reminder, stack) => {
      /**
       * Eason: 2. find merkle path by tx index
       * return raw tx and stack ( nodes on path )
       * May find the node without all key. Then there is some key remider
       * ref to : https://raw.githubusercontent.com/ethereumjs/merkle-patricia-tree/master/dist/trie.js  
       */
        const prf = {
          blockHash: Buffer.from(tx.blockHash.slice(2), 'hex'),
          header: getRawHeader(block),// block header 
          parentNodes: rawStack(stack),
          path: rlp.encode(tx.transactionIndex),
          value: rlp.decode(rawTxNode.value)// tx data
        }
        
        return resolve({prf,txTrie})
      })
    })
 })
}

// From eth-proof (VerifyProof.trieValue)
// Checks that the path of the tx (value) is correct
// `value` is rlp decoded
// `i` is the index of the root in the header: 4 = tx, 5 = receipt
// Eason : verify tx merkle proof, j means i
function verify(proof, j) {
  const path  = proof.path.toString('hex');
  const value = proof.value;
  const parentNodes = proof.parentNodes;
  const header = proof.header;
  const blockHash = proof.blockHash;
  const txRoot = header[j]; // txRoot is the 4th item in the header Array
  try{
    var currentNode;
    var len = parentNodes.length;
    var rlpTxFromPrf = parentNodes[len - 1][parentNodes[len - 1].length - 1];
    var nodeKey = txRoot;
    var pathPtr = 0;
    for (var i = 0 ; i < len ; i++) {
      //console.log("verify",{nodeKey})
      currentNode = parentNodes[i];
      const encodedNode = Buffer.from(sha3(rlp.encode(currentNode)),'hex');
      if(!nodeKey.equals(encodedNode)){
        return false;
      }
      if(pathPtr > path.length){
        return false
      }
      switch(currentNode.length){
        case 17:// branch node
          if(pathPtr == path.length){
            if(currentNode[16] == rlp.encode(value)){
              return true;
            }else{
              return false
            }
          }
          nodeKey = currentNode[parseInt(path[pathPtr],16)] //must == sha3(rlp.encode(currentNode[path[pathptr]]))
          pathPtr += 1
          break;
        case 2:
          pathPtr += nibblesToTraverse(currentNode[0].toString('hex'), path, pathPtr)
          if(pathPtr == path.length){// leaf node
            if(currentNode[1].equals(rlp.encode(value))){
              return true
            }else{
              return false
            }
          }else{// extension node
            nodeKey = currentNode[1]
          }
          break;
        default:
          console.log("all nodes must be length 17 or 2");
          return false
      }
    }
  }catch(e){ console.log(e); return false }
  return false
}

var nibblesToTraverse = (encodedPartialPath, path, pathPtr) => {
  if(encodedPartialPath[0] == 0 || encodedPartialPath[0] == 2){
    var partialPath = encodedPartialPath.slice(2)
  }else{
    var partialPath = encodedPartialPath.slice(1)
  }

  if(partialPath == path.slice(pathPtr, pathPtr + partialPath.length)){
    return partialPath.length
  }else{
    throw new Error("path was wrong")
  }
}

var getRawHeader = (_block) => {
  if(typeof _block.difficulty != 'string'){
    _block.difficulty = '0x' + _block.difficulty.toString(16)
  }
  var block = new EthereumBlock(_block)
  return block.header.raw
}

var squanchTx = (tx) => {
  tx.gas = '0x' + parseInt(tx.gas).toString(16);
  tx.gasPrice = '0x' + parseInt(tx.gasPrice).toString(16);
  tx.value = '0x' + parseInt(tx.value).toString(16) || '0';
  tx.data = tx.input;
  return tx;
}

var rawStack = (input) => {
  output = []
  for (var i = 0; i < input.length; i++) {
    output.push(input[i].raw)
  }
  return output
}
