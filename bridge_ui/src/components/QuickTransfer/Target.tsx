import {
  CHAIN_ID_SAFECOIN,
  CHAIN_ID_SOLANA,
  CHAIN_ID_TERRA,
  hexToNativeString,
  isEVMChain,
} from "@certusone/wormhole-sdk";
import { Card, makeStyles, Typography } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import useGetTargetParsedTokenAccounts from "../../hooks/useGetTargetParsedTokenAccounts";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import useSyncTargetAddress from "../../hooks/useSyncTargetAddress";
import { GasEstimateSummary } from "../../hooks/useTransactionFees";
import {
  selectTransferAmount,
  selectTransferIsTargetComplete,
  selectTransferShouldLockFields,
  selectTransferSourceChain,
  selectTransferTargetAddressHex,
  selectTransferTargetAsset,
  selectTransferTargetAssetWrapper,
  selectTransferTargetBalanceString,
  selectTransferTargetChain,
  selectTransferTargetError,
  selectTransferTargetParsedTokenAccount,
} from "../../store/selectors";
import { incrementStep, setTargetChain } from "../../store/transferSlice";
import { CHAINS, CHAINS_BY_ID } from "../../utils/consts";
import ButtonWithLoader from "../ButtonWithLoader";
import ChainSelect from "../ChainSelect";
import KeyAndBalance from "../KeyAndBalance";
import LowBalanceWarning from "../LowBalanceWarning";
import SmartAddress from "../SmartAddress";
import SafecoinCreateAssociatedAddress, {
  useAssociatedAccountExistsState as useAssociatedSafecoinAccountExistsState,
} from "../SafecoinCreateAssociatedAddress";
import SolanaCreateAssociatedAddress, {
  useAssociatedAccountExistsState as useAssociatedSolanaAccountExistsState,
} from "../SolanaCreateAssociatedAddress";
import StepDescription from "../StepDescription";
import RegisterNowButton from "./RegisterNowButton";
import { isMobile } from "react-device-detect";
import { COLORS } from "../../muiThemeLight";

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

export const useTargetInfo = () => {
  const targetChain = useSelector(selectTransferTargetChain);
  const targetAddressHex = useSelector(selectTransferTargetAddressHex);
  const targetAsset = useSelector(selectTransferTargetAsset);
  const targetParsedTokenAccount = useSelector(
    selectTransferTargetParsedTokenAccount
  );
  const tokenName = targetParsedTokenAccount?.name;
  const symbol = targetParsedTokenAccount?.symbol;
  const logo = targetParsedTokenAccount?.logo;
  const readableTargetAddress =
    hexToNativeString(targetAddressHex, targetChain) || "";
  return useMemo(
    () => ({
      targetChain,
      targetAsset,
      tokenName,
      symbol,
      logo,
      readableTargetAddress,
    }),
    [targetChain, targetAsset, tokenName, symbol, logo, readableTargetAddress]
  );
};

