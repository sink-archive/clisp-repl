let parenDepth = 0;
let stringMode = false;

export function processCharacter(char: string) {
  switch (char) {
    case '"':
      stringMode = !stringMode;
      break;
    case "(":
      if (!stringMode) parenDepth++;
      break;
    case ")":
      if (!stringMode) parenDepth--;
      break;
  }
}

export function reset() {
  parenDepth = 0;
  stringMode = false;
}
