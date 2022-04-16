// run this script with truffle exec

const jsonfile = require("jsonfile");
const TokenBridge = artifacts.require("TokenBridge");
// const NFTBridge = artifacts.require("NFTBridgeEntrypoint");
// const TokenImplementation = artifacts.require("TokenImplementation");
const BridgeImplementationFullABI = jsonfile.readFileSync("../build/contracts/BridgeImplementation.json").abi

module.exports = async function (callback) {
    try {
        const accounts = await web3.eth.getAccounts();
        const tokenBridge = new web3.eth.Contract(BridgeImplementationFullABI, TokenBridge.address);
        // const nftBridge = new web3.eth.Contract(BridgeImplementationFullABI, NFTBridge.address);

        // Register the Solana token bridge endpoint
        // await tokenBridge.methods.registerChain("0x010000000001006ca917c18d2a9224f67c82a95ed5414ab30bdc6444801d8c646b925c78e95e5a20eaa0285eaedfd6b3974b71885ff4ab689671d4865bc3bd9e42423ebaaefcb00000000001000000010001000000000000000000000000000000000000000000000000000000000000000400000000046945ba00000000000000000000000000000000000000000000546f6b656e427269646765010000000165615c9ab89a167582ec9ae2da9f54be9b5f28ab44e0b1533c06066e93940b7b").send({
        await tokenBridge.methods.registerChain("0xVAA_PLACEHOLDER").send({
            value: 0,
            from: accounts[0],
            gasLimit: 200000
        });

        // Register the Solana NFT bridge endpoint
        // await nftBridge.methods.registerChain("0x010000000001007985ba742002ae745c19722fea4d82102e68526c7c9d94d0e5d0a809071c98451c9693b230b3390f4ca9555a3ba9a9abbe87cf6f9e400682213e4fbbe1dabb9e0100000001000000010001000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000004e4654427269646765010000000196ee982293251b48729804c8e8b24b553eb6b887867024948d2236fd37a577ab").send({
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