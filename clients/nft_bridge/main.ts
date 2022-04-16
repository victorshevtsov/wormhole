import yargs from "yargs";

const { hideBin } = require('yargs/helpers')

import * as elliptic from "elliptic";
import * as ethers from "ethers";
import * as safecoinWeb3s from '@safecoin/web3.js';
import * as solanaWeb3s from '@solana/web3.js';

// import {PublicKey, TransactionInstruction, AccountMeta, Keypair, Connection} from "@solana/web3.js";
import { solidityKeccak256 } from "ethers/lib/utils";

import {
    setDefaultWasmSafecoin, setDefaultWasmSolana,
    importCoreWasmSafecoin, importCoreWasmSolana,
    importNftWasmSafecoin, importNftWasmSolana,
    ixFromRustSafecoin, ixFromRustSolana,
    BridgeImplementation__factory
} from '@certusone/wormhole-sdk'

setDefaultWasmSafecoin("node")
setDefaultWasmSolana("node")

const signAndEncodeVM = function (
    timestamp,
    nonce,
    emitterChainId,
    emitterAddress,
    sequence,
    data,
    signers,
    guardianSetIndex,
    consistencyLevel
) {
    const body = [
        ethers.utils.defaultAbiCoder.encode(["uint32"], [timestamp]).substring(2 + (64 - 8)),
        ethers.utils.defaultAbiCoder.encode(["uint32"], [nonce]).substring(2 + (64 - 8)),
        ethers.utils.defaultAbiCoder.encode(["uint16"], [emitterChainId]).substring(2 + (64 - 4)),
        ethers.utils.defaultAbiCoder.encode(["bytes32"], [emitterAddress]).substring(2),
        ethers.utils.defaultAbiCoder.encode(["uint64"], [sequence]).substring(2 + (64 - 16)),
        ethers.utils.defaultAbiCoder.encode(["uint8"], [consistencyLevel]).substring(2 + (64 - 2)),
        data.substr(2)
    ]

    const hash = solidityKeccak256(["bytes"], [solidityKeccak256(["bytes"], ["0x" + body.join("")])])

    let signatures = "";

    for (let i in signers) {
        const ec = new elliptic.ec("secp256k1");
        const key = ec.keyFromPrivate(signers[i]);
        const signature = key.sign(Buffer.from(hash.substr(2), "hex"), { canonical: true });

        const packSig = [
            ethers.utils.defaultAbiCoder.encode(["uint8"], [i]).substring(2 + (64 - 2)),
            zeroPadBytes(signature.r.toString(16), 32),
            zeroPadBytes(signature.s.toString(16), 32),
            ethers.utils.defaultAbiCoder.encode(["uint8"], [signature.recoveryParam]).substr(2 + (64 - 2)),
        ]

        signatures += packSig.join("")
    }

    const vm = [
        ethers.utils.defaultAbiCoder.encode(["uint8"], [1]).substring(2 + (64 - 2)),
        ethers.utils.defaultAbiCoder.encode(["uint32"], [guardianSetIndex]).substring(2 + (64 - 8)),
        ethers.utils.defaultAbiCoder.encode(["uint8"], [signers.length]).substring(2 + (64 - 2)),

        signatures,
        body.join("")
    ].join("");

    return vm
}

function zeroPadBytes(value, length) {
    while (value.length < 2 * length) {
        value = "0" + value;
    }
    return value;
}

