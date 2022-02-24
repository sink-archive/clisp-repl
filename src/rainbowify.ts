import { COLOR, COLORS } from "./ansi.js";

let parenDepth = 0, stringMode = false, commentMode = false;

const stringColor = COLORS.yellow;
const rainbowColours = [
  COLORS.red,
  COLORS.green,
  COLORS.blue,
  COLORS.magenta,
  COLORS.cyan,
];

function updateState(char: string) {
  switch (char) {
    case '"':
      stringMode = !stringMode;
      break;
    case "(":
      if (!stringMode) parenDepth += parenDepth === -1 ? 2 : 1;
      break;
    case ")":
      if (!stringMode) parenDepth = parenDepth > 0 ? parenDepth - 1 : -1;
      break;
  }
}

function getRainbowColor(offset = 0) {
  if (parenDepth === -1) return COLORS.white;
  return rainbowColours[(parenDepth + offset) % rainbowColours.length];
}

function reset() {
  parenDepth = 0;
  stringMode = false;
}

export function rainbowify(str: string, colouredText = true) {
  let working = "";

  const getLastRainbowCol = () =>
    parenDepth > 0 ? getRainbowColor() : COLORS.white;

  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    updateState(char);
    if (stringMode) {
      if (char === '"') working += COLOR(stringColor);
      working += char;
    } else if (char === '"')
      working +=
        char + COLOR(colouredText ? getLastRainbowCol() : COLORS.white);
    else if (char === "|" && str[i - 1] === "#" && !commentMode) {
      commentMode = true;
      working = working.slice(0, -1) + COLOR(stringColor) + "#|";
    }
    else if (char === "#" && str[i - 1] === "|" && commentMode) {
      commentMode = false;
      working += char + COLOR(getLastRainbowCol());
    }
    else {
      if (colouredText) {
        if (char === "(") {
          working += COLOR(getRainbowColor()) + char;
        } else if (char === ")") {
          working += char + COLOR(getLastRainbowCol());
        } else working += char;
      } else {
        if (char === "(" || char === ")") {
          working +=
            COLOR(getRainbowColor(char === ")" ? 1 : 0)) +
            char +
            COLOR(COLORS.white);
        } else working += char;
      }
    }
  }

  if ((colouredText && parenDepth > 0) || stringMode) working += COLOR(COLORS.white);

  reset();

  return working;
}
