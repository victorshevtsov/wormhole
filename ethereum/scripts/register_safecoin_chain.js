// run this script with truffle exec

const jsonfile = require("jsonfile");
const TokenBridge = artifacts.require("TokenBridge");
const NFTBridge = artifacts.require("NFTBridgeEntrypoint");
const TokenImplementation = artifacts.require("TokenImplementation");
const BridgeImplementationFullABI = jsonfile.readFileSync("../build/contracts/BridgeImplementation.json").abi

module.exports = async function (callback) {
    try {
        const accounts = await web3.eth.getAccounts();
        const tokenBridge = new web3.eth.Contract(BridgeImplementationFullABI, TokenBridge.address);
        const nftBridge = new web3.eth.Contract(BridgeImplementationFullABI, NFTBridge.address);

        // Register the Safecoin token bridge endpoint
        await tokenBridge.methods.registerChain("0x01000000000100fe9a2b1a14d22f7129b3b4af5d012de4d5dffd9e5acf044465cd39b18d7b1dbf3ea83fc2014f2439e2e585aae7798ca023961d09976c261fc1db6cbf1b0d7811000000000100000001000100000000000000000000000000000000000000000000000000000000000000040000000002c7db9500000000000000000000000000000000000000000000546f6b656e427269646765010000000665615c9ab89a167582ec9ae2da9f54be9b5f28ab44e0b1533c06066e93940b7b").send({
            value: 0,
            from: accounts[0],
            gasLimit: 2000000
        });

        await nftBridge.methods.registerChain("0x01000000000100a6d4d4e4b7890a22a982d992388d675f56b7c6425afd32a0a13c1e31377a953964d5c45e7e73abe7b3fa38e3fc7e176e4dbb3d36a11a5c1b0546f06e5fb055730100000001000000010001000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000004e465442726964676501000000068989a0561640004678124d0519a3836d1aac68476ba1a5c83215a53c95ad8427").send({
            value: 0,
            from: accounts[0],
            gasLimit: 2000000
        });

        callback();
    }
    catch (e) {
        callback(e);
    }
}