// run this script with truffle exec

const jsonfile = require("jsonfile");
const TokenBridge = artifacts.require("TokenBridge");
// const NFTBridge = artifacts.require("NFTBridgeEntrypoint");
const TokenImplementation = artifacts.require("TokenImplementation");
const BridgeImplementationFullABI = jsonfile.readFileSync("../build/contracts/BridgeImplementation.json").abi

module.exports = async function (callback) {
    try {
        const accounts = await web3.eth.getAccounts();
        const tokenBridge = new web3.eth.Contract(BridgeImplementationFullABI, TokenBridge.address);
        // const nftBridge = new web3.eth.Contract(BridgeImplementationFullABI, NFTBridge.address);

        // Register the Safecoin token bridge endpoint
        // await tokenBridge.methods.registerChain("0x01000000000100ac3ab8a8ea0112636c1c69fb684405cf7e47b0265cb3d136f06ee119eb73dfc03c2c45f11b7825b0f54f1863ab534c8121a463d951595bd224e243e9c3e7b5b9000000000100000001000100000000000000000000000000000000000000000000000000000000000000040000000001ff18ef00000000000000000000000000000000000000000000546f6b656e4272696467650100004add65615c9ab89a167582ec9ae2da9f54be9b5f28ab44e0b1533c06066e93940b7b").send({
        await tokenBridge.methods.registerChain("0xVAA_PLACEHOLDER").send({
            value: 0,
            from: accounts[0],
            gasLimit: 2000000
        });

        // // Register the Safecoin NFT bridge endpoint
        // await nftBridge.methods.registerChain("0x01000000000100b55b75c06a83263541e4d9bbfeb01bd6b5b1c563e2f9dd4ea2d6b64a565baed638213ec9720b3202ae3fbee2bc50ff7bd9cb4db2158e3cfb98d3b439f479741c0100000001000000010002000000000000000000000000000000000000000000000000000000000000000400000000023dc78f00000000000000000000000000000000000000000000546f6b656e42726964676501000000098989a0561640004678124d0519a3836d1aac68476ba1a5c83215a53c95ad8427").send({
        //     value: 0,
        //     from: accounts[0],
        //     gasLimit: 2000000
        // });

        callback();
    }
    catch (e) {
        callback(e);
    }
}