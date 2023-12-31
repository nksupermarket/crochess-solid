import { Colors, ColorsBackend } from "../types/types";

export function isColor(val: string): val is Colors {
  if (val === "b" || val === "w") {
    return true;
  }
  return false;
}

export function getColorsChar(val: Colors): ColorsBackend {
  return val[0] as ColorsBackend;
}
