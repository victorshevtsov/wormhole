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
        await tokenBridge.methods.registerChain("0x010000000001000911ad79533590627158f07e58051ae6f0d93c2e3b9d67e4806a019d0c7ea098483f2b4a4c181f15e637de3848896a538b0037ec4325d673565693190843cc56000000000100000001000100000000000000000000000000000000000000000000000000000000000000040000000005bbfb4000000000000000000000000000000000000000000000546f6b656e427269646765010000000965615c9ab89a167582ec9ae2da9f54be9b5f28ab44e0b1533c06066e93940b7b").send({
            value: 0,
            from: accounts[0],
            gasLimit: 2000000
        });

        // Register the Safecoin NFT bridge endpoint
        await nftBridge.methods.registerChain("0x0100000000010002d17f258ec28909e51642490bc9246e7ce6e746dd3c03911f9ad8ae69fb49fb2850d013f06135cd80e016651538ca6e2be62f0435ea6e12dd7e13ead63efb1a0000000001000000010001000000000000000000000000000000000000000000000000000000000000000400000000007c4ad70000000000000000000000000000000000000000000000004e465442726964676501000000098989a0561640004678124d0519a3836d1aac68476ba1a5c83215a53c95ad8427").send({
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