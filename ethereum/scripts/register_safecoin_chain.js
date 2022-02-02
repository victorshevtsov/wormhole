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
        await tokenBridge.methods.registerChain("0x0100000000010008cdbde68a423b088908a00c6c5c0f5dc8cacea9d445e52b09d4b4d843064bb143f221339f9a6b0fd46f4f3aa7480b92483c94ab08f32893012168cf88f805d10100000001000000010001000000000000000000000000000000000000000000000000000000000000000400000000005edf7900000000000000000000000000000000000000000000546f6b656e42726964676501000000020000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16").send({
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