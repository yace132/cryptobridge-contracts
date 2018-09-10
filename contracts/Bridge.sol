pragma solidity ^0.4.18;

import "./MerklePatriciaProof.sol";
import './RLPEncode.sol';
import "./BytesLib.sol";
//import "tokens/contracts/eip20/EIP20.sol";
contract Bridge {

	function deposit(address token, address toChain, uint256 amount) public {
    	//EIP20 t = EIP20(token);
		//t.transferFrom(msg.sender, address(this), amount);
    	Deposit(msg.sender, toChain, token, address(this), amount);
	}

    
    function verifyTxPatriciaProof(
        bytes32[3] b32p, // r=0, s=1, txRoot=2    
        bytes path,
        bytes parentNodes, 
        bytes rlpDepositTx
        )
        public
        returns (bool) 
        {

        // Make sure this transaction is the value on the path via a MerklePatricia proof
            assert (MerklePatriciaProof.verify(rlpDepositTx, path, parentNodes, b32p[2])==true) ;

    }
    
/*
    function proveReceipt(
    	bytes logs, 
    	bytes cumulativeGas, 
    	bytes logsBloom,
    	bytes32 receiptsRoot, 
    	bytes path, 
    	bytes parentNodes
    )
    public
    {
    	//Eason: There are 2 events in deposit tx
    	//log0 is Transfer event in EIP20
    	//https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
	    //event Transfer(address indexed _from, address indexed _to, uint256 _value)
	    //omitted
	    
	    //log1 is deposit event in bridge
    	//https://github.com/GridPlus/cryptobridge-contracts/blob/master/contracts/Bridge.sol
	    // event Deposit(address indexed user, address indexed toChain,
		// address indexed depositToken, address fromChain, uint256 amount); 
	    bytes[] memory log1 = new bytes[](3);
	    bytes[] memory topics1 = new bytes[](4);
	    log1[0] = BytesLib.slice(logs, 0, 20);
	    topics1[0] = BytesLib.slice(logs, 20, 32);
	    topics1[1] = BytesLib.slice(logs, 52, 32);
	    topics1[2] = BytesLib.slice(logs, 84, 32);
	    topics1[3] = BytesLib.slice(logs, 116, 32);
	    log1[1] = RLPEncode.encodeList(topics1);
	    log1[2] = BytesLib.slice(logs, 148, 64); // this is two 32 byte words
	    
	    EncodeLog(log1[0],log1[1],log1[2]);
	    // We need to hack around the RLPEncode library for the topics, which are
	    // nested lists
	    // Eason: encodeListWithPasses(some item, some item, ..., rlp.encode(list), ... some item, passses)
	    // passes = [ false for item, true for rlp list, ...]
	    bool[] memory passes = new bool[](4);
	    passes[0] = false;
	    passes[1] = true;
	    passes[2] = false;
	    bytes[] memory allLogs = new bytes[](1);
	    //allLogs[0] = RLPEncode.encodeListWithPasses(log0, passes);
	    allLogs[0] = RLPEncode.encodeListWithPasses(log1, passes);
	    
		
		
	    // Finally, we can encode the receipt
	    bytes[] memory receipt = new bytes[](4);
	    receipt[0] = hex"01";
	    receipt[1] = cumulativeGas;
	    receipt[2] = logsBloom;
	    passes[0] = true;
	    receipt[3] = RLPEncode.encodeListWithPasses(allLogs, passes);
	   	passes[0] = false;
	    passes[1] = false;
	    passes[3] = true;
		EncodeReceipt(receipt[0],receipt[1],receipt[2],receipt[3]);
	    // Eason: verify the contents of log

	    // Check that the sender made this transaction
	    //assert(BytesLib.toAddress(topics0[1], 12) == msg.sender);
	    assert(BytesLib.toAddress(topics1[1], 12) == msg.sender);

	    // Check the amount
	    //assert(BytesLib.toUint(log0[2], 0) == pendingWithdrawals[msg.sender].amount);
	    //assert(BytesLib.toUint(log1[2], 32) == pendingWithdrawals[msg.sender].amount);

	    // Check that this is the right destination
	    assert(BytesLib.toAddress(topics1[2], 12) == address(this));

	    // Check that it's coming from the right place
	    //assert(BytesLib.toAddress(log1[0], 0) == pendingWithdrawals[msg.sender].fromChain);

	    // Check the token
	    //assert(tokens[pendingWithdrawals[msg.sender].fromChain][BytesLib.toAddress(log0[0], 0)] == pendingWithdrawals[msg.sender].withdrawToken);

	    // TODO: There may be more checks for other parts of the logs, but this covers
	    // the basic stuff
		
		
    allLogs[0] =RLPEncode.encodeListWithPasses(receipt, passes);
    ValueToEvm(allLogs[0]);
    
    bytes32 _root;
    bytes32 _nodeHash;
    bytes memory _node;
    (_root,_nodeHash,_node)=MerklePatriciaProof.verify(RLPEncode.encodeListWithPasses(receipt, passes),
      path, parentNodes, receiptsRoot);
    EvmReceiveRootAndValue(_root,_nodeHash,_node);
    //assert(MerklePatriciaProof.verify(RLPEncode.encodeListWithPasses(receipt, passes),
    //  path, parentNodes, receiptsRoot) == true);
   
	}

*/

    function() public payable {}
    event Deposit(address indexed user, address indexed toChain, address indexed depositToken, address fromChain, uint256 amount);
    event EncodeLog(bytes addrs,bytes topics,bytes data);
    event EncodeReceipt(bytes _hex,bytes gas ,bytes bloom ,bytes log);
    event ValueToEvm(bytes value);
    event EvmReceiveRootAndValue(bytes32 root,bytes32 nodeHash, bytes node);
}