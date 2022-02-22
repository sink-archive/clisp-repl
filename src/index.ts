import { rainbowify } from "./rainbowify";
import { initStdin } from "./stdin";
import { PromptOutput } from "./stdout";

(async () => {
  const readStdin = initStdin();

  const preProcess = (c: string) => c === "\r" ? "\n" : c;
  const postProcess = (str: string) => {
    const lines = str.split("\n");
    
    lines[0] = `> ${lines[0]}`;
    for (let i = 1; i < lines.length; i++)
      lines[i] = `; ${lines[i]}`;
    
    return rainbowify(lines.join("\n"));
  }

  const pOut = new PromptOutput(preProcess, postProcess);

  while (true) {
    const c = await readStdin();
    pOut.writeChar(c);
  }
})()