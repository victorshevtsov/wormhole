import { CHAIN_ID_TERRA, isEVMChain } from "@certusone/wormhole-sdk";
import { Card, Checkbox, FormControlLabel, makeStyles, Typography } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { ethers } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { useCallback, useMemo, useState } from "react";
import { isMobile } from "react-device-detect";
import { useSelector } from "react-redux";
import useAllowance from "../../hooks/useAllowance";
import { useHandleTransfer } from "../../hooks/useHandleTransfer";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import { COLORS } from "../../muiThemeLight";
import {
  selectSourceWalletAddress,
  selectTransferAmount,
  selectTransferIsSendComplete,
  selectTransferSourceAsset,
  selectTransferSourceChain,
  selectTransferSourceParsedTokenAccount,
  selectTransferTargetError,
  selectTransferTransferTx,
} from "../../store/selectors";
import { CHAINS_BY_ID } from "../../utils/consts";
import ButtonWithLoader from "../ButtonWithLoader";
import KeyAndBalance from "../KeyAndBalance";
import ShowTx from "../ShowTx";
import StepDescription from "../StepDescription";
import TerraFeeDenomPicker from "../TerraFeeDenomPicker";
import TransactionProgress from "../TransactionProgress";
import SendConfirmationDialog from "./SendConfirmationDialog";
import WaitingForWalletMessage from "./WaitingForWalletMessage";

const useStyles = makeStyles((theme) => ({
  transferField: {
    marginTop: theme.spacing(5),
  },
  alert: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  description: {
    // marginBottom: theme.spacing(4),
    textAlign: "left",
  },
  spacer: {
    height: theme.spacing(6),
  },
  cardcontrols: {
    padding: "20px",

  }
}));



