import { ChainId, CHAIN_ID_SAFECOIN, CHAIN_ID_SOLANA } from "@certusone/wormhole-sdk";
import { LinearProgress, makeStyles, Typography } from "@material-ui/core";
import { Connection as SafecoinConnection } from "@safecoin/web3.js";
import { Connection as SolanaConnection } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { useEthereumProvider } from "../contexts/EthereumProviderContext";
import { Transaction } from "../store/transferSlice";
import { CHAINS_BY_ID, SAFECOIN_HOST, SOLANA_HOST } from "../utils/consts";
import { isEVMChain } from "../utils/ethereum";

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(2),
    textAlign: "center",
  },
  message: {
    marginTop: theme.spacing(1),
  },
}));

export default function TransactionProgress({
  chainId,
  tx,
  isSendComplete,
}: {
  chainId: ChainId;
  tx: Transaction | undefined;
  isSendComplete: boolean;
}) {
  const classes = useStyles();
  const { provider } = useEthereumProvider();
  const [currentBlock, setCurrentBlock] = useState(0);
  useEffect(() => {
    if (isSendComplete || !tx) return;
    if (isEVMChain(chainId) && provider) {
      let cancelled = false;
      (async () => {
        while (!cancelled) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          try {
            const newBlock = await provider.getBlockNumber();
            if (!cancelled) {
              setCurrentBlock(newBlock);
            }
          } catch (e) {
            console.error(e);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }
    if (chainId === CHAIN_ID_SAFECOIN) {
      let cancelled = false;
      const connection = new SafecoinConnection(SAFECOIN_HOST, "confirmed");
      const sub = connection.onSlotChange((slotInfo) => {
        if (!cancelled) {
          setCurrentBlock(slotInfo.slot);
        }
      });
      return () => {
        cancelled = true;
        connection.removeSlotChangeListener(sub);
      };
    }
    if (chainId === CHAIN_ID_SOLANA) {
      let cancelled = false;
      const connection = new SolanaConnection(SOLANA_HOST, "confirmed");
      const sub = connection.onSlotChange((slotInfo) => {
        if (!cancelled) {
          setCurrentBlock(slotInfo.slot);
        }
      });
      return () => {
        cancelled = true;
        connection.removeSlotChangeListener(sub);
      };
    }
  }, [isSendComplete, chainId, provider, tx]);
  const blockDiff =
    tx && tx.block && currentBlock ? currentBlock - tx.block : undefined;
  const expectedBlocks =
    chainId === CHAIN_ID_SAFECOIN || chainId === CHAIN_ID_SOLANA
      ? 32
      : isEVMChain(chainId)
        ? 15
        : 1;
  if (
    !isSendComplete &&
    (chainId === CHAIN_ID_SAFECOIN || chainId === CHAIN_ID_SOLANA || isEVMChain(chainId)) &&
    blockDiff !== undefined
  ) {
    return (
      <div className={classes.root}>
        <LinearProgress
          value={
            blockDiff < expectedBlocks ? (blockDiff / expectedBlocks) * 75 : 75
          }
          variant="determinate"
        />
        <Typography variant="body2" className={classes.message}>
          {blockDiff < expectedBlocks
            ? `Waiting for ${blockDiff} / ${expectedBlocks} confirmations on ${CHAINS_BY_ID[chainId].name}...`
            : `Waiting for SafeBridge Network consensus...`}
        </Typography>
      </div>
    );
  }
  return null;
}
