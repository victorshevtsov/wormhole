import { createTheme, responsiveFontSizes } from "@material-ui/core";

export const COLORS = {
  blue: "#005779",
  blueWithTransparency: "#2A8DCC",
  gray: "#ffffff",
  green: "#0ac2af",
  greenWithTransparency: "rgba(10, 194, 175, 0.8)",
  lightGreen: "rgba(51, 242, 223, 1)",
  lightBlue: "#83b9fc",
  pureWhite: "#ffffff",
  nearWhite: "#f3f6ff",
  nearWhiteWithMinorTransparency: "rgba(255,255,255,.92)",
  nearBlack: "#f3f6ff",
  nearBlackWithMinorTransparency: "rgba(255,255,255,.85)",
  red: "#aa0818",
  darkRed: "#810612",
};

export const themelight = responsiveFontSizes(
  createTheme({
    palette: {
      type: "light",
      background: {
        default: COLORS.pureWhite,
        paper: COLORS.nearWhite,
      },
      divider: COLORS.gray,
      text: {
        primary: "#637381",
      },
      primary: {
        main: COLORS.blueWithTransparency, // #0074FF
        light: COLORS.lightBlue,
      },
      secondary: {
        main: COLORS.greenWithTransparency, // #00EFD8
        light: COLORS.lightGreen,
      },
      error: {
        main: COLORS.red,
      },
    },
    typography: {
      fontFamily: [
        'Poppins',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(','),
      h1: {
        fontWeight: "700",
      },
      h2: {
        fontWeight: "700",
      },
      h4: {
        fontWeight: "500",
        color:"#212B36",
      },
    },
    overrides: {
      MuiOutlinedInput: {
        root: {
          border: '1px solid #2a8dcc63',
          backgroundColor: 'rgba(255,255,255,0.8)',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,1)'
          },
          '&.Mui-focused': {
            backgroundColor: 'rgba(255,255,255,1)'
          }
        }
      },
      MuiCssBaseline: {
        "@global": {
          "*": {
            scrollbarWidth: "thin",
            scrollbarColor: `${COLORS.gray} ${COLORS.nearWhiteWithMinorTransparency}`,
          },
          "*::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
            backgroundColor: COLORS.nearWhiteWithMinorTransparency,
          },
          "*::-webkit-scrollbar-thumb": {
            backgroundColor: "black",
            borderRadius: "4px",
          },
          "*::-webkit-scrollbar-corner": {
            // this hides an annoying white box which appears when both scrollbars are present
            backgroundColor: "transparent",
          },
        },
      },
      MuiAccordion: {
        root: {
          backgroundColor: COLORS.nearWhiteWithMinorTransparency,
          "&:before": {
            display: "none",
          },
        },
        rounded: {
          "&:first-child": {
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
          },
          "&:last-child": {
            borderBottomLeftRadius: "16px",
            borderBottomRightRadius: "16px",
          },
        },
      },
      MuiAlert: {
        root: {
          borderRadius: "8px",
          border: "1px solid",
        },
      },
      MuiButton: {
        root: {
          borderRadius: "5px",
          textTransform: "none",
        },
      },
      MuiLink: {
        root: {
          color: COLORS.lightBlue,
        },
      },
      MuiPaper: {
        elevation5: {
          boxShadow: [
            // 23 default values of 'shadows' array from https://material-ui-1dab0.firebaseapp.com/customization/themes/
                '-16px 16px 56px -8px rgba(145,158,171,0.22)', // 24th value
              ],
        },
        rounded: {
          backgroundColor: '#fff',
          borderRadius: "16px",
          boxShadow:
          "0px 3px 1px -2px red,0px 2px 2px 0px rgba(0,0,200,0.9),0px 1px 5px 0px rgba(0,0,0,0.12)",
        },
      },
      MuiCard: {
        root: {
          backgroundColor: '#fff',
          boxShadow: [
            // 23 default values of 'shadows' array from https://material-ui-1dab0.firebaseapp.com/customization/themes/
                '-16px 16px 56px -8px rgba(145,158,171,0.22)', // 24th value
              ],
        },
        
      },
      MuiStepper: {
        root: {
          backgroundColor: "transparent",
          padding: 0,
        },
      },
      MuiStep: {

        root: {
          backgroundColor: COLORS.nearWhiteWithMinorTransparency,
          borderRadius: "16px",
          padding: 16,
          boxShadow: [
            // 23 default values of 'shadows' array from https://material-ui-1dab0.firebaseapp.com/customization/themes/
                '-16px 16px 56px -8px rgba(145,158,171,0.22)', // 24th value
              ],
        },
      },
      MuiStepConnector: {
        lineVertical: {
          borderLeftWidth: 0,
        },
      },
      MuiStepContent: {
        root: {
          paddingRight: '15px',
           marginTop: '0px',
          borderLeftWidth: 0,
        },
      },
      MuiCollapse: {
        root: {
          marginTop: '14px',
          marginBottom: '14px',
          paddingRight: '10px',
        }
      },
      MuiStepButton: {
        root: {
          //marginTop: '8px',
        }
      },
      MuiStepLabel: {
        label: {
          fontSize: 21,
          color: "#484848",
          "&.MuiStepLabel-active": {
            fontWeight: "500",
          },
          "&.MuiStepLabel-completed": {
            fontWeight: "400",
          },
        },
      },
      MuiTab: {
        root: {
          fontSize: 18,
          fontWeight: "300",
          padding: 12,
          textTransform: "none",
        },
      },
      MuiAlert: {
        root: {
          marginTop:"8px",
        }
      }
    },
  })
);