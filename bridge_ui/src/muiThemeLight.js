import { createTheme, responsiveFontSizes } from "@material-ui/core";

export const COLORS = {
  blue: "#1975e6",
  blueWithTransparency: "rgba(25, 117, 230, 0.8)",
  gray: "#ffffff",
  green: "#0ac2af",
  greenWithTransparency: "rgba(10, 194, 175, 0.8)",
  lightGreen: "rgba(51, 242, 223, 1)",
  lightBlue: "#83b9fc",
  pureWhite: "#ffffff",
  nearWhite: "#f3f6ff",
  nearWhiteWithMinorTransparency: "rgba(255,255,255,.65)",
  nearBlack: "#f3f6ff",
  nearBlackWithMinorTransparency: "rgba(8,8,8,.65)",
  red: "#aa0818",
  darkRed: "#810612",
};

export const themelight = responsiveFontSizes(
  createTheme({
    palette: {
      type: "light",
      background: {
        default: COLORS.nearWhite,
        paper: COLORS.nearWhite,
      },
      divider: COLORS.gray,
      text: {
        primary: "rgba(57,64,82,0.98)",
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
        '-apple-system',
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
      },
    },
    overrides: {
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
            backgroundColor: COLORS.gray,
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
        rounded: {
          borderRadius: "16px",
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
        },
      },
      MuiStepConnector: {
        lineVertical: {
          borderLeftWidth: 0,
        },
      },
      MuiStepContent: {
        root: {
          borderLeftWidth: 0,
        },
      },
      MuiStepLabel: {
        label: {
          fontSize: 16,
          fontWeight: "300",
          "&.MuiStepLabel-active": {
            fontWeight: "300",
          },
          "&.MuiStepLabel-completed": {
            fontWeight: "300",
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
    },
  })
);
