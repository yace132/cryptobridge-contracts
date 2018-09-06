var Migrations = artifacts.require("./Migrations.sol");

module.exports = function(deployer) {
  console.log("migrate contract")
  //deployer.deploy(Migrations,{gas:300000});
};
