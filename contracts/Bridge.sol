pragma solidity ^0.4.18;

import "./MerklePatriciaProof.sol";
//import './RLPEncode.sol';
//import "./BytesLib.sol";
//import "tokens/contracts/eip20/EIP20.sol";
contract Bridge {
    function merkleWithdraw(
        bytes32[3] b32p, // r=0, s=1, txRoot=2    
        bytes path,
        bytes parentNodes, 
        bytes rlpDepositTx
        )
        public
        returns (bool) 
        {

        // Make sure this transaction is the value on the path via a MerklePatricia proof
            return MerklePatriciaProof.verify(rlpDepositTx, path, parentNodes, b32p[2]) ;

    }
    function() public payable {}
}