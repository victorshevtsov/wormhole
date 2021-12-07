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
import HeaderText from "../HeaderText";

const useStyles = makeStyles((theme) => ({
  header: {
    marginTop: theme.spacing(12),
    marginBottom: theme.spacing(8),
    [theme.breakpoints.down("sm")]: {
      marginBottom: theme.spacing(6),
    },
  },
  description: {
    marginBottom: theme.spacing(2),
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
  chainList: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    margin: theme.spacing(-1, -1, 8),
    [theme.breakpoints.down("sm")]: {
      margin: theme.spacing(-1, -1, 6),
    },
  },
  chainCard: {
    backgroundColor: COLORS.nearBlackWithMinorTransparency,
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
    margin: theme.spacing(1),
    minHeight: "100%",
    padding: theme.spacing(2),
    width: 149, // makes it square
    maxWidth: 149,
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(1.5),
      width: 141, // keeps it square
      maxWidth: 141,
    },
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
      <Typography variant="h2" className={classes.description}>
        Converts your Safe ERC20 to SPL, seamlessly
      </Typography>
      </Container>
      <Container maxWidth="md">
    
          <Typography variant="h6" className={classes.description}>
            Converts your Safe ERC20 to SPL.
          </Typography>
          <div className={classes.spacer} />
          <Typography variant="subtitle1" className={classes.description}>
            If you transferred assets using the previous version of Wormhole,
            most assets can be migrated to v2 on the{" "}
            <Link component={RouterLink} to="/transfer" noWrap>
              transfer page
            </Link>
            .
          </Typography>
          <Typography variant="subtitle1" className={classes.description}>
            For assets that don't support the migration, the v1 UI can be found
            at{" "}
            <Link href="https://v1.wormholebridge.com">
              v1.wormholebridge.com
            </Link>
          </Typography>
      </Container>
    </div>
  );
}

export default Home;
