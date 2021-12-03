import { makeStyles } from "@material-ui/core";
import DisconnectIcon from "@material-ui/icons/LinkOff";
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@safecoin/wallet-adapter-material-ui";
import { useState } from "react";
import { useSafecoinWallet } from "../contexts/SafecoinWalletContext";

const useStyles = makeStyles((theme) => ({
  root: {
    textAlign: "center",
    margin: `${theme.spacing(1)}px auto`,
    width: "100%",
    maxWidth: 400,
  },
  disconnectButton: {
    marginLeft: theme.spacing(1),
  },
}));

const SafecoinWalletKey = () => {
  const classes = useStyles();
  // const wallet = useSafecoinWallet();
    
  return (
    <div className={classes.root}>
      <p>SafecoinWalletKey</p>
      {/* <WalletMultiButton />
      {wallet && (
        <WalletDisconnectButton
          startIcon={<DisconnectIcon />}
          className={classes.disconnectButton}
        />
      )} */}
    </div>
  );
};

export default SafecoinWalletKey;
