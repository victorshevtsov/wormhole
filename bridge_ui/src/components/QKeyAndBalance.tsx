//cloned for styling on quick transfert
import {
  ChainId,
  CHAIN_ID_SAFECOIN,
  CHAIN_ID_SOLANA,
  CHAIN_ID_TERRA,
} from "@certusone/wormhole-sdk";
import { isEVMChain } from "../utils/ethereum";
import QEthereumSignerKey from "./QEthereumSignerKey";
import SafecoinWalletKey from "./SafecoinWalletKey";
import SolanaWalletKey from "./SolanaWalletKey";
import TerraWalletKey from "./TerraWalletKey";

function QKeyAndBalance({ chainId }: { chainId: ChainId }) {
  if (isEVMChain(chainId)) {
    return (
      <>
        <QEthereumSignerKey />
      </>
    );
  }
  if (chainId === CHAIN_ID_SAFECOIN) {
    return (
      <>
        <SafecoinWalletKey />
      </>
    );
  }
  if (chainId === CHAIN_ID_SOLANA) {
    return (
      <>
        <SolanaWalletKey />
      </>
    );
  }
  if (chainId === CHAIN_ID_TERRA) {
    return (
      <>
        <TerraWalletKey />
      </>
    );
  }
  return null;
}

export default QKeyAndBalance;
