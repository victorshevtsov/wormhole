import {
  Container,
  createStyles,
  makeStyles,
  Paper,
  Step,
  StepButton,
  StepConnector,
  StepContent,
  StepIconProps,
  StepLabel,
  Stepper,
  styled,
  Theme,
  withStyles,

} from "@material-ui/core";
import { Settings, GroupAdd, VideoLabel, Filter1  } from "@material-ui/icons";
import * as React from 'react';
import { Check } from "@material-ui/icons";
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
import clsx from "clsx";
import safeErc20Icon from "../../icons/safe-erc20.svg";

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

  const useQontoStepIconStyles = makeStyles({
    root: {
      color: '#eaeaf0',
      display: 'flex',
      height: 22,
      alignItems: 'center',
    },
    active: {
      color: '#784af4',
    },
    circle: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      backgroundColor: 'currentColor',
    },
    completed: {
      color: '#784af4',
      zIndex: 1,
      fontSize: 18,
    },
  });

  const ColorlibConnector = withStyles({
    alternativeLabel: {
      top: 39,
      marginLeft: "10%",
      marginRight: "10%",
    },
    active: {
      '& $line': {
        backgroundImage:
          'linear-gradient( 95deg,rgb(242,113,33) 0%,rgb(233,64,87) 50%,rgb(138,35,135) 100%)',
      },
    },
    completed: {
      '& $line': {
        backgroundImage:
          'linear-gradient( 95deg,rgb(242,113,33) 0%,rgb(233,64,87) 50%,rgb(138,35,135) 100%)',
      },
    },
    line: {
      height: 3,
      border: 0,
      backgroundColor: '#8f8f8f73',
      borderRadius: 1,
    },
  })(StepConnector);




  const useColorlibStepIconStyles = makeStyles({
    root: {
      backgroundColor: '#8f8f8f',
      zIndex: 1,
      color: '#fff',
      width: 50,
      height: 50,
      display: 'flex',
      borderRadius: '50%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    active: {
      backgroundImage:
        'linear-gradient( 136deg, rgb(100 254 210) 0%, rgb(64 147 181) 50%, rgb(46 117 146) 100%)',
      boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
    },
    completed: {
      backgroundImage:
        'linear-gradient( 136deg, rgb(242,113,33) 0%, rgb(233,64,87) 50%, rgb(138,35,135) 100%)',
    },
  });

  function ColorlibStepIcon(props: StepIconProps) {
    const classes = useColorlibStepIconStyles();
    const { active, completed } = props;

    const icons: { [index: string]: React.ReactElement } = {
      1: <img style={{width: "60%"}} src={safeErc20Icon} alt="SAFE ERC20" />,
      2: <img alt="SAFE NATIVE" />,
      3: <img alt="SEND TOKENS" />,
      4: <img alt="REDEEM UNWRAP" />,
    };

    return (
      <div
        className={clsx(classes.root, {
          [classes.active]: active,
          [classes.completed]: completed,
        })}
      >
        {icons[String(props.icon)]}
      </div>
    );
  }

  const useStyles = makeStyles((theme: Theme) =>
    createStyles({
      root: {
        width: '100%',
      },
      button: {
        marginRight: theme.spacing(1),
      },
      instructions: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
      },
    }),
  );


  const classes = useStyles();

  const useStepsStyle = makeStyles({
    root: {
      backgroundColor: 'inherit',

    },
  });

  const clstep = useStepsStyle();

  //const [activeStep, setActiveStep] = React.useState(1);

  /*const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };
*/
  return (
    <>
      <Container maxWidth="md">
        <div className={classes.root}>
          <Stepper  activeStep={activeStep} orientation="horizontal" connector={<ColorlibConnector />} alternativeLabel>
            {/* Pre select with disabled dropdown ethereum */}
            <Step className={clstep.root}
              expanded={activeStep >= 0}
              disabled={preventNavigation || isRedeemComplete}
            >
              <StepButton onClick={() => dispatch(setStep(0))}>
                <StepLabel StepIconComponent={ColorlibStepIcon}>Source</StepLabel>
              </StepButton>
              {/*<StepButton onClick={() => dispatch(setStep(0))}>Source</StepButton>*/}
            </Step>
            <Step className={clstep.root}
              expanded={activeStep >= 1}
              disabled={preventNavigation || isRedeemComplete || activeStep === 0}
            >
              <StepButton onClick={() => dispatch(setStep(1))}>
                <StepLabel StepIconComponent={ColorlibStepIcon}>Target</StepLabel>
              </StepButton>
              {/*<StepButton onClick={() => dispatch(setStep(0))}>Source</StepButton>*/}
            </Step>
            <Step className={clstep.root} expanded={activeStep >= 2} disabled={isSendComplete}>
              <StepButton>
                <StepLabel StepIconComponent={ColorlibStepIcon}>Send tokens</StepLabel>
              </StepButton>
            </Step>
            <Step className={clstep.root} expanded={activeStep >= 3}>
              <StepButton  
                onClick={() => dispatch(setStep(3))}
                disabled={!isSendComplete}
                >
                <StepLabel StepIconComponent={ColorlibStepIcon}>Redeem tokens</StepLabel>
              </StepButton>
            </Step>
          </Stepper>
        </div>
      </Container>
      <Container maxWidth="md">
        <Paper elevation={5}  style={{ padding: "40px"}}>
          {activeStep === 0 ? <Source /> : <></>}
          {activeStep === 1 ? <Target /> : <></>}
          {activeStep === 2 ? <Send /> : <></>}
          {isRedeemComplete ? <RedeemPreview /> : <></>}
          {/*
          {activeStep === 0 ? <Source /> : <SourcePreview />}
          {activeStep === 1 ? <Target /> : <TargetPreview />}
          {activeStep === 2 ? <Send /> : <SendPreview />}
          {isRedeemComplete ? <RedeemPreview /> : <Redeem />}
        */}
        </Paper>
      </Container>
    </>
  );
}

export default QuickTransfer;
