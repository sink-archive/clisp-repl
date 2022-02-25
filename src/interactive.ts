import { rainbowify } from "./rainbowify.js";
import { initStdin } from "./stdin.js";
import { Prompt } from "./prompt.js";
import isLisp from "./isLisp.js";
import { run } from "cumlisp";
import { CLEAR_LINE, COLOR, COLORS, TO_COL } from "./ansi.js";
import { makeVM } from "./api.js";
import { stdout } from "process";

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

export default async () => {
  const vm = makeVM();

  while (true) {
    const lisp = await promptForLisp();
    stdout.write(TO_COL(1) + CLEAR_LINE);
    try {
      const res = await run(`%(${lisp})`, vm);
      console.log(res);
    } catch (e) {
      console.error(COLOR(COLORS.red) + e + COLOR(COLORS.white));
    }
  }
};