yargs(hideBin(process.argv))
    .command('generate_register_chain_vaa [chain_id] [contract_address]', 'create a VAA to register a chain (debug-only)', (yargs) => {
        return yargs
            .positional('chain_id', {
                describe: 'chain id to register',
                type: "number",
                required: true
            })
            .positional('contract_address', {
                describe: 'contract to register',
                type: "string",
                required: true
            })
    }, async (argv: any) => {
        let data = [
            "0x",
            "00000000000000000000000000000000000000000000004e4654427269646765", // NFT Bridge header
            "01",
            "0000",
            ethers.utils.defaultAbiCoder.encode(["uint16"], [argv.chain_id]).substring(2 + (64 - 4)),
            ethers.utils.defaultAbiCoder.encode(["bytes32"], [argv.contract_address]).substring(2),
        ].join('')

        const vm = signAndEncodeVM(
            1,
            1,
            1,
            "0x0000000000000000000000000000000000000000000000000000000000000004",
            Math.floor(Math.random() * 100000000),
            data,
            [
                "cfb12303a19cde580bb4dd771639b0d26bc68353645571a8cff516ab2ee113a0"
            ],
            0,
            0
        );

        console.log(vm)
    })
    .command('safecoin execute_governance_vaa [vaa]', 'execute a governance VAA on Safecoin', (yargs) => {
        return yargs
            .positional('vaa', {
                describe: 'vaa to post',
                type: "string",
                required: true
            })
            .option('rpc', {
                alias: 'u',
                type: 'string',
                description: 'URL of the Safecoin RPC',
                default: "http://localhost:8328"
            })
            .option('bridge', {
                alias: 'b',
                type: 'string',
                description: 'Bridge address',
                default: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o"
            })
            .option('nft_bridge', {
                alias: 't',
                type: 'string',
                description: 'NFT Bridge address',
                default: "NFTWqJR8YnRVqPDvTJrYuLrQDitTG5AScqbeghi4zSA"
            })
    }, async (argv: any) => {
        const bridge = await importCoreWasmSafecoin()
        const nft_bridge = await importNftWasmSafecoin()

        let connection = setupSafecoinConnection(argv);
        let bridge_id = new safecoinWeb3s.PublicKey(argv.bridge);
        let nft_bridge_id = new safecoinWeb3s.PublicKey(argv.nft_bridge);

        // Generate a new random public key
        let from = safecoinWeb3s.Keypair.generate();
        let airdropSignature = await connection.requestAirdrop(
            from.publicKey,
            safecoinWeb3s.LAMPORTS_PER_SAFE,
        );
        await connection.confirmTransaction(airdropSignature);

        let vaa = Buffer.from(argv.vaa, "hex");
        await post_safecoin_vaa(connection, bridge_id, from, vaa);

        let parsed_vaa = await bridge.parse_vaa(vaa);
        let ix: safecoinWeb3s.TransactionInstruction;
        switch (parsed_vaa.payload[32]) {
            case 1:
                console.log("Registering chain")
                ix = nft_bridge.register_chain_ix(nft_bridge_id.toString(), bridge_id.toString(), from.publicKey.toString(), vaa);
                break
            case 2:
                console.log("Upgrading contract")
                ix = nft_bridge.upgrade_contract_ix(nft_bridge_id.toString(), bridge_id.toString(), from.publicKey.toString(), from.publicKey.toString(), vaa);
                break
            default:
                throw new Error("unknown governance action")
        }
        let transaction = new safecoinWeb3s.Transaction().add(ixFromRustSafecoin(ix));

        // Sign transaction, broadcast, and confirm
        let signature = await safecoinWeb3s.sendAndConfirmTransaction(
            connection,
            transaction,
            [from],
            {
                skipPreflight: true
            }
        );
        console.log('SIGNATURE', signature);
    })
    .command('solana execute_governance_vaa [vaa]', 'execute a governance VAA on Solana', (yargs) => {
        return yargs
            .positional('vaa', {
                describe: 'vaa to post',
                type: "string",
                required: true
            })
            .option('rpc', {
                alias: 'u',
                type: 'string',
                description: 'URL of the Solana RPC',
                default: "http://localhost:8899"
            })
            .option('bridge', {
                alias: 'b',
                type: 'string',
                description: 'Bridge address',
                default: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o"
            })
            .option('nft_bridge', {
                alias: 't',
                type: 'string',
                description: 'NFT Bridge address',
                default: "NFTWqJR8YnRVqPDvTJrYuLrQDitTG5AScqbeghi4zSA"
            })
    }, async (argv: any) => {
        const bridge = await importCoreWasmSolana()
        const nft_bridge = await importNftWasmSolana()

        let connection = setupSolanaConnection(argv);
        let bridge_id = new solanaWeb3s.PublicKey(argv.bridge);
        let nft_bridge_id = new solanaWeb3s.PublicKey(argv.nft_bridge);

        // Generate a new random public key
        let from = solanaWeb3s.Keypair.generate();
        let airdropSignature = await connection.requestAirdrop(
            from.publicKey,
            solanaWeb3s.LAMPORTS_PER_SOL,
        );
        await connection.confirmTransaction(airdropSignature);

        let vaa = Buffer.from(argv.vaa, "hex");
        await post_solana_vaa(connection, bridge_id, from, vaa);

        let parsed_vaa = await bridge.parse_vaa(vaa);
        let ix: solanaWeb3s.TransactionInstruction;
        switch (parsed_vaa.payload[32]) {
            case 1:
                console.log("Registering chain")
                ix = nft_bridge.register_chain_ix(nft_bridge_id.toString(), bridge_id.toString(), from.publicKey.toString(), vaa);
                break
            case 2:
                console.log("Upgrading contract")
                ix = nft_bridge.upgrade_contract_ix(nft_bridge_id.toString(), bridge_id.toString(), from.publicKey.toString(), from.publicKey.toString(), vaa);
                break
            default:
                throw new Error("unknown governance action")
        }
        let transaction = new solanaWeb3s.Transaction().add(ixFromRustSolana(ix));

        // Sign transaction, broadcast, and confirm
        let signature = await solanaWeb3s.sendAndConfirmTransaction(
            connection,
            transaction,
            [from],
            {
                skipPreflight: true
            }
        );
        console.log('SIGNATURE', signature);
    })
