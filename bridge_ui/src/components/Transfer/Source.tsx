import {
  CHAIN_ID_BSC,
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
} from "@certusone/wormhole-sdk";
import { getAddress } from "@ethersproject/address";
import { Button, makeStyles, Typography } from "@material-ui/core";
import { VerifiedUser } from "@material-ui/icons";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import {
  selectTransferAmount,
  selectTransferIsSourceComplete,
  selectTransferShouldLockFields,
  selectTransferSourceBalanceString,
  selectTransferSourceChain,
  selectTransferSourceError,
  selectTransferSourceParsedTokenAccount,
  selectTransferTargetChain,
} from "../../store/selectors";
import {
  incrementStep,
  setAmount,
  setSourceChain,
  setTargetChain,
} from "../../store/transferSlice";
import {
  BSC_MIGRATION_ASSET_MAP,
  CHAINS,
  ETH_MIGRATION_ASSET_MAP,
  MIGRATION_ASSET_MAP,
} from "../../utils/consts";
import ButtonWithLoader from "../ButtonWithLoader";
import ChainSelect from "../ChainSelect";
import ChainSelectArrow from "../ChainSelectArrow";
import KeyAndBalance from "../KeyAndBalance";
import LowBalanceWarning from "../LowBalanceWarning";
import NumberTextField from "../NumberTextField";
import StepDescription from "../StepDescription";
import { TokenSelector } from "../TokenSelectors/SourceTokenSelector";
import SourceAssetWarning from "./SourceAssetWarning";
import { isMobile } from 'react-device-detect';

const useStyles = makeStyles((theme) => ({
  chainSelectWrapper: {
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
    },
  },
  chainSelectContainer: {
    flexBasis: "100%",
    [theme.breakpoints.down("sm")]: {
      width: "100%",
    },
  },
  chainSelectArrow: {
    position: "relative",
    top: "12px",
    [theme.breakpoints.down("sm")]: { transform: "rotate(90deg)" },
  },
  transferField: {
    //marginTop: theme.spacing(5),
    width: "100%"
  },
  subtitles: {
    // marginTop: theme.spacing(3),
    fontWeight: 500,
    paddingBottom: "5px"
  },
  microblock: {
    marginTop: "25px"
  }
}));

