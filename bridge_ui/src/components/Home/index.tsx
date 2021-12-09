import {
  Button,
  Container,
  Link,
  makeStyles,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { HelpOutline } from "@material-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import { COLORS } from "../../muiThemeLight";
import { BETA_CHAINS, CHAINS } from "../../utils/consts";

const useStyles = makeStyles((theme) => ({
  header: {
    textAlign: "center",
    marginTop: theme.spacing(18),
    marginBottom: theme.spacing(3),
    [theme.breakpoints.down("sm")]: {
      marginBottom: theme.spacing(6),
    },
  },
  title: {
    marginBottom: theme.spacing(2),
  },
  description: {
    marginBottom: theme.spacing(4),
    textAlign: "center",
  },
  button: {
    marginBottom: theme.spacing(4),
  },
  overview: {
    marginTop: theme.spacing(6),
    [theme.breakpoints.down("sm")]: {
      marginTop: theme.spacing(2),
    },
    maxWidth: "100%",
  },
  mainCard: {
    padding: theme.spacing(8),
    backgroundColor: COLORS.nearWhiteWithMinorTransparency,
  },
  spacer: {
    height: theme.spacing(5),
  },
  hspacer: {
    width: theme.spacing(5),
  },
  gradientButton: {
    backgroundImage: `linear-gradient(45deg, ${COLORS.blue} 0%, ${COLORS.nearWhite}20 50%,  ${COLORS.blue}30 62%, ${COLORS.nearWhite}50  120%)`,
    transition: "0.75s",
    backgroundSize: "200% auto",
    textAlign: "center",
    /*boxShadow: "0 0 20px #222",
    "&:hover": {
      backgroundPosition:
        "right center",
    },*/
  },
  chainLogo: {
    height: 64,
    maxWidth: 64,
  },
  chainName: {
    marginTop: theme.spacing(1),
    flex: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    minHeight: 40, // 2 lines
  },
  chip: {
    backgroundColor: COLORS.blueWithTransparency,
    position: "absolute",
    top: "50%",
    right: "50%",
    transform: "translate(50%, -50%)",
  },
}));

function Home() {
  const classes = useStyles();
  return (
    <div>
      <Container maxWidth="md">
        <div className={classes.header}>
          <Typography variant="h2" className={classes.title}>
            Converts your Safe ERC20 tokens to SPL, <span style={{ color: COLORS.blue }}>seamlessly</span><span style={{ color: COLORS.green }}>.</span>
          </Typography>
        </div>
      </Container>
      <Container maxWidth="md">
        {/*<div className={classes.spacer} />*/}
        <Typography variant="h5" className={classes.description}>
          If you transferred assets using the previous version of Wormhole,
          most assets can be migrated to v2 on the{" "}
          <Link component={RouterLink} to="/transfer" noWrap>
            transfer page
          </Link>
          .
        </Typography>
      </Container>
      <Container maxWidth="md">
        <div style={{ textAlign: "center", display: "flex", justifyContent: "center" }}>
          <Button
            component={RouterLink}
            to="/quicktransfer"
            variant="contained"
            color="primary"
            size="large"
            className={classes.gradientButton}
          >
            Convert now
          </Button>
          <div className={classes.hspacer} />
          <Tooltip title="Advanced bridge">
            <Button
              component={RouterLink}
              to="/transfer"
              variant="outlined"
              endIcon={<HelpOutline />}
            >
              Advanced
            </Button>
          </Tooltip>
        </div>
      </Container>
    </div>
  );
}

export default Home;