// .command('eth execute_governance_vaa [vaa]', 'execute a governance VAA on Solana', (yargs) => {
//     return yargs
//         .positional('vaa', {
//             describe: 'vaa to post',
//             type: "string",
//             required: true
//         })
//         .option('rpc', {
//             alias: 'u',
//             type: 'string',
//             description: 'URL of the ETH RPC',
//             default: "http://localhost:8545"
//         })
//         .option('nft_bridge', {
//             alias: 't',
//             type: 'string',
//             description: 'NFT Bridge address',
//             default: "0x26b4afb60d6c903165150c6f0aa14f8016be4aec"
//         })
//         .option('key', {
//             alias: 'k',
//             type: 'string',
//             description: 'Private key of the wallet',
//             default: "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
//         })
// }, async (argv: any) => {
//     const bridge = await importCoreWasm()

//     let provider = new ethers.providers.JsonRpcProvider(argv.rpc)
//     let signer = new ethers.Wallet(argv.key, provider)
//     let t = new BridgeImplementation__factory(signer);
//     let tb = t.attach(argv.nft_bridge);

//     let vaa = Buffer.from(argv.vaa, "hex");
//     let parsed_vaa = await bridge.parse_vaa(vaa);

//     switch (parsed_vaa.payload[32]) {
//         case 1:
//             console.log("Registering chain")
//             console.log("Hash: " + (await tb.registerChain(vaa)).hash)
//             break
//         case 2:
//             console.log("Upgrading contract")
//             console.log("Hash: " + (await tb.upgrade(vaa)).hash)
//             break
//         default:
//             throw new Error("unknown governance action")
//     }
// })
// .argv;

async function post_safecoin_vaa(connection: safecoinWeb3s.Connection, bridge_id: safecoinWeb3s.PublicKey, payer: safecoinWeb3s.Keypair, vaa: Buffer) {
    const bridge = await importCoreWasmSafecoin()

    let bridge_state = await get_safecoin_bridge_state(connection, bridge_id);
    let guardian_addr = new safecoinWeb3s.PublicKey(bridge.guardian_set_address(bridge_id.toString(), bridge_state.guardian_set_index));
    let acc = await connection.getAccountInfo(guardian_addr);
    if (acc?.data === undefined) {
        return
    }
    let guardian_data = bridge.parse_guardian_set(new Uint8Array(acc?.data));

    let signature_set = safecoinWeb3s.Keypair.generate();
    let txs = bridge.verify_signatures_ix(bridge_id.toString(), payer.publicKey.toString(), bridge_state.guardian_set_index, guardian_data, signature_set.publicKey.toString(), vaa)
    // Add transfer instruction to transaction
    for (let tx of txs) {
        let ixs: Array<safecoinWeb3s.TransactionInstruction> = tx.map((v: any) => {
            return ixFromRustSafecoin(v)
        })
        let transaction = new safecoinWeb3s.Transaction().add(ixs[0], ixs[1]);

        // Sign transaction, broadcast, and confirm
        await safecoinWeb3s.sendAndConfirmTransaction(
            connection,
            transaction,
            [payer, signature_set],
            {
                skipPreflight: true
            }
        );
    }

    let ix = ixFromRustSafecoin(bridge.post_vaa_ix(bridge_id.toString(), payer.publicKey.toString(), signature_set.publicKey.toString(), vaa));
    let transaction = new safecoinWeb3s.Transaction().add(ix);

    // Sign transaction, broadcast, and confirm
    let signature = await safecoinWeb3s.sendAndConfirmTransaction(
        connection,
        transaction,
        [payer],
        {
            skipPreflight: true
        }
    );
    console.log('SIGNATURE', signature);
}