function Source() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();
  const sourceChain = useSelector(selectTransferSourceChain);
  const targetChain = useSelector(selectTransferTargetChain);
  const targetChainOptions = useMemo(
    () => CHAINS.filter((c) => c.id !== sourceChain),
    [sourceChain]
  );
  const parsedTokenAccount = useSelector(
    selectTransferSourceParsedTokenAccount
  );
  const hasParsedTokenAccount = !!parsedTokenAccount;
  const isSolanaMigration =
    sourceChain === CHAIN_ID_SOLANA &&
    !!parsedTokenAccount &&
    !!MIGRATION_ASSET_MAP.get(parsedTokenAccount.mintKey);
  const isEthereumMigration =
    sourceChain === CHAIN_ID_ETH &&
    !!parsedTokenAccount &&
    !!ETH_MIGRATION_ASSET_MAP.get(getAddress(parsedTokenAccount.mintKey));
  const isBscMigration =
    sourceChain === CHAIN_ID_BSC &&
    !!parsedTokenAccount &&
    !!BSC_MIGRATION_ASSET_MAP.get(getAddress(parsedTokenAccount.mintKey));
  const isMigrationAsset =
    isSolanaMigration || isEthereumMigration || isBscMigration;
  const uiAmountString = useSelector(selectTransferSourceBalanceString);
  const amount = useSelector(selectTransferAmount);
  const error = useSelector(selectTransferSourceError);
  const isSourceComplete = useSelector(selectTransferIsSourceComplete);
  const shouldLockFields = useSelector(selectTransferShouldLockFields);
  const { isReady, statusMessage } = useIsWalletReady(sourceChain);
  const handleMigrationClick = useCallback(() => {
    if (sourceChain === CHAIN_ID_SOLANA) {
      history.push(
        `/migrate/Solana/${parsedTokenAccount?.mintKey}/${parsedTokenAccount?.publicKey}`
      );
    } else if (sourceChain === CHAIN_ID_ETH) {
      history.push(`/migrate/Ethereum/${parsedTokenAccount?.mintKey}`);
    } else if (sourceChain === CHAIN_ID_BSC) {
      history.push(`/migrate/BinanceSmartChain/${parsedTokenAccount?.mintKey}`);
    }
  }, [history, parsedTokenAccount, sourceChain]);
  const handleSourceChange = useCallback(
    (event) => {
      dispatch(setSourceChain(event.target.value));
    },
    [dispatch]
  );
  const handleTargetChange = useCallback(
    (event) => {
      dispatch(setTargetChain(event.target.value));
    },
    [dispatch]
  );
  const handleAmountChange = useCallback(
    (event) => {
      dispatch(setAmount(event.target.value));
    },
    [dispatch]
  );
  const handleMaxClick = useCallback(() => {
    if (uiAmountString) {
      dispatch(setAmount(uiAmountString));
    }
  }, [dispatch, uiAmountString]);
  const handleNextClick = useCallback(() => {
    dispatch(incrementStep());
  }, [dispatch]);

  return (
    <>
      <StepDescription>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ opacity: 0.7 }}>Select tokens to send through the Wormhole Bridge.</div>
          <div style={{ flexGrow: 1 }} />
          <div>
            <Button
              component={Link}
              to="/token-origin-verifier"
              size="small"
              variant="outlined"
              endIcon={<VerifiedUser />}
            >
              Token Origin Verifier
            </Button>
          </div>
        </div>
      </StepDescription>
      <div className={classes.chainSelectWrapper}>
        <div className={classes.chainSelectContainer}>
          <Typography className={classes.subtitles}>Chain source</Typography>
          <ChainSelect
            select
            //variant="outlined"
            fullWidth
            value={sourceChain}
            onChange={handleSourceChange}
            disabled={shouldLockFields}
            chains={CHAINS} variant={"outlined"} />
        </div>
        <div className={classes.chainSelectArrow}>
          <ChainSelectArrow
            onClick={() => {
              dispatch(setSourceChain(targetChain));
            }}
            disabled={shouldLockFields}
          />
        </div>
        <div className={classes.chainSelectContainer}>
          <Typography className={classes.subtitles}>Chain target</Typography>
          <ChainSelect
            variant="outlined"
            select
            fullWidth
            value={targetChain}
            onChange={handleTargetChange}
            disabled={shouldLockFields}
            chains={targetChainOptions}
          />
        </div>
      </div>
      <div style={isMobile ? {} : { display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginRight: "auto" }}>
          <KeyAndBalance chainId={sourceChain} />
        </div>
        {isReady || uiAmountString ? (
          <div className={classes.microblock}>
            <Typography className={classes.subtitles}>Select the asset</Typography>
            <TokenSelector disabled={shouldLockFields} />
          </div>
        ) : null}
        {isMigrationAsset ? (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleMigrationClick}
          >
            Go to Migration Page
          </Button>
        ) : (
          <>
            <div>
              <LowBalanceWarning chainId={sourceChain} />
              <SourceAssetWarning
                sourceChain={sourceChain}
                sourceAsset={parsedTokenAccount?.mintKey}
              />
              {hasParsedTokenAccount ? (
                <>
                  <div className={classes.microblock}>
                    <Typography className={classes.subtitles}>Amount to transfer</Typography>
                    <NumberTextField
                      variant="outlined"
                      //label="Amount"
                      placeholder="0.00"
                      fullWidth
                      className={classes.transferField}
                      value={amount}
                      onChange={handleAmountChange}
                      disabled={shouldLockFields}
                      onMaxClick={
                        uiAmountString && !parsedTokenAccount.isNativeAsset
                          ? handleMaxClick
                          : undefined
                      }
                    />
                  </div>
                </>
              ) : null}
              <div style={isMobile ? {} : { float: "right", marginTop: "25px" }}>
                <ButtonWithLoader
                  disabled={!isSourceComplete}
                  onClick={handleNextClick}
                  showLoader={false}
                  error={statusMessage || error}
                >
                  Next
                </ButtonWithLoader>
              </div>
            </div>
          </>
        )}
      </div>
    </>

  );
}

export default Source;