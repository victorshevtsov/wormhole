import {
  Button,
  Card,
  Chip,
  Container,
  Link,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { Link as RouterLink } from "react-router-dom";
import { COLORS } from "../../muiThemeLight";
import { BETA_CHAINS, CHAINS, COMING_SOON_CHAINS } from "../../utils/consts";
import HeaderText from "../HeaderText";

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
    color: "#212B36",
  },
  description: {
    textAlign: "center",
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
  gradientButton: {
    //backgroundImage: `linear-gradient(45deg, ${COLORS.blue} 0%, ${COLORS.nearWhite}20 50%,  ${COLORS.blue}30 62%, ${COLORS.nearWhite}50  120%)`,
    transition: "0.75s",
    backgroundSize: "200% auto",
    textAlign: "center",
    borderColor: "#ffffffde",
    color:"#ffffffde",
    /*boxShadow: "0 0 20px #222",*/
    "&:hover": {
      borderColor: "#ffffff",
      color:"#ffffff",
    },
  },
  hspacer: {
    width: theme.spacing(5),
  },
}));

function Home() {
  const classes = useStyles();
  return (
    <div>
      {/*<Container maxWidth="md">
        <div className={classes.header}>
          <HeaderText>The Portal is Open</HeaderText>
        </div>
  </Container>*/}

      <Container maxWidth="md">
        <div className={classes.header}>
          <Typography variant="h2" className={classes.title}>
            Cross-chain <span style={{ color: COLORS.blue }}>interaction</span><span style={{ color: COLORS.green }}>.</span>
          </Typography>
        </div>
      </Container>
      <Container maxWidth="md">
        <div className={classes.chainList}>
          {CHAINS.filter(({ id }) => !BETA_CHAINS.includes(id)).map((chain) => (
            <div key={chain.id} className={classes.chainCard}>
              <div className={classes.chainLogoWrapper}>
                <img
                  src={chain.logo}
                  alt={chain.name}
                  className={classes.chainLogo}
                />
              </div>
              <Typography
                variant="body2"
                component="div"
                className={classes.chainName}
              >
                <div>{chain.name}</div>
              </Typography>
            </div>
          ))}
          {COMING_SOON_CHAINS.map((item) => (
            <div className={classes.chainCard}>
              <div className={classes.chainLogoWrapper}>
                <img
                  src={item.logo}
                  alt={item.name}
                  className={classes.chainLogo}
                />
                <Chip
                  label="Coming soon"
                  size="small"
                  className={classes.chip}
                />
              </div>
              <Typography
                variant="body2"
                component="div"
                className={classes.chainName}
              >
                <div>{item.name}</div>
              </Typography>
            </div>
          ))}
        </div>
      </Container>
      <Container maxWidth="md">
        <div className={classes.spacer} />
        {/*<div className={classes.spacer} />*/}
        <Typography variant="h5" className={classes.description}>
          Converts your Safe ERC20 tokens to SPL, <span style={{ color: COLORS.blue }}>seamlessly</span><span style={{ color: COLORS.green }}>.</span>
          Transfering assets through different chains has never been so easy.
        </Typography>
        <div className={classes.spacer} />
      </Container>
      <Container maxWidth="md">
        <div style={{ textAlign: "center", display: "flex", justifyContent: "center" }}>
          <Button
            component={RouterLink}
            to="/quicktransfer"
            variant="outlined"
            color="primary"
            size="large"
            disableElevation={true}
            className={classes.gradientButton}
          >
            Convert now
          </Button>
          <div className={classes.hspacer} />
        </div>
      </Container>
    </div>
  );
}

export default Home;
