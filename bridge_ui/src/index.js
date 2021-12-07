import { CssBaseline } from "@material-ui/core";
import { ThemeProvider } from "@material-ui/core/styles";
import { SnackbarProvider } from "notistack";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import App from "./App";
import BackgroundImage from "./components/BackgroundImage";
import { BetaContextProvider } from "./contexts/BetaContext";
import { EthereumProviderProvider } from "./contexts/EthereumProviderContext";
import { SafecoinWalletProvider } from "./contexts/SafecoinWalletContext.tsx";
import { SolanaWalletProvider } from "./contexts/SolanaWalletContext.tsx";
import { TerraWalletProvider } from "./contexts/TerraWalletContext.tsx";
import ErrorBoundary from "./ErrorBoundary";
import { themelight } from "./muiThemeLight";
import { store } from "./store";

ReactDOM.render(
  <ErrorBoundary>
    <Provider store={store}>
      <ThemeProvider theme={themelight}>
        <CssBaseline />
        <ErrorBoundary>
          <SnackbarProvider maxSnack={3}>
            <BetaContextProvider>
              <SafecoinWalletProvider>
                <SolanaWalletProvider>
                  <EthereumProviderProvider>
                    <TerraWalletProvider>
                      <HashRouter>
                        <BackgroundImage />
                        <App />
                      </HashRouter>
                    </TerraWalletProvider>
                  </EthereumProviderProvider>
                </SolanaWalletProvider>
              </SafecoinWalletProvider>
            </BetaContextProvider>
          </SnackbarProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </Provider>
  </ErrorBoundary>,
  document.getElementById("root")
);
