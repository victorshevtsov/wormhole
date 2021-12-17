import {
  CHAIN_ID_ETH,
} from "@certusone/wormhole-sdk";
import { getAddress } from "@ethersproject/address";
import { Button, Container, makeStyles } from "@material-ui/core";
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

const useStyles = makeStyles((theme) => ({
  transferField: {
    marginTop: theme.spacing(5),
  },
  selector: {
    display: "none",
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
      <StepDescription>
        <div style={{ display: "flex", alignItems: "center" }}>
          Select Safecoin ERC-20 tokens to send through the sPortal Bridge.
          <div style={{ flexGrow: 1 }} />
          <div style={{display:"none"}}>
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
      <div style={isMobile ? {} : { display: 'flex', justifyContent: "space-around", alignItems: "center" }}>
        <div>
          <div style={isMobile ? {} : { width: "480px" }}>
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

            {isReady || uiAmountString ? (
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
            <ButtonWithLoader
              disabled={!isSourceComplete}
              onClick={handleNextClick}
              showLoader={false}
            /* error={statusMessage || error}*/
            >
              Next
            </ButtonWithLoader>
          </>
          <div>{statusMessage || error}</div>
        </div>
      </div>
    </div>
  );
}

export default Source;
