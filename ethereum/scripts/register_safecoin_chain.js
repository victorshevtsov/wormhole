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

        console.log("Register the Safecoin token bridge endpoint");
        // Register the Safecoin token bridge endpoint
        await tokenBridge.methods.registerChain("0x0100000000010066d7b2a2ee3752f6df3097f5b6edbb4e5a0bed953b020be18bb9757e16e071bb1cf0b217ca2028c4e86a10e910dda8ba3338c84ebbd2913a3a385383125b7f4f010000000100000001000100000000000000000000000000000000000000000000000000000000000000040000000002ba0e7400000000000000000000000000000000000000000000546f6b656e427269646765010000000665615c9ab89a167582ec9ae2da9f54be9b5f28ab44e0b1533c06066e93940b7b").send({
            value: 0,
            from: accounts[0],
            gasLimit: 2000000
        });

        // console.log("Register the Safecoin NFT bridge endpoint");
        // await nftBridge.methods.registerChain("0x01000000000100aaea454cfd2f09d2600f7a75e05116a85fe13b9efcc995f2dd173e33001966a41f5b8fe6127e16e63a43dfeb2734cf733cd93f79c8503eb18599fe26a801e540000000000100000001000600000000000000000000000000000000000000000000000000000000000000040000000002d758cf00000000000000000000000000000000000000000000546f6b656e42726964676501000000068989a0561640004678124d0519a3836d1aac68476ba1a5c83215a53c95ad8427").send({
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