pragma solidity ^0.4.18;

import "./MerklePatriciaProof.sol";
//import './RLPEncode.sol';
//import "./BytesLib.sol";
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
            return MerklePatriciaProof.verify(rlpDepositTx, path, parentNodes, b32p[2]) ;

    }

    /*function proveReceipt(
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
	    log1[0] = BytesLib.slice(logs, 148, 20);
	    topics1[0] = BytesLib.slice(logs, 168, 32);
	    topics1[1] = BytesLib.slice(logs, 200, 32);
	    topics1[2] = BytesLib.slice(logs, 232, 32);
	    topics1[3] = BytesLib.slice(logs, 264, 32);
	    log1[1] = RLPEncode.encodeList(topics1);
	    log1[2] = BytesLib.slice(logs, 296, 64); // this is two 32 byte words

	    // We need to hack around the RLPEncode library for the topics, which are
	    // nested lists
	    bool[] memory passes = new bool[](4);
	    passes[0] = false;
	    passes[1] = true;
	    passes[2] = false;
	    bytes[] memory allLogs = new bytes[](2);
	    allLogs[0] = RLPEncode.encodeListWithPasses(log0, passes);
	    allLogs[1] = RLPEncode.encodeListWithPasses(log1, passes);
	    passes[0] = true;

	    // Finally, we can encode the receipt
	    bytes[] memory receipt = new bytes[](4);
	    receipt[0] = hex"01";
	    receipt[1] = cumulativeGas;
	    receipt[2] = logsBloom;
	    receipt[3] = RLPEncode.encodeListWithPasses(allLogs, passes);
	    passes[0] = false;
	    passes[1] = false;
	    passes[3] = true;

	    /* Eason: verify the contents of log

	    // Check that the sender made this transaction
	    assert(BytesLib.toAddress(topics0[1], 12) == msg.sender);
	    assert(BytesLib.toAddress(topics1[1], 12) == msg.sender);

	    // Check the amount
	    assert(BytesLib.toUint(log0[2], 0) == pendingWithdrawals[msg.sender].amount);
	    assert(BytesLib.toUint(log1[2], 32) == pendingWithdrawals[msg.sender].amount);

	    // Check that this is the right destination
	    assert(BytesLib.toAddress(topics1[2], 12) == address(this));

	    // Check that it's coming from the right place
	    assert(BytesLib.toAddress(log1[0], 0) == pendingWithdrawals[msg.sender].fromChain);

	    // Check the token
	    assert(tokens[pendingWithdrawals[msg.sender].fromChain][BytesLib.toAddress(log0[0], 0)] == pendingWithdrawals[msg.sender].withdrawToken);

	    // TODO: There may be more checks for other parts of the logs, but this covers
	    // the basic stuff
		
		*/
    /*
    assert(MerklePatriciaProof.verify(RLPEncode.encodeListWithPasses(receipt, passes),
      path, parentNodes, receiptsRoot) == true);
    
}

*/

    function() public payable {}
    event Deposit(address indexed user, address indexed toChain, address indexed depositToken, address fromChain, uint256 amount);
}