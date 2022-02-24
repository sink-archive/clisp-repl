export default (str: string) => {
  if (str.length === 0 || str[str.length - 1] !== "\n") return false;
  
  let parenLevel = 0,
    stringMode = false,
    commentMode = false;

  for (let i = 0; i < str.length; i++) {
    switch (str[i]) {
      case '"':
        if (!commentMode) stringMode = !stringMode;
        break;
      case "(":
        if (!stringMode && !commentMode) parenLevel++;
        break;
      case ")":
        if (!stringMode && !commentMode) parenLevel--;
        break;
      case "|":
        if (str[i - 1] === "#" && !commentMode) commentMode = true;
        break;
      case "#":
        if (str[i - 1] === "|" && commentMode) commentMode = false;
        break;
    }
  }

  return (
    parenLevel === 0 &&
    !stringMode &&
    !commentMode
  );
};
