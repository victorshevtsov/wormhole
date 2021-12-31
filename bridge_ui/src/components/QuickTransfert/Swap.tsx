import {
    CHAIN_ID_ETH,
  } from "@certusone/wormhole-sdk";
  import { getAddress } from "@ethersproject/address";
  import { Button, Chip, Container, Divider, InputBase, ListItemIcon, ListItemText, makeStyles, MenuItem, Paper, TextField, Typography } from "@material-ui/core";
  import { Link } from "react-router-dom";
  import { VerifiedUser } from "@material-ui/icons";
  import { useCallback, useEffect, useState,useMemo } from "react";
  import { useDispatch, useSelector } from "react-redux";
  import { useHistory } from "react-router";
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
  import {
    BSC_MIGRATION_ASSET_MAP,
    CHAINS,
    ETH_MIGRATION_ASSET_MAP,
    MIGRATION_ASSET_MAP,
  } from "../../utils/consts";
  import ButtonWithLoader from "../ButtonWithLoader";
  import ChainSelect from "../ChainSelect";
  import KeyAndBalance from "../KeyAndBalance";
  import LowBalanceWarning from "../LowBalanceWarning";
  import NumberTextField from "../NumberTextField";
  import StepDescription from "../StepDescription";
  import { TokenSelector } from "../TokenSelectors/SourceTokenSelector";
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


  const useStyles = makeStyles((theme) => ({
      amount: {
        width:"40px",
        textAlign:"right",
        fontFamily:"'Roboto Mono', monospace",
      },
    transferField: {
      marginTop: theme.spacing(5),
    },
    selector: {
      display: "none",
    },
    description: {
      // marginBottom: theme.spacing(4),
      textAlign: "center",
    },
    spacer: {
      height: theme.spacing(6),
    },
    swpbutton: {
        backgroundColor:"#f5f5f5",
        width:"250px",
        borderRadius: "20px",
        "& .MuiButton-label": {
          justifyContent:"unset",
        },
      },
    select: {
        "& .MuiSelect-root": {
          display: "flex",
          alignItems: "center",
        },
        "& .MuiFilledInput-root": {
          borderRadius:"10px",
    
        },
        "& .MuiFilledInput-input": {
          padding: "12px 12px 10px",
        },
      },
      listItemIcon: {
        minWidth: 40,
      },
      icon: {
        height: 24,
        maxWidth: 24,
      },
  }));

  function Swap() {

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

    const classes = useStyles();
    const dispatch = useDispatch();
    const history = useHistory();
    const sourceChain = useSelector(selectTransferSourceChain);
    const parsedTokenAccount = useSelector(
      selectTransferSourceParsedTokenAccount
    );
    const hasParsedTokenAccount = !!parsedTokenAccount;
  
    const uiAmountString = useSelector(selectTransferSourceBalanceString);
    const amount = useSelector(selectTransferAmount);
    const error = useSelector(selectTransferSourceError);
    const isSourceComplete = useSelector(selectTransferIsSourceComplete);
    const shouldLockFields = useSelector(selectTransferShouldLockFields);
    const { isReady, statusMessage } = useIsWalletReady(sourceChain);
  
    const handleSourceChange = useCallback(
      (event) => {
        dispatch(setSourceChain(event.target.value));
      },
      [dispatch]
    );
    const handleAmountChange = useCallback(
      (event) => {
        dispatch(setAmount(event.target.value));
      },
      [dispatch]
    );
    const handleMaxClick = useCallback(() => {
      if (uiAmountString) {
        dispatch(setAmount(uiAmountString));
      }
    }, [dispatch, uiAmountString]);
    const handleNextClick = useCallback(() => {
      dispatch(incrementStep());
    }, [dispatch]);
  
    if (sourceChain != 2) {
      dispatch(setSourceChain(2));
    }
  
    async function unwrapSafe(
        /* for implementation
        connection: Connection,
        nativemint: PublicKey,
        owner: PublicKey,
        assacc: PublicKey[]*/
      ) {
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
            transac.feePayer = mainPubkey;
            const signed = await selectedWallet.signTransaction(transac);
            const signature2 = await connection2.sendRawTransaction(signed.serialize());
            const confirmation = await connection2.confirmTransaction(signature2, 'singleGossip');
            console.log("Succefully unwrapped : ", confirmation)
          } else {
            console.log("There is nothing to unwrap")
          }
        } catch (e) {
          console.log(`eeeee`, e);
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
            console.log("lol ", data)
            //go through accounts and catch native minted ones
           if (data["parsed"]["info"]["mint"] === NATIVE_MINT.toBase58()) {
              console.log("wrapped safe found on :", account.pubkey.toString());
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
            <div>
              <div style={isMobile ? {} : { width: "480px" }}>
                {/* hidden for UX purpose for quicktransfer */}
                <ChainSelect
                  hidden={true}
                  className={classes.selector}
                  select
                  variant="outlined"
                  fullWidth
                  value={sourceChain}
                  onChange={handleSourceChange}
                  disabled={shouldLockFields}
                  chains={CHAINS}
                />
                { /* to remove */ isReady || uiAmountString ? (
                  <div className={classes.transferField}>
                    <TokenSelector disabled={shouldLockFields} />
                  </div>
                ) : null}
                <LowBalanceWarning chainId={sourceChain} />
                {hasParsedTokenAccount ? (
                  <NumberTextField
                    variant="outlined"
                    label="Amount"
                    fullWidth
                    className={classes.transferField}
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={shouldLockFields}
                    onMaxClick={
                      uiAmountString && !parsedTokenAccount.isNativeAsset
                        ? handleMaxClick
                        : undefined
                    }
                  />
                ) : null}
              </div>
            </div>
            {/* right part */}
          </div>
        ) : (
          <>
            <Typography variant="h4">
              Finalizing
            </Typography>
            <div className={classes.spacer}></div>
            <div style={isMobile ? {} : { display: 'flex', justifyContent: "space-around", alignItems: "center" }}>
              <div>
                <Typography className={classes.description}>
                  This last part will swap <b>1:1</b> your received
                  <br />wormhole tokens to Wrapped Safe.
                </Typography>
              </div>
              <div>
                <div>
                    <Paper elevation={5} style={{ padding:"30px"}}>
                        <div style={{display:"flex", width:"400px", justifyContent: "space-between", alignItems:"center"}}>
                            <Button disableElevation={true}  variant="contained" className={classes.swpbutton} >
                                <MenuItem button={false}>
                                    <ListItemIcon className={classes.listItemIcon}>
                                        <img className={classes.icon} />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <div><b>wWSAFE</b></div>
                                        <div style={{fontSize:"12px"}}>Wormhole Wrapped Safe</div>
                                    </ListItemText>
                                </MenuItem>
                            </Button>
                            <div>amount</div>
                        </div>
                        <div>
                            <Divi><div>dsqd</div></Divi>
                        </div>
                        <div style={{display:"flex", width:"400px", justifyContent: "space-between", alignItems:"center"}}>
                            <div>
                                <Button disableElevation={true} variant="contained" className={classes.swpbutton} >
                                    <MenuItem button={false}>
                                        <ListItemIcon className={classes.listItemIcon}>
                                            <img className={classes.icon} />
                                        </ListItemIcon>
                                        <ListItemText>
                                            <div><b>WSAFE</b></div>
                                            <div style={{fontSize:"12px"}}>Wrapped Safe</div>
                                        </ListItemText>
                                    </MenuItem>
                                </Button>
                                <div>
                                balance : 0
                                </div>
                            </div>
                            <div>
                                
                            <InputBase
                            placeholder="0,00"
                                className={classes.amount}
                                /*defaultValue="Naked input"*/
                                inputProps={{ 'aria-label': 'naked' }}
                            />
                            </div>
                        </div>
                    </Paper>
                </div>
              </div>
            </div>
            <div className={classes.spacer}></div>
            <div>
        Waller provider:{' '}
        <input
          type="text"
          value={providerUrl}
          onChange={(e) => setProviderUrl(e.target.value.trim())}
        />
      </div>
            {selectedWallet && selectedWallet.connected ? (
        <div style={{ marginTop: "10px" }}>
          <div>Wallet address: {selectedWallet.publicKey?.toBase58()}.</div>
          <button style={{ background: "green", padding: "8px", margin: "6px" }} onClick={checkWrappedSafe}>Check Safe</button>
          
          <button style={{ background: "green", padding: "8px", margin: "6px" }} onClick={unwrapSafe}>unWrap</button>
          <button style={{ color: "white", background: "black", padding: "8px", margin: "6px" }} onClick={() => selectedWallet.disconnect()}>
            Disconnect
          </button>
          <div></div>
        </div>
      ) : (
        <div>
          <button style={{ background: "green", padding: "3px", margin: "6px" }} onClick={() => setSelectedWallet(urlWallet)}>
            Connect to Wallet
          </button>
          {/*<button onClick={() => setSelectedWallet(injectedWallet)}>
            Connect to Injected Wallet
      </button>*/}
        </div>
      )}
      <hr />
          </>
        )}
      </div>
    );
  }
  
  export default Swap;
  