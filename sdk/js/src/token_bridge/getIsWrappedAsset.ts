import { Connection as SafecoinConnection, PublicKey as SafecoinPublicKey } from "@safecoin/web3.js";
import { Connection as SolanaConnection, PublicKey as SolanaPublicKey} from "@solana/web3.js";
import { LCDClient } from "@terra-money/terra.js";
import { ethers } from "ethers";
import { Bridge__factory } from "../ethers-contracts";
import { importTokenWasm as importTokenSafecoinWasm } from "../safecoin/wasm";
import { importTokenWasm as importTokenSolanaWasm } from "../solana/wasm";

/**
 * Returns whether or not an asset address on Ethereum is a wormhole wrapped asset
 * @param tokenBridgeAddress
 * @param provider
 * @param assetAddress
 * @returns
 */
 export async function getIsWrappedAssetEth(
  tokenBridgeAddress: string,
  provider: ethers.Signer | ethers.providers.Provider,
  assetAddress: string
) {
  if (!assetAddress) return false;
  const tokenBridge = Bridge__factory.connect(tokenBridgeAddress, provider);
  return await tokenBridge.isWrappedAsset(assetAddress);
}

export async function getIsWrappedAssetTerra(
  tokenBridgeAddress: string,
  client: LCDClient,
  assetAddress: string
) {
  return false;
}

/**
 * Returns whether or not an asset on Solana is a wormhole wrapped asset
 * @param connection
 * @param tokenBridgeAddress
 * @param mintAddress
 * @returns
 */
 export async function getIsWrappedAssetSafe(
  connection: SafecoinConnection,
  tokenBridgeAddress: string,
  mintAddress: string
) {
  if (!mintAddress) return false;
  const { wrapped_meta_address } = await importTokenSafecoinWasm();
  const wrappedMetaAddress = wrapped_meta_address(
    tokenBridgeAddress,
    new SafecoinPublicKey(mintAddress).toBytes()
  );
  const wrappedMetaAddressPK = new SafecoinPublicKey(wrappedMetaAddress);
  const wrappedMetaAccountInfo = await connection.getAccountInfo(
    wrappedMetaAddressPK
  );
  return !!wrappedMetaAccountInfo;
}

/**
 * Returns whether or not an asset on Solana is a wormhole wrapped asset
 * @param connection
 * @param tokenBridgeAddress
 * @param mintAddress
 * @returns
 */
export async function getIsWrappedAssetSol(
  connection: SolanaConnection,
  tokenBridgeAddress: string,
  mintAddress: string
) {
  if (!mintAddress) return false;
  const { wrapped_meta_address } = await importTokenSolanaWasm();
  const wrappedMetaAddress = wrapped_meta_address(
    tokenBridgeAddress,
    new SolanaPublicKey(mintAddress).toBytes()
  );
  const wrappedMetaAddressPK = new SolanaPublicKey(wrappedMetaAddress);
  const wrappedMetaAccountInfo = await connection.getAccountInfo(
    wrappedMetaAddressPK
  );
  return !!wrappedMetaAccountInfo;
}