function Target() {
  useGetTargetParsedTokenAccounts();
  const classes = useStyles();
  const dispatch = useDispatch();
  const sourceChain = useSelector(selectTransferSourceChain);
  const chains = useMemo(
    () => CHAINS.filter((c) => c.id !== sourceChain),
    [sourceChain]
  );
  const { error: targetAssetError, data } = useSelector(
    selectTransferTargetAssetWrapper
  );
  const {
    targetChain,
    targetAsset,
    tokenName,
    symbol,
    logo,
    readableTargetAddress,
  } = useTargetInfo();
  const uiAmountString = useSelector(selectTransferTargetBalanceString);
  const transferAmount = useSelector(selectTransferAmount);
  const error = useSelector(selectTransferTargetError);
  const isTargetComplete = useSelector(selectTransferIsTargetComplete);
  const shouldLockFields = useSelector(selectTransferShouldLockFields);
  const { statusMessage } = useIsWalletReady(targetChain);
  const isLoading = !statusMessage && !targetAssetError && !data;
  const { associatedAccountExists: associatedSafecoinAccountExists, setAssociatedAccountExists: setAssociatedSafecoinAccountExists } =
    useAssociatedSafecoinAccountExistsState(
      targetChain,
      targetAsset,
      readableTargetAddress
    );
  const { associatedAccountExists: associatedSolanaAccountExists, setAssociatedAccountExists: setAssociatedSolanaAccountExists } =
    useAssociatedSolanaAccountExistsState(
      targetChain,
      targetAsset,
      readableTargetAddress
    );
  useSyncTargetAddress(!shouldLockFields);
  const handleTargetChange = useCallback(
    (event) => {
      dispatch(setTargetChain(event.target.value));
    },
    [dispatch]
  );
  const handleNextClick = useCallback(() => {
    dispatch(incrementStep());
  }, [dispatch]);
  return (
    <>
      <div className={classes.spacer}></div>
      <div style={isMobile ? {} : { display: 'flex', justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <>
            {/* not connected */}
            <Typography variant="h4">
              Get started<span style={{ color: COLORS.green, fontSize: "40px" }}>.</span>
            </Typography>
            <Typography className={classes.description}>
              <div>Connect your Ethereum wallet
                <br />and select your POWR.
              </div>
            </Typography>
            <div className={classes.spacer}></div>
          </>
        </div>
        <Card className={classes.cardcontrols} style={isMobile ? {} : { width: "60%" }}>
          <StepDescription>Select a recipient chain and address.</StepDescription>
          <ChainSelect
            variant="outlined"
            select
            fullWidth
            value={targetChain}
            onChange={handleTargetChange}
            disabled={true}
            chains={chains}
          />
          <div>
          <KeyAndBalance chainId={targetChain} />
          </div>
          {readableTargetAddress ? (
            <>
              {targetAsset ? (
                <div className={classes.transferField}>
                  <Typography variant="subtitle2">Bridged tokens:</Typography>
                  <Typography component="div">
                    <SmartAddress
                      chainId={targetChain}
                      address={targetAsset}
                      symbol={symbol}
                      tokenName={tokenName}
                      logo={logo}
                      variant="h6"
                    />
                    {`(Amount: ${transferAmount})`}
                  </Typography>
                </div>
              ) : null}
              <div className={classes.transferField}>
                <Typography variant="subtitle2">Sent to:</Typography>
                <Typography component="div">
                  <SmartAddress
                    chainId={targetChain}
                    address={readableTargetAddress}
                    variant="h6"
                  />
                  {`(Current balance: ${uiAmountString || "0"})`}
                </Typography>
              </div>
            </>
          ) : null}
          {targetChain === CHAIN_ID_SAFECOIN && targetAsset ? (
            <SafecoinCreateAssociatedAddress
              mintAddress={targetAsset}
              readableTargetAddress={readableTargetAddress}
              associatedAccountExists={associatedSafecoinAccountExists}
              setAssociatedAccountExists={setAssociatedSafecoinAccountExists}
            />
          ) : targetChain === CHAIN_ID_SOLANA && targetAsset ? (
            <SolanaCreateAssociatedAddress
              mintAddress={targetAsset}
              readableTargetAddress={readableTargetAddress}
              associatedAccountExists={associatedSolanaAccountExists}
              setAssociatedAccountExists={setAssociatedSolanaAccountExists}
            />
          ) : null}
          <Alert severity="info" variant="outlined" className={classes.alert}>
            <Typography>
              You will have to pay transaction fees on{" "}
              {CHAINS_BY_ID[targetChain].name} to redeem your tokens.
            </Typography>
            {(isEVMChain(targetChain) || targetChain === CHAIN_ID_TERRA) && (
              <GasEstimateSummary methodType="transfer" chainId={targetChain} />
            )}
          </Alert>
          <LowBalanceWarning chainId={targetChain} />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'end'
          }}>
            <ButtonWithLoader
              disabled={!isTargetComplete || !associatedSafecoinAccountExists || !associatedSolanaAccountExists}
              onClick={handleNextClick}
              showLoader={isLoading}
              error={
                statusMessage || (isLoading ? undefined : error || targetAssetError)
              }
            >
              Next
            </ButtonWithLoader>
            {!statusMessage && data && !data.doesExist ? <RegisterNowButton /> : null}
          </div>
        </Card>
      </div>
    </>
  );
}

export default Target;