async function post_solana_vaa(connection: solanaWeb3s.Connection, bridge_id: solanaWeb3s.PublicKey, payer: solanaWeb3s.Keypair, vaa: Buffer) {
    const bridge = await importCoreWasmSolana()

    let bridge_state = await get_solana_bridge_state(connection, bridge_id);
    let guardian_addr = new solanaWeb3s.PublicKey(bridge.guardian_set_address(bridge_id.toString(), bridge_state.guardian_set_index));
    let acc = await connection.getAccountInfo(guardian_addr);
    if (acc?.data === undefined) {
        return
    }
    let guardian_data = bridge.parse_guardian_set(new Uint8Array(acc?.data));

    let signature_set = solanaWeb3s.Keypair.generate();
    let txs = bridge.verify_signatures_ix(bridge_id.toString(), payer.publicKey.toString(), bridge_state.guardian_set_index, guardian_data, signature_set.publicKey.toString(), vaa)
    // Add transfer instruction to transaction
    for (let tx of txs) {
        let ixs: Array<solanaWeb3s.TransactionInstruction> = tx.map((v: any) => {
            return ixFromRustSolana(v)
        })
        let transaction = new solanaWeb3s.Transaction().add(ixs[0], ixs[1]);

        // Sign transaction, broadcast, and confirm
        await solanaWeb3s.sendAndConfirmTransaction(
            connection,
            transaction,
            [payer, signature_set],
            {
                skipPreflight: true
            }
        );
    }

    let ix = ixFromRustSolana(bridge.post_vaa_ix(bridge_id.toString(), payer.publicKey.toString(), signature_set.publicKey.toString(), vaa));
    let transaction = new solanaWeb3s.Transaction().add(ix);

    // Sign transaction, broadcast, and confirm
    let signature = await solanaWeb3s.sendAndConfirmTransaction(
        connection,
        transaction,
        [payer],
        {
            skipPreflight: true
        }
    );
    console.log('SIGNATURE', signature);
}

async function get_safecoin_bridge_state(connection: safecoinWeb3s.Connection, bridge_id: safecoinWeb3s.PublicKey): Promise<BridgeState> {
    const bridge = await importCoreWasmSafecoin()

    let bridge_state = new safecoinWeb3s.PublicKey(bridge.state_address(bridge_id.toString()));
    let acc = await connection.getAccountInfo(bridge_state);
    if (acc?.data === undefined) {
        throw new Error("bridge state not found")
    }
    return bridge.parse_state(new Uint8Array(acc?.data));
}

async function get_solana_bridge_state(connection: solanaWeb3s.Connection, bridge_id: solanaWeb3s.PublicKey): Promise<BridgeState> {
    const bridge = await importCoreWasmSolana()

    let bridge_state = new solanaWeb3s.PublicKey(bridge.state_address(bridge_id.toString()));
    let acc = await connection.getAccountInfo(bridge_state);
    if (acc?.data === undefined) {
        throw new Error("bridge state not found")
    }
    return bridge.parse_state(new Uint8Array(acc?.data));
}

function setupSafecoinConnection(argv: yargs.Arguments): safecoinWeb3s.Connection {
    return new safecoinWeb3s.Connection(
        argv.rpc as string,
        'confirmed',
    );
}

function setupSolanaConnection(argv: yargs.Arguments): solanaWeb3s.Connection {
    return new solanaWeb3s.Connection(
        argv.rpc as string,
        'confirmed',
    );
}

interface BridgeState {
    // The current guardian set index, used to decide which signature sets to accept.
    guardian_set_index: number,

    // Lamports in the collection account
    last_lamports: number,

    // Bridge configuration, which is set once upon initialization.
    config: BridgeConfig,
}

interface BridgeConfig {
    // Period for how long a guardian set is valid after it has been replaced by a new one.  This
    // guarantees that VAAs issued by that set can still be submitted for a certain period.  In
    // this period we still trust the old guardian set.
    guardian_set_expiration_time: number,

    // Amount of lamports that needs to be paid to the protocol to post a message
    fee: number,
}
