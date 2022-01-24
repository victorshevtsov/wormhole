import { CHAIN_ID_SOLANA, isEVMChain } from "@certusone/wormhole-sdk";
import { Button, makeStyles } from "@material-ui/core";
import { VerifiedUser } from "@material-ui/icons";
import { Alert } from "@material-ui/lab";
import { useCallback } from "react";
import { isMobile } from "react-device-detect";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import { incrementStep, setSourceChain } from "../../store/nftSlice";
import {
  selectNFTIsSourceComplete,
  selectNFTShouldLockFields,
  selectNFTSourceBalanceString,
  selectNFTSourceChain,
  selectNFTSourceError,
} from "../../store/selectors";
import { CHAINS_WITH_NFT_SUPPORT } from "../../utils/consts";
import ButtonWithLoader from "../ButtonWithLoader";
import ChainSelect from "../ChainSelect";
import KeyAndBalance from "../KeyAndBalance";
import LowBalanceWarning from "../LowBalanceWarning";
import StepDescription from "../StepDescription";
import { TokenSelector } from "../TokenSelectors/SourceTokenSelector";

const useStyles = makeStyles((theme) => ({
  transferField: {
    marginTop: theme.spacing(5),
  },
}));

function Source() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const sourceChain = useSelector(selectNFTSourceChain);
  const uiAmountString = useSelector(selectNFTSourceBalanceString);
  const error = useSelector(selectNFTSourceError);
  const isSourceComplete = useSelector(selectNFTIsSourceComplete);
  const shouldLockFields = useSelector(selectNFTShouldLockFields);
  const { isReady, statusMessage } = useIsWalletReady(sourceChain);
  const handleSourceChange = useCallback(
    (event) => {
      dispatch(setSourceChain(event.target.value));
    },
    [dispatch]
  );
  const handleNextClick = useCallback(() => {
    dispatch(incrementStep());
  }, [dispatch]);
  return (
    <>
      <StepDescription>
        <div style={{ display: "flex", alignItems: "center" }}>
          Select an NFT to send through the Wormhole NFT Bridge.
          <div style={{ flexGrow: 1 }} />
          <div>
            <Button
              component={Link}
              to="/nft-origin-verifier"
              size="small"
              variant="outlined"
              endIcon={<VerifiedUser />}
            >
              NFT Origin Verifier
            </Button>
          </div>
        </div>
      </StepDescription>
      <ChainSelect
        variant="outlined"
        select
        fullWidth
        value={sourceChain}
        onChange={handleSourceChange}
        disabled={shouldLockFields}
        chains={CHAINS_WITH_NFT_SUPPORT}
      />
      {isEVMChain(sourceChain) ? (
        <Alert severity="info" variant="outlined">
          Only NFTs which implement ERC-721 are supported.
        </Alert>
      ) : null}
      {sourceChain === CHAIN_ID_SOLANA ? (
        <Alert severity="info" >
          Only NFTs with a supply of 1 are supported.
        </Alert>
      ) : null}
      <div style={isMobile ? {} : { display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginRight: "auto" }}>
          <KeyAndBalance chainId={sourceChain} />
        </div>
        {isReady || uiAmountString ? (
          <div className={classes.transferField}>
            <TokenSelector disabled={shouldLockFields} nft={true} />
          </div>
        ) : null}
        <LowBalanceWarning chainId={sourceChain} />
        <div style={isMobile ? {} : { maxWidth: "120px", float: "right", marginTop: "25px", marginLeft: "auto" }}>
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
  );
}

export default Source;
