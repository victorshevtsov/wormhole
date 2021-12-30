//cloned for styling on quick transfert
import { Button, makeStyles, Tooltip } from "@material-ui/core";
import { LinkOff } from "@material-ui/icons";
import metamast from "../icons/metamaskwhite2.svg";
const useStyles = makeStyles((theme) => ({
  button: {
    display: "flex",
    margin: `${theme.spacing(4)}px`,
    width: "100%",
    maxWidth: 400,
  },
  btnstepper: {
    display: "flex",
   // margin: `${theme.spacing(4)}px`,
  //  width: "100%",
    maxWidth: 400,
  },
}));

const QToggleConnectedButton = ({
  connect,
  disconnect,
  connected,
  pk,
}: {
  connect(): any;
  disconnect(): any;
  connected: boolean;
  pk: string;
}) => {
  const classes = useStyles();
  const is0x = pk.startsWith("0x");
  return connected ? (
    <Tooltip title={pk}>
      <Button
        color="primary"
        variant="text"
        size="medium"
        disableElevation={true}
        onClick={disconnect}
        //className={classes.button}
        startIcon={<LinkOff />}
      >
        Disconnect {pk.substring(0, is0x ? 6 : 3)}...
        
      </Button>
    </Tooltip>
  ) : (
    <Button
      color="primary"
      variant="contained"
      size="large"
      disableElevation={true}
      onClick={connect}
      className={classes.button}
      startIcon={<img style={{ width:"30px", height:"auto"}} src={metamast}></img>}
    >
      Connect
    </Button>
  );
};

export default QToggleConnectedButton;
