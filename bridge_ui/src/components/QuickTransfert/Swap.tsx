import { getAddress } from "@ethersproject/address";
import { Button, Chip, Container, Divider, Fade, InputBase, ListItemIcon, ListItemText, makeStyles, MenuItem, Paper, TextField, Typography } from "@material-ui/core";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router";
import safeicon from "./../../icons/safecoin.svg";
import powerlogo from "./../../icons/powrlogo.svg"
import useIsWalletReady from "../../hooks/useIsWalletReady";
import {
  selectTransferAmount,
  selectTransferIsSourceComplete,
  selectTransferShouldLockFields,
  selectTransferSourceBalanceString,
  selectTransferSourceChain,
  selectTransferSourceError,
  selectTransferSourceParsedTokenAccount,
} from "../../store/selectors";
import {
  incrementStep,
  setAmount,
  setSourceChain,
} from "../../store/transferSlice";
import ButtonWithLoader from "../ButtonWithLoader";
import { isMobile } from 'react-device-detect';
import QKeyAndBalance from "../QKeyAndBalance";


import Wallet from "@araviel/safe-wallet-adapter";
import {
  Connection,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  Keypair,
  PublicKey,
  Signer,
  TransactionInstruction,
} from '@safecoin/web3.js';
import { AccountLayout, NATIVE_MINT, Token, TOKEN_PROGRAM_ID } from '@safecoin/safe-token';
import Divi from "../Divi";
import { ExpandMore, SwapVert, CheckOutlined, SearchOutlined } from "@material-ui/icons";
import { COLORS } from "../../muiThemeLight";


const useStyles = makeStyles((theme) => ({
  swppbutton: {
    marginTop: "10px",
    borderRadius: "20px",
  },
  amount: {
    fontSize: "24px",
    width: "100%",
    textAlign: "right",
    fontFamily: "'Roboto Mono', monospace",
  },
  transferField: {
    marginTop: theme.spacing(5),
  },
  selector: {
    display: "none",
  },
  description: {
    marginTop: theme.spacing(4),
    textAlign: "left",
  },
  spacer: {
    height: theme.spacing(6),
  },
  swpbutton: {
    backgroundColor: "#f5f5f5",
    width: "250px",
    borderRadius: "20px",
    "& .MuiButton-label": {
      justifyContent: "unset",
    },
  },
  select: {
    "& .MuiSelect-root": {
      display: "flex",
      alignItems: "center",
    },
    "& .MuiFilledInput-root": {
      borderRadius: "10px",

    },
    "& .MuiFilledInput-input": {
      padding: "12px 12px 10px",
    },
  },
  listItemIcon: {
    minWidth: 40,
  },
  icon: {
    height: 30,
    maxWidth: 30,
  },
}));