function Send() {
  const classes = useStyles();
  const { handleClick, disabled, showLoader } = useHandleTransfer();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const handleTransferClick = useCallback(() => {
    setIsConfirmOpen(true);
  }, []);
  const handleConfirmClick = useCallback(() => {
    handleClick();
    setIsConfirmOpen(false);
  }, [handleClick]);
  const handleConfirmClose = useCallback(() => {
    setIsConfirmOpen(false);
  }, []);

  const sourceChain = useSelector(selectTransferSourceChain);
  const sourceAsset = useSelector(selectTransferSourceAsset);
  const sourceAmount = useSelector(selectTransferAmount);
  const sourceParsedTokenAccount = useSelector(
    selectTransferSourceParsedTokenAccount
  );
  const sourceDecimals = sourceParsedTokenAccount?.decimals;
  const sourceIsNative = sourceParsedTokenAccount?.isNativeAsset;
  const sourceAmountParsed =
    sourceDecimals !== undefined &&
    sourceDecimals !== null &&
    sourceAmount &&
    parseUnits(sourceAmount, sourceDecimals).toBigInt();
  const oneParsed =
    sourceDecimals !== undefined &&
    sourceDecimals !== null &&
    parseUnits("1", sourceDecimals).toBigInt();
  const transferTx = useSelector(selectTransferTransferTx);
  const isSendComplete = useSelector(selectTransferIsSendComplete);

  const error = useSelector(selectTransferTargetError);
  const [allowanceError, setAllowanceError] = useState("");
  const { isReady, statusMessage, walletAddress } =
    useIsWalletReady(sourceChain);
  const sourceWalletAddress = useSelector(selectSourceWalletAddress);
  //The chain ID compare is handled implicitly, as the isWalletReady hook should report !isReady if the wallet is on the wrong chain.
  const isWrongWallet =
    sourceWalletAddress &&
    walletAddress &&
    sourceWalletAddress !== walletAddress;
  const [shouldApproveUnlimited, setShouldApproveUnlimited] = useState(false);
  const toggleShouldApproveUnlimited = useCallback(
    () => setShouldApproveUnlimited(!shouldApproveUnlimited),
    [shouldApproveUnlimited]
  );

  const {
    sufficientAllowance,
    isAllowanceFetching,
    isApproveProcessing,
    approveAmount,
  } = useAllowance(
    sourceChain,
    sourceAsset,
    sourceAmountParsed || undefined,
    sourceIsNative
  );

  const approveButtonNeeded = isEVMChain(sourceChain) && !sufficientAllowance;
  const notOne = shouldApproveUnlimited || sourceAmountParsed !== oneParsed;
  const isDisabled =
    !isReady ||
    isWrongWallet ||
    disabled ||
    isAllowanceFetching ||
    isApproveProcessing;
  const errorMessage = isWrongWallet
    ? "A different wallet is connected than in Step 1."
    : statusMessage || error || allowanceError || undefined;

  const approveExactAmount = useMemo(() => {
    return () => {
      setAllowanceError("");
      approveAmount(BigInt(sourceAmountParsed)).then(
        () => {
          setAllowanceError("");
        },
        (error) => setAllowanceError("Failed to approve the token transfer.")
      );
    };
  }, [approveAmount, sourceAmountParsed]);
  const approveUnlimited = useMemo(() => {
    return () => {
      setAllowanceError("");
      approveAmount(ethers.constants.MaxUint256.toBigInt()).then(
        () => {
          setAllowanceError("");
        },
        (error) => setAllowanceError("Failed to approve the token transfer.")
      );
    };
  }, [approveAmount]);

  return (
    <>
      <div style={isMobile ? {} : { display: 'flex', justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <>
            {/* not connected */}
            <Typography variant="h4">
              Transfer<span style={{ color: COLORS.green, fontSize: "40px" }}>.</span>
            </Typography>
            <Typography className={classes.description}>
              <div>Initiate the transfer from Ethereum
                <br />to Solstice.
              </div>
            </Typography>
            <div className={classes.spacer}></div>
          </>
        </div>
        <Card className={classes.cardcontrols} style={isMobile ? {} : { width: "60%" }}>
          <StepDescription>
            Transfer the tokens to the Solstice Token Bridge.
          </StepDescription>
          <KeyAndBalance chainId={sourceChain} />
          {sourceChain === CHAIN_ID_TERRA && (
            <TerraFeeDenomPicker disabled={disabled} />
          )}
          <Alert severity="info" variant="outlined">
            This will initiate the transfer on {CHAINS_BY_ID[sourceChain].name} and
            wait for finalization. If you navigate away from this page before
            completing Step 4, you will have to perform the recovery workflow to
            complete the transfer.
          </Alert>
          {approveButtonNeeded ? (
            <>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={shouldApproveUnlimited}
                    onChange={toggleShouldApproveUnlimited}
                    color="primary"
                  />
                }
                label="Approve Unlimited Tokens"
              />
              <ButtonWithLoader
                disabled={isDisabled}
                onClick={
                  shouldApproveUnlimited ? approveUnlimited : approveExactAmount
                }
                showLoader={isAllowanceFetching || isApproveProcessing}
                error={errorMessage}
              >
                {"Approve " +
                  (shouldApproveUnlimited ? "Unlimited" : sourceAmount) +
                  ` Token${notOne ? "s" : ""}`}
              </ButtonWithLoader>
            </>
          ) : (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'end'
              }}>
                <ButtonWithLoader
                  disabled={isDisabled}
                  onClick={handleTransferClick}
                  showLoader={showLoader}
                  error={errorMessage}
                >
                  Transfer
                </ButtonWithLoader>
              </div>
              <SendConfirmationDialog
                open={isConfirmOpen}
                onClick={handleConfirmClick}
                onClose={handleConfirmClose}
              />
            </>
          )}
          <WaitingForWalletMessage />
          {transferTx ? <ShowTx chainId={sourceChain} tx={transferTx} /> : null}
          <TransactionProgress
            chainId={sourceChain}
            tx={transferTx}
            isSendComplete={isSendComplete}
          />
        </Card>
      </div>
    </>
  );
}

export default Send;
