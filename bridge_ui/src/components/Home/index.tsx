import {
  Card,
  Container,
  Link,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { Link as RouterLink } from "react-router-dom";
import { COLORS } from "../../muiThemeLight";
import { BETA_CHAINS, CHAINS } from "../../utils/consts";

const useStyles = makeStyles((theme) => ({
  header: {
    textAlign: "center",
    marginTop: theme.spacing(12),
    marginBottom: theme.spacing(8),
    [theme.breakpoints.down("sm")]: {
      marginBottom: theme.spacing(6),
    },
  },
  title: {
    marginBottom: theme.spacing(2),
  },
  description: {
    marginBottom: theme.spacing(2),
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
    backgroundColor: COLORS.nearBlackWithMinorTransparency,
  },
  spacer: {
    height: theme.spacing(5),
  },
  chainLogoWrapper: {
    position: "relative",
    textAlign: "center",
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
            Converts your Safe ERC20 to SPL, seamlessly
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
          <Typography variant="subtitle1" className={classes.description}>
          Lorem Ipsum is simply dummy text of the printing and typesetting industry. {" "}
            <Link href="https://v1.wormholebridge.com">
              safe.trade
            </Link>
          </Typography>
      </Container>
    </div>
  );
}

export default Home;
