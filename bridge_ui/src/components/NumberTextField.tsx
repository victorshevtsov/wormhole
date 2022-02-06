import {
  Button,
  InputAdornment,
  makeStyles,
  TextField,
  TextFieldProps,
} from "@material-ui/core";


const useStyles = makeStyles((theme) => ({
  cardstyle: {
    boxShadow:
      '-16px 16px 56px -8px rgba(145,158,171,0.18)', // 24th value
  },
  resize: {
    fontSize: 30,
    fontFamily: '"Roboto Mono", monospace;'
  },
}));

export default function NumberTextField({
  onMaxClick,
  ...props
}: TextFieldProps & { onMaxClick?: () => void }) {
  const classes = useStyles();
  return (
    <TextField
      type="number"
      {...props}
      InputProps={{
        classes: {
          input: classes.resize,
        },
        endAdornment: onMaxClick ? (
          <InputAdornment position="end">
            <Button
              onClick={onMaxClick}
              disabled={props.disabled}
              variant="outlined"
            >
              Max
            </Button>
          </InputAdornment>
        ) : undefined,
        ...(props?.InputProps || {}),
      }}
    ></TextField>
  );
}
