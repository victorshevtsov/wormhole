import { CHAIN_ID_SAFECOIN } from "@certusone/wormhole-sdk";
import { TokenInfo } from "@safecoin/safe-token-registry";
import React, { useCallback, useMemo } from "react";
import useMetaplexData from "../../hooks/useSafecoinMetaplexData";
import useSafecoinTokenMap from "../../hooks/useSafecoinTokenMap";
import { DataWrapper } from "../../store/helpers";
import { NFTParsedTokenAccount } from "../../store/nftSlice";
import { ParsedTokenAccount } from "../../store/transferSlice";
import {
  MIGRATION_ASSET_MAP,
  WORMHOLE_V1_MINT_AUTHORITY,
} from "../../utils/consts";
import { ExtractedMintInfo } from "../../utils/safecoin";
import { sortParsedTokenAccounts } from "../../utils/sort";
import TokenPicker, { BasicAccountRender } from "./TokenPicker";

type SafecoinSourceTokenSelectorProps = {
  value: ParsedTokenAccount | null;
  onChange: (newValue: NFTParsedTokenAccount | null) => void;
  accounts: DataWrapper<NFTParsedTokenAccount[]> | null | undefined;
  disabled: boolean;
  mintAccounts:
    | DataWrapper<Map<string, ExtractedMintInfo | null> | undefined>
    | undefined;
  resetAccounts: (() => void) | undefined;
  nft?: boolean;
};

const isMigrationEligible = (address: string) => {
  return !!MIGRATION_ASSET_MAP.get(address);
};

export default function SafecoinSourceTokenSelector(
  props: SafecoinSourceTokenSelectorProps
) {
  const {
    value,
    onChange,
    disabled,
    resetAccounts,
    nft,
    accounts,
    mintAccounts,
  } = props;
  const tokenMap = useSafecoinTokenMap();
  const mintAddresses = useMemo(() => {
    const output: string[] = [];
    mintAccounts?.data?.forEach(
      (mintAuth, mintAddress) => mintAddress && output.push(mintAddress)
    );
    return output;
  }, [mintAccounts?.data]);
  const metaplex = useMetaplexData(mintAddresses);

  const memoizedTokenMap: Map<String, TokenInfo> = useMemo(() => {
    const output = new Map<String, TokenInfo>();

    if (tokenMap.data) {
      for (const data of tokenMap.data) {
        if (data && data.address) {
          output.set(data.address, data);
        }
      }
    }

    return output;
  }, [tokenMap]);

  const getLogo = useCallback(
    (account: ParsedTokenAccount) => {
      return (
        (account.isNativeAsset && account.logo) ||
        memoizedTokenMap.get(account.mintKey)?.logoURI ||
        metaplex.data?.get(account.mintKey)?.data?.uri ||
        undefined
      );
    },
    [memoizedTokenMap, metaplex]
  );

  const getSymbol = useCallback(
    (account: ParsedTokenAccount) => {
      return (
        (account.isNativeAsset && account.symbol) ||
        memoizedTokenMap.get(account.mintKey)?.symbol ||
        metaplex.data?.get(account.mintKey)?.data?.symbol ||
        undefined
      );
    },
    [memoizedTokenMap, metaplex]
  );

  const getName = useCallback(
    (account: ParsedTokenAccount) => {
      return (
        (account.isNativeAsset && account.name) ||
        memoizedTokenMap.get(account.mintKey)?.name ||
        metaplex.data?.get(account.mintKey)?.data?.name ||
        undefined
      );
    },
    [memoizedTokenMap, metaplex]
  );

  //This exists to remove NFTs from the list of potential options. It requires reading the metaplex data, so it would be
  //difficult to do before this point.
  const filteredOptions = useMemo(() => {
    const array = accounts?.data || [];
    const tokenList = array.filter((x) => {
      const zeroBalance = x.amount === "0";
      if (zeroBalance) {
        return false;
      }
      const isNFT =
        x.decimals === 0 && metaplex.data?.get(x.mintKey)?.data?.uri;
      const is721CompatibleNFT =
        isNFT && mintAccounts?.data?.get(x.mintKey)?.supply === "1";
      return nft ? is721CompatibleNFT : !isNFT;
    });
    tokenList.sort(sortParsedTokenAccounts);
    return tokenList;
  }, [mintAccounts?.data, metaplex.data, nft, accounts]);

  const accountsWithMetadata = useMemo(() => {
    return filteredOptions.map((account) => {
      const logo = getLogo(account);
      const symbol = getSymbol(account);
      const name = getName(account);

      const uri = getLogo(account);

      return {
        ...account,
        name,
        symbol,
        logo,
        uri,
      };
    });
  }, [filteredOptions, getLogo, getName, getSymbol]);

  const isLoading =
    accounts?.isFetching || metaplex.isFetching || tokenMap.isFetching;

  // const isWormholev1 = useCallback(
  //   (address: string) => {
  //     //This is a v1 wormhole token on testnet
  //     //const testAddress = "4QixXecTZ4zdZGa39KH8gVND5NZ2xcaB12wiBhE4S7rn";

  //     if (!props.mintAccounts?.data) {
  //       return true; //These should never be null by this point
  //     }
  //     const mintAuthority = props.mintAccounts.data.get(address)?.mintAuthority;

  //     if (!mintAuthority) {
  //       return true; //We should never fail to pull the mint of an account.
  //     }

  //     if (mintAuthority === WORMHOLE_V1_MINT_AUTHORITY) {
  //       return true; //This means the mint was created by the wormhole v1 contract, and we want to disallow its transfer.
  //     }

  //     return false;
  //   },
  //   [props.mintAccounts]
  // );

  const onChangeWrapper = useCallback(
    async (newValue: NFTParsedTokenAccount | null) => {
      let v1 = false;
      if (newValue === null) {
        onChange(null);
        return Promise.resolve();
      }
      try {
        v1 = false // isWormholev1(newValue.mintKey);
      } catch (e) {
        //swallow for now
      }

      if (v1) {
        Promise.reject(
          "Wormhole v1 assets should not be transferred with this bridge."
        );
      }

      onChange(newValue);
      return Promise.resolve();
    },
    [onChange]
    // [isWormholev1, onChange]
  );

  const RenderComp = useCallback(
    ({ account }: { account: NFTParsedTokenAccount }) => {
      return BasicAccountRender(account, isMigrationEligible, nft || false);
    },
    [nft]
  );

  return (
    <TokenPicker
      value={value}
      options={accountsWithMetadata}
      RenderOption={RenderComp}
      onChange={onChangeWrapper}
      disabled={disabled}
      resetAccounts={resetAccounts}
      error={""}
      showLoader={isLoading}
      nft={nft || false}
      chainId={CHAIN_ID_SAFECOIN}
    />
  );
}
