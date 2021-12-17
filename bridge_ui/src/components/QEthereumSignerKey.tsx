//cloned for styling on quick transfert
import { Typography } from "@material-ui/core";
import { useEthereumProvider } from "../contexts/EthereumProviderContext";
import QToggleConnectedButton from "./QToggleConnectedButton";

const QEthereumSignerKey = () => {
  const { connect, disconnect, signerAddress, providerError } =
    useEthereumProvider();
  return (
    <>
      <QToggleConnectedButton
        connect={connect}
        disconnect={disconnect}
        connected={!!signerAddress}
        pk={signerAddress || ""}
      />
      {providerError ? (
        <Typography variant="body2" color="error">
          {providerError}
        </Typography>
      ) : null}
    </>
  );
};

export default QEthereumSignerKey;
