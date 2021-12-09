import { IconButton, makeStyles, Typography } from "@material-ui/core";
import Discord from "../icons/Discord.svg";
import Github from "../icons/Github.svg";
import Medium from "../icons/Medium.svg";
import Telegram from "../icons/Telegram.svg";
import Twitter from "../icons/Twitter.svg";
import sPortal from "../icons/sportal.svg";
const useStyles = makeStyles((theme) => ({
  footer: {
    margin: theme.spacing(2, 0, 2),
    textAlign: "center",
  },
  socialIcon: {
    "& img": {
      height: 24,
      width: 24,
    },
  },
  builtWithContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.5,
    marginTop: theme.spacing(1),
  },
  sportalIcon: {
    height: 48,
    width: 48,
    filter: "contrast(0.3)",
    transition: "filter 0.5s",
    "&:hover": {
      filter: "contrast(0.8)",
    },
    verticalAlign: "middle",
    marginRight: theme.spacing(1),
  },
}));

export default function Footer() {
  const classes = useStyles();
  return (
    <footer className={classes.footer}>
      <div>
        <IconButton
          href="https://discord.gg/xsT8qrHAvV"
          target="_blank"
          rel="noopener noreferrer"
          className={classes.socialIcon}
        >
          <img src={Discord} alt="Discord" />
        </IconButton>
        <IconButton
          href="https://github.com/certusone/wormhole"
          target="_blank"
          rel="noopener noreferrer"
          className={classes.socialIcon}
        >
          <img src={Github} alt="Github" />
        </IconButton>
        <IconButton
          href="http://wormholecrypto.medium.com"
          target="_blank"
          rel="noopener noreferrer"
          className={classes.socialIcon}
        >
          <img src={Medium} alt="Medium" />
        </IconButton>
        <IconButton
          href="https://t.me/wormholecrypto"
          target="_blank"
          rel="noopener noreferrer"
          className={classes.socialIcon}
        >
          <img src={Telegram} alt="Telegram" />
        </IconButton>
        <IconButton
          href="https://twitter.com/wormholecrypto"
          target="_blank"
          rel="noopener noreferrer"
          className={classes.socialIcon}
        >
          <img src={Twitter} alt="Twitter" />
        </IconButton>
      </div>
      <div className={classes.builtWithContainer}>
        <div>
          <a
            href="https://wormholenetwork.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={sPortal}
              alt="sPortal"
              className={classes.sportalIcon}
            />
          </a>
        </div>
        <div>
          <Typography variant="body2">Open Source</Typography>
          <Typography variant="body2">Built with &#10084;</Typography>
        </div>
      </div>
    </footer>
  );
}
