import { ChainId } from "@certusone/wormhole-sdk";
import {
  Container,
  makeStyles,
  Step,
  StepButton,
  StepContent,
  StepLabel,
  Stepper,
} from "@material-ui/core";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import useCheckIfWormholeWrapped from "../../hooks/useCheckIfWormholeWrapped";
import useFetchTargetAsset from "../../hooks/useFetchTargetAsset";
import {
  selectTransferActiveStep,
  selectTransferIsRedeemComplete,
  selectTransferIsRedeeming,
  selectTransferIsSendComplete,
  selectTransferIsSending,
} from "../../store/selectors";
import {
  setSourceChain,
  setStep,
  setTargetChain,
} from "../../store/transferSlice";
import { CHAINS_BY_ID } from "../../utils/consts";
import Redeem from "./Redeem";
import RedeemPreview from "./RedeemPreview";
import Send from "./Send";
import SendPreview from "./SendPreview";
import Source from "./Source";
import SourcePreview from "./SourcePreview";
import Target from "./Target";
import TargetPreview from "./TargetPreview";

const useStyles = makeStyles((theme) => ({
  cardstyle: {
    boxShadow:
      '-16px 16px 56px -8px rgba(145,158,171,0.18)', // 24th value
  },
  steptitle: {
    "&.MuiStepLabel-active": {
      fontWeight: 500,
    },
    "&.Mui-disabled": {
      opacity: '0.5',
      color:'red',
    },

    fontWeight: 500,
    fontSize: 21,
    color: "#484848",
  },
}));

function Transfer() {
  useCheckIfWormholeWrapped();
  useFetchTargetAsset();
  const dispatch = useDispatch();
  const activeStep = useSelector(selectTransferActiveStep);
  const isSending = useSelector(selectTransferIsSending);
  const isSendComplete = useSelector(selectTransferIsSendComplete);
  const isRedeeming = useSelector(selectTransferIsRedeeming);
  const isRedeemComplete = useSelector(selectTransferIsRedeemComplete);
  const preventNavigation =
    (isSending || isSendComplete || isRedeeming) && !isRedeemComplete;

  const { search } = useLocation();
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const pathSourceChain = query.get("sourceChain");
  const pathTargetChain = query.get("targetChain");

  //This effect initializes the state based on the path params
  useEffect(() => {
    if (!pathSourceChain && !pathTargetChain) {
      return;
    }
    try {
      const sourceChain: ChainId =
        CHAINS_BY_ID[parseFloat(pathSourceChain || "") as ChainId]?.id;
      const targetChain: ChainId =
        CHAINS_BY_ID[parseFloat(pathTargetChain || "") as ChainId]?.id;

      if (sourceChain === targetChain) {
        return;
      }
      if (sourceChain) {
        dispatch(setSourceChain(sourceChain));
      }
      if (targetChain) {
        dispatch(setTargetChain(targetChain));
      }
    } catch (e) {
      console.error("Invalid path params specified.");
    }
  }, [pathSourceChain, pathTargetChain, dispatch]);

  useEffect(() => {
    if (preventNavigation) {
      window.onbeforeunload = () => true;
      return () => {
        window.onbeforeunload = null;
      };
    }
  }, [preventNavigation]);



  const classes = useStyles();
  return (
    <Container maxWidth="md">
      <Stepper activeStep={activeStep} orientation="vertical">
        <Step className={classes.cardstyle}
          expanded={activeStep >= 0}
          disabled={preventNavigation || isRedeemComplete}
        >
          <StepButton style={{ marginTop: '8px' }} onClick={() => dispatch(setStep(0))}>
            <StepLabel
              classes={{ label: classes.steptitle }}>Source</StepLabel>
          </StepButton>
          <StepContent>
            <div style={{ paddingRight: '15px', marginTop: '20px' }}>
              {activeStep === 0 ? <Source /> : <SourcePreview />}
            </div>
          </StepContent>
        </Step>
        <Step className={classes.cardstyle}
          expanded={activeStep >= 1}
          disabled={preventNavigation || isRedeemComplete}
        >
          <StepButton style={{ marginTop: '8px' }}
            disabled={preventNavigation || isRedeemComplete || activeStep === 0}
            onClick={() => dispatch(setStep(1))}
          >
            <StepLabel
              classes={{ label: classes.steptitle }}>Target
            </StepLabel>

          </StepButton>
          <StepContent>
            {activeStep === 1 ? <Target /> : <TargetPreview />}
          </StepContent>
        </Step>
        <Step className={classes.cardstyle} expanded={activeStep >= 2} disabled={isSendComplete}>
          <StepButton style={{ marginTop: '8px' }} disabled>
            <StepLabel
              classes={{ label: classes.steptitle }}>Send tokens
            </StepLabel>
          </StepButton>
          <StepContent>
            {activeStep === 2 ? <Send /> : <SendPreview />}
          </StepContent>
        </Step>
        <Step className={classes.cardstyle} expanded={activeStep >= 3} completed={isRedeemComplete}>
          <StepButton
            style={{ marginTop: '8px' }}
            onClick={() => dispatch(setStep(3))}
            disabled={!isSendComplete || isRedeemComplete}
          >
            <StepLabel
              classes={{ label: classes.steptitle }}>Redeem tokens
            </StepLabel>

          </StepButton>
          <StepContent>
            {isRedeemComplete ? <RedeemPreview /> : <Redeem />}
          </StepContent>
        </Step>
      </Stepper>
    </Container>
  );
}

export default Transfer;
