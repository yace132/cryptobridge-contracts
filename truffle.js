var HDWalletProvider = require("truffle-hdwallet-provider");
module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  // See https://truffleframework.com/tutorials/using-infura-custom-provider
  //https://ethereum.stackexchange.com/questions/35776/web3providerengine-does-not-support-synchronous-requests-while-running-migrati
  networks: {
    rps: {
      provider: function() {
        return new HDWalletProvider("hello bridge", "https://ropsten.infura.io/");
      },
      network_id: '3',
    },
    
    testRPC: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 100000000
    },
  }
};
