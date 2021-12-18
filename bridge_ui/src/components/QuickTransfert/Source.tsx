import {
  CHAIN_ID_ETH,
} from "@certusone/wormhole-sdk";
import { getAddress } from "@ethersproject/address";
import { Button, Container, makeStyles, Typography } from "@material-ui/core";
import { Link } from "react-router-dom";
import { VerifiedUser } from "@material-ui/icons";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import {
  selectTransferAmount,
  selectTransferIsSourceComplete,
  selectTransferShouldLockFields,
  selectTransferSourceBalanceString,
  selectTransferSourceChain,
  selectTransferSourceError,
  selectTransferSourceParsedTokenAccount,
} from "../../store/selectors";
import {
  incrementStep,
  setAmount,
  setSourceChain,
} from "../../store/transferSlice";
import {
  BSC_MIGRATION_ASSET_MAP,
  CHAINS,
  ETH_MIGRATION_ASSET_MAP,
  MIGRATION_ASSET_MAP,
} from "../../utils/consts";
import ButtonWithLoader from "../ButtonWithLoader";
import ChainSelect from "../ChainSelect";
import KeyAndBalance from "../KeyAndBalance";
import LowBalanceWarning from "../LowBalanceWarning";
import NumberTextField from "../NumberTextField";
import StepDescription from "../StepDescription";
import { TokenSelector } from "../TokenSelectors/SourceTokenSelector";
import { isMobile } from 'react-device-detect';
import QKeyAndBalance from "../QKeyAndBalance";

const useStyles = makeStyles((theme) => ({
  transferField: {
    marginTop: theme.spacing(5),
  },
  selector: {
    display: "none",
  },
  description: {
   // marginBottom: theme.spacing(4),
    textAlign: "center",
  },
  spacer: {
    height: theme.spacing(6),
  },
}));

function Source() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();
  const sourceChain = useSelector(selectTransferSourceChain);
  const parsedTokenAccount = useSelector(
    selectTransferSourceParsedTokenAccount
  );
  const hasParsedTokenAccount = !!parsedTokenAccount;

  const uiAmountString = useSelector(selectTransferSourceBalanceString);
  const amount = useSelector(selectTransferAmount);
  const error = useSelector(selectTransferSourceError);
  const isSourceComplete = useSelector(selectTransferIsSourceComplete);
  const shouldLockFields = useSelector(selectTransferShouldLockFields);
  const { isReady, statusMessage } = useIsWalletReady(sourceChain);

  const handleSourceChange = useCallback(
    (event) => {
      dispatch(setSourceChain(event.target.value));
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

  if (sourceChain != 2) {
    dispatch(setSourceChain(2));
  }

  return (
    //Ara whole steps container
    <div>

      <div style={{ display: "flex", alignItems: "center" }}>
        {/*Select Safecoin ERC-20 tokens to send through the sPortal Bridge.*/}
        <div style={{ flexGrow: 1 }} />
        <div style={{ display: "none" }}>
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

      {isReady ? (
        <div style={isMobile ? {} : { display: 'flex', justifyContent: "space-around", alignItems: "center" }}>
          <div>
            <div style={isMobile ? {} : { width: "480px" }}>
              {/* hidden for UX purpose for quicktransfer */}
              <ChainSelect
                hidden={true}
                className={classes.selector}
                select
                variant="outlined"
                fullWidth
                value={sourceChain}
                onChange={handleSourceChange}
                disabled={shouldLockFields}
                chains={CHAINS}
              />

              { /* to remove */ isReady || uiAmountString ? (
                <div className={classes.transferField}>
                  <TokenSelector disabled={shouldLockFields} />
                </div>
              ) : null}
              <KeyAndBalance chainId={sourceChain} />
            </div>
          </div>
          <div>
            <>
              <LowBalanceWarning chainId={sourceChain} />
              {hasParsedTokenAccount ? (
                <NumberTextField
                  variant="outlined"
                  label="Amount"
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
              ) : null}
              { /* to remove */ isReady ? (
                <ButtonWithLoader
                  disabled={!isSourceComplete}
                  onClick={handleNextClick}
                  showLoader={false}
                /* error={statusMessage || error}*/
                >
                  Next
                </ButtonWithLoader>
              ) : null}
            </>
            <div>{statusMessage || error}</div>
          </div>
        </div>
      ) : (
        <>
          <Typography variant="h4">
            Get started
          </Typography>
          <div className={classes.spacer}></div>
          <div style={isMobile ? {} : { display: 'flex', justifyContent: "space-around", alignItems: "center" }}>
            <div>
              <Typography className={classes.description}>
                Select your Safecoin <b>ERC-20</b> tokens
                <br /> to send through the sPortal Bridge.
              </Typography>
            </div>
            <div>

              <QKeyAndBalance chainId={sourceChain} />
            </div>
          </div>
          <div className={classes.spacer}></div>
        </>
      )}
    </div>
  );
}

export default Source;
