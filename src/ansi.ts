// windows cri

const CSI = "\u001b[";

const makeNumFunc =
  (char: string, def: number = null) =>
  (n?: number) =>
    n > 0 ? `${CSI}${n === def ? "" : n}${char}` : "";

export const CLEAR_LINE = `${CSI}2K`;
export const CURUP = makeNumFunc("A", 1);
export const CURFWD = makeNumFunc("C", 1);
export const CURBACK = makeNumFunc("D", 1);
export const TO_COL = makeNumFunc("G", 1);

export const MOVE_CUR_HORIZ = (n: number) => n === 0 ? "" : n > 0 ? CURFWD(n) : CURBACK(-n);

const makeSgr = (codes: number[]) => `${CSI}${codes.join(";")}m`;

const colToCode = (col: number, bright: boolean, bg: boolean) =>
  col + 30 + (bright ? 60 : 0) + (bg ? 10 : 0);

export const COLOR = (col: number, bright = false, bg = false) =>
  makeSgr([colToCode(col, bright, bg)]);
export const FGBG_COLOR = (
  col1: number,
  col2: number,
  bright1 = false,
  bright2 = false
) => makeSgr([colToCode(col1, bright1, false), colToCode(col2, bright2, true)]);

export const COLORS = {
  black: 0,
  red: 1,
  green: 2,
  yellow: 3,
  blue: 4,
  magenta: 5,
  cyan: 6,
  white: 7,
}