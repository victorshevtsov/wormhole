import {
  ListItemIcon,
  ListItemText,
  makeStyles,
  MenuItem,
  OutlinedTextFieldProps,
  TextField,
} from "@material-ui/core";
import clsx from "clsx";
import { useMemo } from "react";
import { useBetaContext } from "../contexts/BetaContext";
import { BETA_CHAINS, ChainInfo } from "../utils/consts";


const useStyles = makeStyles((theme) => ({
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
const createChainMenuItem = ({ id, name, logo }: ChainInfo, classes: any) => (
  <MenuItem key={id} value={id}>
    <ListItemIcon className={classes.listItemIcon}>
      <img src={logo} alt={name} className={classes.icon} />
    </ListItemIcon>
    <ListItemText>{name}</ListItemText>
  </MenuItem>
);

interface ChainSelectProps extends OutlinedTextFieldProps {
  chains: ChainInfo[];
}

export default function ChainSelect({ chains, ...rest }: ChainSelectProps) {
  const classes = useStyles();
  const isBeta = useBetaContext();
  const filteredChains = useMemo(
    () =>
      chains.filter(({ id }) => (isBeta ? true : !BETA_CHAINS.includes(id))),
    [chains, isBeta]
  );
  return (
    <TextField {...rest}  InputProps={{ disableUnderline: true }} variant="filled" className={clsx(classes.select, rest.className)}>
      {filteredChains.map((chain) => createChainMenuItem(chain, classes))}
    </TextField>
  );
}
