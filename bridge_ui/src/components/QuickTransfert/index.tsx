import {
  Container,
  Step,
  StepButton,
  StepContent,
  Stepper,
} from "@material-ui/core";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import useCheckIfWormholeWrapped from "../../hooks/useCheckIfWormholeWrapped";
import useFetchTargetAsset from "../../hooks/useFetchTargetAsset";
import {
  selectTransferActiveStep,
  selectTransferIsRedeemComplete,
  selectTransferIsRedeeming,
  selectTransferIsSendComplete,
  selectTransferIsSending,
} from "../../store/selectors";
import { setStep } from "../../store/transferSlice";
import Redeem from "./Redeem";
import RedeemPreview from "./RedeemPreview";
import Send from "./Send";
import SendPreview from "./SendPreview";
import Source from "./Source";
import SourcePreview from "./SourcePreview";
import Target from "./Target";
import TargetPreview from "./TargetPreview";

function QuickTransfer() {
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
  useEffect(() => {
    if (preventNavigation) {
      window.onbeforeunload = () => true;
      return () => {
        window.onbeforeunload = null;
      };
    }
  }, [preventNavigation]);


  return (
    <Container maxWidth="md">
      <Stepper activeStep={activeStep} orientation="horizontal">
        <Step
          expanded={activeStep >= 0}
          disabled={preventNavigation || isRedeemComplete}
        >
          <StepButton onClick={() => dispatch(setStep(0))}>Source</StepButton>
        </Step>
        <Step
          expanded={activeStep >= 1}
          disabled={preventNavigation || isRedeemComplete}
        >
          <StepButton
            disabled={preventNavigation || isRedeemComplete || activeStep === 0}
            onClick={() => dispatch(setStep(1))}
          >
            Target
          </StepButton>
        </Step>
        <Step expanded={activeStep >= 2} disabled={isSendComplete}>
          <StepButton disabled>Send tokens</StepButton>
        </Step>
        <Step expanded={activeStep >= 3}>
          <StepButton
            onClick={() => dispatch(setStep(3))}
            disabled={!isSendComplete}
          >
            Redeem tokens
          </StepButton>
        </Step>
      </Stepper>
      <div>
        {activeStep === 0 ? <Source /> : <SourcePreview />}
        {activeStep === 1 ? <Target /> : <TargetPreview />}
        {activeStep === 2 ? <Send /> : <SendPreview />}
        {isRedeemComplete ? <RedeemPreview /> : <Redeem />}
      </div>
    </Container>
  );
}

export default QuickTransfer;
