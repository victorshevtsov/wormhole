import {
  ChainId,
  CHAIN_ID_SAFECOIN,
  CHAIN_ID_SOLANA,
  CHAIN_ID_TERRA,
  getOriginalAssetEth,
  getOriginalAssetSafe,
  getOriginalAssetSol,
  getOriginalAssetTerra,
  uint8ArrayToHex,
  WormholeWrappedInfo,
} from "@certusone/wormhole-sdk";
import {
  getOriginalAssetEth as getOriginalAssetEthNFT,
  getOriginalAssetSafe as getOriginalAssetSafeNFT,
  getOriginalAssetSol as getOriginalAssetSolNFT,
} from "@certusone/wormhole-sdk/lib/esm/nft_bridge";
import { Connection as SafecoinConnection } from "@safecoin/web3.js";
import { Connection as SolanaConnection} from "@solana/web3.js";
import { LCDClient } from "@terra-money/terra.js";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useEthereumProvider } from "../contexts/EthereumProviderContext";
import { setSourceWormholeWrappedInfo as setNFTSourceWormholeWrappedInfo } from "../store/nftSlice";
import {
  selectNFTIsRecovery,
  selectNFTSourceAsset,
  selectNFTSourceChain,
  selectNFTSourceParsedTokenAccount,
  selectTransferIsRecovery,
  selectTransferSourceAsset,
  selectTransferSourceChain,
} from "../store/selectors";
import { setSourceWormholeWrappedInfo as setTransferSourceWormholeWrappedInfo } from "../store/transferSlice";
import {
  getNFTBridgeAddressForChain,
  getTokenBridgeAddressForChain,
  SAFECOIN_HOST,
  SOLANA_HOST,
  SAFE_NFT_BRIDGE_ADDRESS,
  SAFE_TOKEN_BRIDGE_ADDRESS,
  SOL_NFT_BRIDGE_ADDRESS,
  SOL_TOKEN_BRIDGE_ADDRESS,
  TERRA_HOST,
} from "../utils/consts";
import { isEVMChain } from "../utils/ethereum";

export interface StateSafeWormholeWrappedInfo {
  isWrapped: boolean;
  chainId: ChainId;
  assetAddress: string;
  tokenId?: string;
}

const makeStateSafe = (
  info: WormholeWrappedInfo
): StateSafeWormholeWrappedInfo => ({
  ...info,
  assetAddress: uint8ArrayToHex(info.assetAddress),
});

// Check if the tokens in the configured source chain/address are wrapped
// tokens. Wrapped tokens are tokens that are non-native, I.E, are locked up on
// a different chain than this one.
function useCheckIfWormholeWrapped(nft?: boolean) {
  const dispatch = useDispatch();
  const sourceChain = useSelector(
    nft ? selectNFTSourceChain : selectTransferSourceChain
  );
  const sourceAsset = useSelector(
    nft ? selectNFTSourceAsset : selectTransferSourceAsset
  );
  const nftSourceParsedTokenAccount = useSelector(
    selectNFTSourceParsedTokenAccount
  );
  const tokenId = nftSourceParsedTokenAccount?.tokenId || ""; // this should exist by this step for NFT transfers
  const setSourceWormholeWrappedInfo = nft
    ? setNFTSourceWormholeWrappedInfo
    : setTransferSourceWormholeWrappedInfo;
  const { provider } = useEthereumProvider();
  const isRecovery = useSelector(
    nft ? selectNFTIsRecovery : selectTransferIsRecovery
  );
  useEffect(() => {
    if (isRecovery) {
      return;
    }
    // TODO: loading state, error state
    let cancelled = false;
    (async () => {
      if (isEVMChain(sourceChain) && provider && sourceAsset) {
        const wrappedInfo = makeStateSafe(
          await (nft
            ? getOriginalAssetEthNFT(
                getNFTBridgeAddressForChain(sourceChain),
                provider,
                sourceAsset,
                tokenId,
                sourceChain
              )
            : getOriginalAssetEth(
                getTokenBridgeAddressForChain(sourceChain),
                provider,
                sourceAsset,
                sourceChain
              ))
        );
        if (!cancelled) {
          dispatch(setSourceWormholeWrappedInfo(wrappedInfo));
        }
      }
      if (sourceChain === CHAIN_ID_SAFECOIN && sourceAsset) {
        try {
          const connection = new SafecoinConnection(SAFECOIN_HOST, "confirmed");
          const wrappedInfo = makeStateSafe(
            await (nft
              ? getOriginalAssetSafeNFT(
                  connection,
                  SAFE_NFT_BRIDGE_ADDRESS,
                  sourceAsset
                )
              : getOriginalAssetSafe(
                  connection,
                  SAFE_TOKEN_BRIDGE_ADDRESS,
                  sourceAsset
                ))
          );
          if (!cancelled) {
            dispatch(setSourceWormholeWrappedInfo(wrappedInfo));
          }
        } catch (e) {}
      }
      if (sourceChain === CHAIN_ID_SOLANA && sourceAsset) {
        try {
          const connection = new SolanaConnection(SOLANA_HOST, "confirmed");
          const wrappedInfo = makeStateSafe(
            await (nft
              ? getOriginalAssetSolNFT(
                  connection,
                  SOL_NFT_BRIDGE_ADDRESS,
                  sourceAsset
                )
              : getOriginalAssetSol(
                  connection,
                  SOL_TOKEN_BRIDGE_ADDRESS,
                  sourceAsset
                ))
          );
          if (!cancelled) {
            dispatch(setSourceWormholeWrappedInfo(wrappedInfo));
          }
        } catch (e) {}
      }
      // TODO(Victor): Fix or get rid
      // if (sourceChain === CHAIN_ID_TERRA && sourceAsset) {
      //   try {
      //     const lcd = new LCDClient(TERRA_HOST);
      //     const wrappedInfo = makeStateSafe(
      //       await getOriginalAssetTerra(lcd, sourceAsset)
      //     );
      //     if (!cancelled) {
      //       dispatch(setSourceWormholeWrappedInfo(wrappedInfo));
      //     }
      //   } catch (e) {}
      // }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    dispatch,
    isRecovery,
    sourceChain,
    sourceAsset,
    provider,
    nft,
    setSourceWormholeWrappedInfo,
    tokenId,
  ]);
}

export default useCheckIfWormholeWrapped;
