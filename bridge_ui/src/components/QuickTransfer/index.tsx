import { ChainId } from "@certusone/wormhole-sdk";
import {
  Button,
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
  Theme,
  withStyles,
} from "@material-ui/core";
import clsx from "clsx";
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

  const { search } = useLocation();
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const pathSourceChain = query.get("sourceChain");
  const pathTargetChain = query.get("targetChain");


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
          'linear-gradient(  95deg,rgb(39 103 129) 0%,rgb(58 137 170) 50%,rgb(87 215 200) 100%)',
      },
    },
    completed: {
      '& $line': {
        backgroundImage:
          'linear-gradient(  95deg,rgb(39 103 129) 0%,rgb(39 103 129) 50%,rgb(39 103 129) 100%)',
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
        'linear-gradient(  136deg, rgb(58 136 167) 0%, rgb(45 120 151) 50%, rgb(35 93 116) 100%)',
    },
  });

  function ColorlibStepIcon(props: StepIconProps) {
    const classes = useColorlibStepIconStyles();
    const { active, completed } = props;

    const icons: { [index: string]: React.ReactElement } = {
      1: <div>1</div>,
      2: <div>2</div>,
      3: <div>3</div>,
      4: <div>4</div>,
      5: <div>5</div>,
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
      preview: {
        border: "2px dashed rgba(145, 158, 171, 0.24)",
        borderRadius: "10px",
        marginTop: theme.spacing(8),
        marginBottom: theme.spacing(1),
        padding: theme.spacing(2)
      },
      button: {
        marginRight: theme.spacing(1),
      },
      spacer: {
        height: theme.spacing(3),
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
  return (
    <>
      <div>
        <Button
          size="small"
          variant="outlined"
          /*onClick={() => dispatch(setStep(4))}*/
        >
          swap
        </Button>
      </div>
      <Container maxWidth="md">
        <div className={classes.root}>
          <Stepper activeStep={activeStep} orientation="horizontal" connector={<ColorlibConnector />} alternativeLabel>
            {/* Pre select with disabled dropdown ethereum */}
            <Step className={clstep.root}
              expanded={activeStep >= 0}
              disabled={preventNavigation || isRedeemComplete}
            >
              <StepButton onClick={() => dispatch(setStep(0))}>
                <StepLabel StepIconComponent={ColorlibStepIcon}><b>POWR </b>Source</StepLabel>
              </StepButton>
              {/*<StepButton onClick={() => dispatch(setStep(0))}>Source</StepButton>*/}
            </Step>
            <Step className={clstep.root}
              expanded={activeStep >= 1}
              disabled={preventNavigation || isRedeemComplete || activeStep === 0}
            >
              <StepButton onClick={() => dispatch(setStep(1))}>
                <StepLabel StepIconComponent={ColorlibStepIcon}><b>SOLSTICE </b>Target</StepLabel>
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
            <Step className={clstep.root} expanded={activeStep >= 4}>
              <StepButton
                /*onClick={() => dispatch(setStep(4))}*/
              >
                <StepLabel StepIconComponent={ColorlibStepIcon}>Swap</StepLabel>
              </StepButton>
            </Step>
          </Stepper>
        </div>
      </Container>
      <div className={classes.spacer}></div>
      <Container maxWidth="md">
        <Paper elevation={5} style={{ display: "none" }}>


          {/*
          {activeStep === 0 ? <Source /> : <SourcePreview />}
          {activeStep === 1 ? <Target /> : <TargetPreview />}
          {activeStep === 2 ? <Send /> : <SendPreview />}
          {isRedeemComplete ? <RedeemPreview /> : <Redeem />}
        */}
        </Paper>
        {activeStep === 0 ? <Source /> : <></>}
        {activeStep === 1 ? <Target /> : <></>}
        {activeStep === 2 ? <Send /> : <></>}
        {isRedeemComplete ? <RedeemPreview /> : <></>}
        {/*activeStep === 4 ? <Swap /> : <></>*/}
        <div className={activeStep === 0 ? classes.preview : classes.preview} >
          {activeStep === 0 ? <SourcePreview /> : <></>}
          {activeStep === 1 ? <TargetPreview /> : <></>}
          {activeStep === 2 ? <SendPreview /> : <></>}
          {isRedeemComplete ? <RedeemPreview /> : <></>}
        </div>
      </Container>
    </>
  );
}

export default QuickTransfer;
