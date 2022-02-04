import { IconButton, makeStyles, Typography } from "@material-ui/core";
import Discord from "../icons/Discord.svg";
import Docs from "../icons/Docs.svg";
import Github from "../icons/Github.svg";
import Medium from "../icons/Medium.svg";
import Telegram from "../icons/Telegram.svg";
import Twitter from "../icons/Twitter.svg";
import Safebridge from "../icons/safebridge_l_i.svg";

const useStyles = makeStyles((theme) => ({
  footer: {
    margin: theme.spacing(2, 0, 2),
    textAlign: "center",
  },
  socialIcon: {
    "& img": {
      color:"white",
      height: 24,
      width: 24,
    },
  },
  builtWithContainer: {
    color:"white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
    marginTop: theme.spacing(1),
  },
  safeBridgeIcon: {
    height: 48,
    width: 48,
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
          href="https://discord.gg/wormholecrypto"
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
              src={Safebridge}
              alt="safebridge"
              className={classes.safeBridgeIcon}
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