function Swap() {

  const classes = useStyles();

  const [wormbalance, setWormBalance] = useState(2);
  const [wrapbalance, setWrapBalance] = useState(0);
  const [wsafeInput, setWsetInput] = useState(0);


  const [isSwappable, setIsSwappable] = useState(false);

  const [isSwapped, setIsSwapped] = useState(false);
  const [isUnwrapping, setIsUnwrapping] = useState(false); // important pass to true after the transaction is sent and confirmed
  const [swapBtnState, setswapBtnState] = useState("Swap");

  const [isUnrwapPossible, setisUnrwapPossible] = useState("Check wrapped account");
  const [isFinal, setIsFinal] = useState(false);
  const [waccountStatus, setWaccountStatus] = useState("Your swapping is still finalizing, click the check button");
  const [addressFound, setAddressFound] = useState("");

  const [amountUnwrapped, setamountUnwrapped] = useState("");
  const swapping = (e: any) => {
    setswapBtnState("Swapping...")
    e.preventDefault();
    setTimeout(() => {
      console.log("test")
      wrapSafe()
    }, 2000);
  };


  const unwrapping = (e: any) => {
    setisUnrwapPossible("Checking")
    e.preventDefault();
    setTimeout(() => {
      setisUnrwapPossible("Unwrap now")
      //checkWrappedSafe()
      unwrapSafe()
    }, 10000);
  };


  const onTextChangeInput = (e: any) => setWsetInput(e.target.value);

  function shortenAddress(address: string, chars = 4): string {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  }


  const network = clusterApiUrl('devnet');
  const [providerUrl, setProviderUrl] = useState('https://wallet.safecoin.org/');
  const connection2 = useMemo(() => new Connection(network), [network]);
  const urlWallet = useMemo(
    () => new Wallet(providerUrl, network),
    [providerUrl, network],
  );
  const [selectedWallet, setSelectedWallet] = useState<
    Wallet | undefined | null
  >(undefined);
  const [, setConnected] = useState(true);

  useEffect(() => {
    if (selectedWallet) {
      selectedWallet.on('connect', () => {
        setIsSwappable(true)
        setConnected(true);
      });
      selectedWallet.on('disconnect', () => {
        setConnected(false);
      });
      void selectedWallet.connect();
      return () => {
        void selectedWallet.disconnect();
      };
    }
  }, [selectedWallet]);



  const sourceChain = useSelector(selectTransferSourceChain);

  const { isReady, statusMessage } = useIsWalletReady(sourceChain);

  async function wrapSafe() {
    // parameters : connection ? selectedwallet, amount

    try {
      const mainPubkey = selectedWallet?.publicKey;
      if (!mainPubkey || !selectedWallet) {
        throw new Error('wallet not connected');
      }

      // returns any PublicKey found
      const fetchedAcc = await checkWrappedSafe();

      if (fetchedAcc.length !== 0) // account already here
      {
        const transac = new Transaction();
        //addLog('Wrapped account exists, sending to it');

        transac.add(
          SystemProgram.transfer({
            fromPubkey: mainPubkey,
            toPubkey: fetchedAcc[0],
            lamports: 2000000000,
          }),
          new TransactionInstruction({
            keys: [
              {
                pubkey: fetchedAcc[0],
                isSigner: false,
                isWritable: true,
              },
            ],
            data: Buffer.from(new Uint8Array([17])),
            programId: TOKEN_PROGRAM_ID,
          })
        )

        transac.recentBlockhash = (
          await connection2.getRecentBlockhash()
        ).blockhash;

        transac.feePayer = mainPubkey;
        const signed = await selectedWallet.signTransaction(transac);
        const signature2 = await connection2.sendRawTransaction(signed.serialize());
        const confirmation = await connection2.confirmTransaction(signature2, 'singleGossip');
        console.log("Succefully wrapped : ", confirmation)


        setswapBtnState("Unrwap")
        setWormBalance(0)
        setWrapBalance(2)
        setWsetInput(0)
        setIsSwapped(true)
        setIsUnwrapping(true)

      } else { // no accounts found, create - fund and initializing a NATIVE_MINT account
        const transac = new Transaction();
        const newAccount = new Keypair();

        transac.add(
          SystemProgram.createAccount({
            fromPubkey: mainPubkey,
            lamports: await Token.getMinBalanceRentForExemptAccount(connection2),
            newAccountPubkey: newAccount.publicKey,
            programId: TOKEN_PROGRAM_ID,
            space: AccountLayout.span,
          })
        );
        transac.add(
          Token.createInitAccountInstruction(
            TOKEN_PROGRAM_ID,
            NATIVE_MINT,
            newAccount.publicKey,
            mainPubkey
          )
        )
        transac.add(
          SystemProgram.transfer({
            fromPubkey: mainPubkey,
            toPubkey: newAccount.publicKey,
            lamports: 2000000000,
          }),
          new TransactionInstruction({
            keys: [
              {
                pubkey: newAccount.publicKey,
                isSigner: false,
                isWritable: true,
              },
            ],
            data: Buffer.from(new Uint8Array([17])),
            programId: TOKEN_PROGRAM_ID,
          })
        );

        transac.recentBlockhash = (
          await connection2.getRecentBlockhash()
        ).blockhash;

        //addLog('Sending signature request to wallet');
        transac.feePayer = mainPubkey;

        const signed = await selectedWallet.signTransaction(transac);
        signed.partialSign(newAccount)
        const signature2 = await connection2.sendRawTransaction(signed.serialize());
        const confirmation = await connection2.confirmTransaction(signature2, 'singleGossip');
        console.log("Succefully created & funded a wrapped account : ", confirmation)

        setswapBtnState("Unwrap")
        setWormBalance(0)
        setWrapBalance(2)
        setWsetInput(0)
        setIsSwapped(true)
        setIsUnwrapping(true)
      }

    } catch (e) {
      console.log('err : ' + e);
    }
  }

  async function unwrapSafe() {
    try {
      const mainPubkey = selectedWallet?.publicKey;
      if (!mainPubkey || !selectedWallet) {
        throw new Error('wallet not connected');
      }
      // returns any PublicKey found
      const fetchedAdd = await checkWrappedSafe();

      console.log("fetchedAdd ", fetchedAdd)
      if (fetchedAdd.length != 0) {
        const transac = new Transaction();
        // TODO : create a loop if there is multiples (if assac.length > 0) loop oters instructions
        transac.add(
          Token.createCloseAccountInstruction(
            TOKEN_PROGRAM_ID,
            fetchedAdd[0],
            mainPubkey,
            mainPubkey,
            []
          )
        );
        transac.recentBlockhash = (
          await connection2.getRecentBlockhash()
        ).blockhash;
        setisUnrwapPossible("Waiting approval...")
        transac.feePayer = mainPubkey;
        const signed = await selectedWallet.signTransaction(transac);

        const signature2 = await connection2.sendRawTransaction(signed.serialize());
        const confirmation = await connection2.confirmTransaction(signature2, 'singleGossip');
        setIsUnwrapping(true)
        setIsFinal(true)
        console.log("isUnwrapping : ", isUnwrapping)
        console.log("Succefully unwrapped : ", confirmation)
      } else {
        console.log("There is nothing to unwrap")
        setisUnrwapPossible("Check again")
      }
    } catch (e) {
      console.log(`error`, e);
    }
  }

  async function checkWrappedSafe() {
    // 1. fetch account
    // 2. filter associated NATIVE_MINT accounts
    // 3. returns accounts or empty array
    const pubkey = selectedWallet?.publicKey;
    if (!pubkey || !selectedWallet) {
      throw new Error('wallet not connected');
    }
    // returns all tokens accounts
    const accounts = await connection2.getParsedProgramAccounts(
      TOKEN_PROGRAM_ID,
      {
        filters: [
          {
            dataSize: 165, // number of bytes
          },
          {
            memcmp: {
              offset: 32, // number of bytes
              bytes: pubkey.toBase58(), // base58 encoded string
            },
          },
        ],
      }
    );

    console.log(`Found ${accounts.length} token account(s) for wallet ${pubkey}: `);

    function parseAccount() {
      const result: PublicKey[] = [];
      accounts.map((account, i) => {

        let data: any = account.account.data;
        console.log("data (raw object) ", data)
        //go through accounts and catch native minted ones
        if (data["parsed"]["info"]["mint"] === NATIVE_MINT.toBase58()) {
          console.log("wrapped safe found on :", account.pubkey.toString());
          setWaccountStatus(" " + ` Wrapped Solstice found !`)
          setAddressFound(account.pubkey.toString())
          setamountUnwrapped(data["parsed"]["info"]["tokenAmount"]["uiAmount"])
          result.push(account.pubkey)
          console.log(
            `-- Wrapped safe AssociatedAcc : ${account.pubkey.toString()} --` +
            `Amount: ${data["parsed"]["info"]["tokenAmount"]["uiAmount"]}`
          );
        }
      });
      return result
    }

    // if no account wrapped found do nothing
    if (parseAccount().length === 0) {
      console.log("No Wrapped account found")
      //setWaccountStatus("No Wrapped account found")
    }
    return parseAccount();
  };

  return (
    //Ara whole steps container
    <div>
      {isReady ? (
        <QKeyAndBalance chainId={sourceChain} />
      ) : null}
      <div style={{ display: "flex", alignItems: "center" }}>
        {/*Select Safecoin ERC-20 tokens to send through the sPortal Bridge.*/}
        <div style={{ flexGrow: 1 }} />
      </div>
      {isReady ? (
        <div style={isMobile ? {} : { display: 'flex', justifyContent: "space-around", alignItems: "center" }}>
          {/* left part */}


          {/* right part */}
        </div>
      ) : (
        <>

          <div className={classes.spacer}></div>
          <div style={isMobile ? {} : { display: 'flex', justifyContent: "space-around", alignItems: "center" }}>
            <div>
              <Typography variant="h4">
                {isSwapped ? ("Unwrapping") : ("Swapping")}<span style={{ color: COLORS.green, fontSize: "40px" }}>.</span>
              </Typography>
              <Typography className={classes.description}>
                {isSwapped ? (
                  <div>Let's unwrap them to fully land
                    <br /> on blockchain with native Solstice.</div>
                ) : (
                  <div>This last part will swap <b>1:1</b> your received
                    <br />wormhole tokens to Wrapped Solstice.</div>
                )}
              </Typography>
            </div>
            <div>
              <div>
                <Paper elevation={5} style={{ height: "420px", width: "460px", padding: "30px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  {selectedWallet && selectedWallet.connected ? (
                    <div>
                      <div>
                      </div>
                    </div>
                  ) : (
                    <div>
                    </div>
                  )}

                  {!isUnwrapping ? (
                    <div>
                      <div style={{ display: "flex", width: "400px", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <Button disableElevation={true} variant="contained" className={classes.swpbutton} >
                            <MenuItem button={false}>
                              <ListItemIcon className={classes.listItemIcon}>
                                <img src={powerlogo} className={classes.icon} />
                              </ListItemIcon>
                              <ListItemText>
                                <div><b>wPOWR</b></div>
                                <div style={{ fontSize: "12px", opacity: "0.7" }}>Wormhole POWR</div>
                              </ListItemText>
                            </MenuItem>
                          </Button>

                        </div>
                        <div>
                          <InputBase
                            style={{ textAlign: 'right' }}
                            placeholder="0,00"
                            onChange={onTextChangeInput}
                            className={classes.amount}
                            inputProps={{ style: { textAlign: 'right' }, 'aria-label': 'naked', 'size': 'medium' }}
                          />
                        </div>
                      </div>
                      <div style={{ paddingTop: "8px" }}>
                        Balance : <b>{wormbalance}</b>
                      </div>
                      <div>
                        <Divi><div><ExpandMore /></div></Divi>
                      </div>
                      <div style={{ display: "flex", width: "400px", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <Button disableElevation={true} variant="contained" className={classes.swpbutton} >
                            <MenuItem button={false}>
                              <ListItemIcon className={classes.listItemIcon}>
                                <img src={powerlogo} className={classes.icon} style={{filter: "invert(1)"}} />
                              </ListItemIcon>
                              <ListItemText>
                                <div><b>wSOLSTICE</b></div>
                                <div style={{ fontSize: "12px", opacity: "0.7" }}>Wrapped SOLSTICE</div>
                              </ListItemText>
                            </MenuItem>
                          </Button>

                        </div>
                        <div>
                          <InputBase
                            style={{ textAlign: 'right' }}
                            placeholder="0,00"
                            className={classes.amount}
                            disabled={true}
                            value={wsafeInput == 0 ? (wsafeInput) :
                              (wsafeInput - 0.0020)
                            }
                            inputProps={{ style: { textAlign: 'right' }, 'aria-label': 'naked', 'size': 'medium' }}
                          />
                        </div>
                      </div>
                      <div style={{ paddingTop: "8px" }}>
                        Balance : <b>{wrapbalance}</b>
                      </div>
                      <div>
                        {selectedWallet && selectedWallet.connected ? (

                          <Button
                            disableElevation={true}
                            variant="contained"
                            size="medium"
                            disabled={!isSwappable}
                            onClick={swapping}
                            className={classes.swppbutton}
                            startIcon={<SwapVert />}
                            fullWidth={true}>
                            {swapBtnState}
                          </Button>
                        ) : (
                          <div>
                            {/*<button style={{ background: "green", padding: "3px", margin: "6px" }} onClick={() => setSelectedWallet(urlWallet)}>
                                            Connect to Wallet
                                </button>*/}
                            <Button
                              disableElevation={true}
                              variant="contained"
                              size="medium"
                              //disabled={!isSwappable}
                              onClick={() => setSelectedWallet(urlWallet)}
                              className={classes.swppbutton}
                              //startIcon={<SwapVert />}
                              fullWidth={true}>
                              Connect
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                  ) : (
                    <div>
                      <div style={{ textAlignLast: "center" }}>
                        {!isFinal ? (
                          <div>
                            <div style={{ paddingBottom: "20px", textAlign: "center" }}>{amountUnwrapped}{waccountStatus}</div>
                            <div style={{ paddingBottom: "20px", textAlign: "center", fontFamily: "monospace", fontSize: "12px" }}>{addressFound}</div>

                            <Button
                              disableElevation={true}
                              variant="contained"
                              size="medium"
                              disabled={!isSwappable}
                              onClick={unwrapping}
                              className={classes.swppbutton}
                              startIcon={isUnrwapPossible === "Check wrapped account" ? (<SearchOutlined />) : (<SwapVert />)}
                              fullWidth={false}>
                              {isUnrwapPossible}
                            </Button>
                          </div>
                        ) : (
                          <Fade in={true}><CheckOutlined /></Fade>
                        )}
                      </div>
                      <div style={{ paddingTop: "20px", textAlign: "center" }}>
                        {isFinal ? (
                          <div>
                            <div>Succefully landed <b><a style={{ color: "rgb(10, 194, 175)" }}>{amountUnwrapped}</a></b> native Solstice.</div>
                            <div>You may now want to <b><a style={{ color: "rgb(10, 194, 175)" }}>stake them </a> </b>?</div>
                          </div>
                        ) : ("")}</div>
                    </div>
                  )}

                </Paper>
              </div>
            </div>
          </div>
          <div className={classes.spacer}></div>
        </>
      )}
    </div>
  );
}

export default Swap;
