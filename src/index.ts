import { rainbowify } from "./rainbowify";
import { initStdin } from "./stdin";
import { Prompt } from "./prompt";
import isLisp from "./isLisp";
import { VM, libBasic, run } from "cumlisp";
import installStools from "clisp-stools";
import { CLEAR_LINE, TO_COL } from "./ansi";

const promptForLisp = async () => {
  const preProcess = (c: string) => (c === "\r" ? "\n" : c);
  const postProcess = (str: string) => {
    const lines = str.split("\n");

    lines[0] = `> ${lines[0]}`;
    for (let i = 1; i < lines.length; i++) lines[i] = `; ${lines[i]}`;

    return rainbowify(lines.join("\n"));
  };

  let done = false;

  const preDispCallback = (str: string) => {
    if (isLisp(str)) done = true;
  };

  const prompt = new Prompt(preProcess, postProcess, preDispCallback);

  const readStdin = initStdin();

  while (!done) {
    const c = await readStdin();
    prompt.PutChar(c);
  }

  return prompt.BufferRaw;
};

(async () => {
  const vm = new VM(() => {});
  libBasic.installBasic(vm);
  installStools(vm);

  while (true) {
    const lisp = await promptForLisp();
    const res = await run(`%(${lisp})`, vm);
    console.log(TO_COL(1) + CLEAR_LINE + res);
  }
})();
