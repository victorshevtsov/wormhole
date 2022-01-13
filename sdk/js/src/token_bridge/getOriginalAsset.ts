import { Connection as SafecoinConnection, PublicKey as  SafecoinPublicKey } from "@safecoin/web3.js";
import { Connection as SolanaConnection, PublicKey as SolanaPublicKey } from "@solana/web3.js";
import { LCDClient } from "@terra-money/terra.js";
import { ethers } from "ethers";
import { arrayify, zeroPad } from "ethers/lib/utils";
import { TokenImplementation__factory } from "../ethers-contracts";
import { importTokenWasm } from "../solana/wasm";
import { buildNativeId, canonicalAddress, isNativeDenom } from "../terra";
import { ChainId, CHAIN_ID_SAFECOIN, CHAIN_ID_SOLANA, CHAIN_ID_TERRA } from "../utils";
import { getIsWrappedAssetEth } from "./getIsWrappedAsset";

export interface WormholeWrappedInfo {
  isWrapped: boolean;
  chainId: ChainId;
  assetAddress: Uint8Array;
}

/**
 * Returns a origin chain and asset address on {originChain} for a provided Wormhole wrapped address
 * @param tokenBridgeAddress
 * @param provider
 * @param wrappedAddress
 * @returns
 */
export async function getOriginalAssetEth(
  tokenBridgeAddress: string,
  provider: ethers.Signer | ethers.providers.Provider,
  wrappedAddress: string,
  lookupChainId: ChainId
): Promise<WormholeWrappedInfo> {
  const isWrapped = await getIsWrappedAssetEth(
    tokenBridgeAddress,
    provider,
    wrappedAddress
  );
  if (isWrapped) {
    const token = TokenImplementation__factory.connect(
      wrappedAddress,
      provider
    );
    const chainId = (await token.chainId()) as ChainId; // origin chain
    const assetAddress = await token.nativeContract(); // origin address
    return {
      isWrapped: true,
      chainId,
      assetAddress: arrayify(assetAddress),
    };
  }
  return {
    isWrapped: false,
    chainId: lookupChainId,
    assetAddress: zeroPad(arrayify(wrappedAddress), 32),
  };
}

export async function getOriginalAssetTerra(
  client: LCDClient,
  wrappedAddress: string
): Promise<WormholeWrappedInfo> {
  if (isNativeDenom(wrappedAddress)) {
    return {
      isWrapped: false,
      chainId: CHAIN_ID_TERRA,
      assetAddress: buildNativeId(wrappedAddress),
    };
  }
  try {
    const result: {
      asset_address: string;
      asset_chain: ChainId;
      bridge: string;
    } = await client.wasm.contractQuery(wrappedAddress, {
      wrapped_asset_info: {},
    });
    if (result) {
      return {
        isWrapped: true,
        chainId: result.asset_chain,
        assetAddress: new Uint8Array(
          Buffer.from(result.asset_address, "base64")
        ),
      };
    }
  } catch (e) {}
  return {
    isWrapped: false,
    chainId: CHAIN_ID_TERRA,
    assetAddress: zeroPad(canonicalAddress(wrappedAddress), 32),
  };
}

/**
 * Returns a origin chain and asset address on {originChain} for a provided Wormhole wrapped address
 * @param connection
 * @param tokenBridgeAddress
 * @param mintAddress
 * @returns
 */
export async function getOriginalAssetSafe(
  connection: SafecoinConnection,
  tokenBridgeAddress: string,
  mintAddress: string
): Promise<WormholeWrappedInfo> {
  if (mintAddress) {
    // TODO: share some of this with getIsWrappedAssetSol, like a getWrappedMetaAccountAddress or something
    const { parse_wrapped_meta, wrapped_meta_address } =
      await importTokenWasm();
    const wrappedMetaAddress = wrapped_meta_address(
      tokenBridgeAddress,
      new SafecoinPublicKey(mintAddress).toBytes()
    );
    const wrappedMetaAddressPK = new SafecoinPublicKey(wrappedMetaAddress);
    const wrappedMetaAccountInfo = await connection.getAccountInfo(
      wrappedMetaAddressPK
    );
    if (wrappedMetaAccountInfo) {
      const parsed = parse_wrapped_meta(wrappedMetaAccountInfo.data);
      return {
        isWrapped: true,
        chainId: parsed.chain,
        assetAddress: parsed.token_address,
      };
    }
  }
  try {
    return {
      isWrapped: false,
      chainId: CHAIN_ID_SAFECOIN,
      assetAddress: new SafecoinPublicKey(mintAddress).toBytes(),
    };
  } catch (e) {}
  return {
    isWrapped: false,
    chainId: CHAIN_ID_SAFECOIN,
    assetAddress: new Uint8Array(32),
  };
}

/**
 * Returns a origin chain and asset address on {originChain} for a provided Wormhole wrapped address
 * @param connection
 * @param tokenBridgeAddress
 * @param mintAddress
 * @returns
 */
 export async function getOriginalAssetSol(
  connection: SolanaConnection,
  tokenBridgeAddress: string,
  mintAddress: string
): Promise<WormholeWrappedInfo> {
  if (mintAddress) {
    // TODO: share some of this with getIsWrappedAssetSol, like a getWrappedMetaAccountAddress or something
    const { parse_wrapped_meta, wrapped_meta_address } =
      await importTokenWasm();
    const wrappedMetaAddress = wrapped_meta_address(
      tokenBridgeAddress,
      new SolanaPublicKey(mintAddress).toBytes()
    );
    const wrappedMetaAddressPK = new SolanaPublicKey(wrappedMetaAddress);
    const wrappedMetaAccountInfo = await connection.getAccountInfo(
      wrappedMetaAddressPK
    );
    if (wrappedMetaAccountInfo) {
      const parsed = parse_wrapped_meta(wrappedMetaAccountInfo.data);
      return {
        isWrapped: true,
        chainId: parsed.chain,
        assetAddress: parsed.token_address,
      };
    }
  }
  try {
    return {
      isWrapped: false,
      chainId: CHAIN_ID_SOLANA,
      assetAddress: new SolanaPublicKey(mintAddress).toBytes(),
    };
  } catch (e) {}
  return {
    isWrapped: false,
    chainId: CHAIN_ID_SOLANA,
    assetAddress: new Uint8Array(32),
  };
}
