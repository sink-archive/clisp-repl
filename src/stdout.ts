import { stdout } from "process";
import { CLEAR_LINE, CURBACK, CURFWD, CURUP, TO_COL } from "./ansi";

const DELETE_CHAR = "\u007f";

export class PromptOutput {
  constructor(
    preProcess?: (c: string) => string,
    postProcess?: (str: string) => string
  ) {
    this.preProcess = preProcess;
    this.postProcess = postProcess;
    this.#display();
  }

  #buffer = "";
  #lastDisplayLength: number[] = [];

  get bufferRaw() {
    return this.#buffer;
  }
  get bufferProcessed() {
    return this.postProcess?.(this.#buffer);
  }

  preProcess;

  postProcess;

  // seeks *backwards* from the end to make my life easier
  #seekBack = 0;

  #spliceIntoBuffer(i: number, c: string) {
    const before = this.#buffer.slice(0, i);
    const after = this.#buffer.slice(i);
    this.#buffer = before + c + after;
  }

  writeChar(c: string) {
    if (c.length !== 1) throw new Error("c must be a single character");
    if (c === DELETE_CHAR) this.back(1);
    else this.#spliceIntoBuffer(this.#buffer.length - this.#seekBack, this.preProcess?.(c));

    while (this.#buffer.endsWith(CURBACK(1))) {
      const split = this.#buffer.split("\n")
      let lI = split.length - 1;
      let _s = this.#seekBack;
      for (; lI >= 0; lI--) {
        if (_s > split[lI].length) 
          _s -= split[lI].length;
      }
      if (_s < 0)
        this.#seekBack++;
      this.#buffer = this.#buffer.slice(0, -3);
    }

    while (this.#buffer.endsWith(CURFWD(1))) {
      if (this.#seekBack > 0)
        this.#seekBack--;
      this.#buffer = this.#buffer.slice(0, -3);
    }

    this.#display();
  }

  /* remove() {
    this.#wipeLast();
    this.#buffer = "";
  } */

  back(n: number) {
    this.#buffer = this.#buffer.slice(0, -n);
    this.#display();
  }

  #wipeLast() {
    let toPrnt = "";

    this.#lastDisplayLength.forEach((len, i, a) => {
      toPrnt += TO_COL(1) + CLEAR_LINE;
      if (i !== a.length - 1) toPrnt += CURUP(1);
    });

    stdout.write(toPrnt);
    this.#lastDisplayLength = [];
  }

  #display() {
    const toWrite = this.bufferProcessed;

    this.#wipeLast();

    stdout.write(toWrite) + CURBACK(this.#seekBack);
    this.#lastDisplayLength = toWrite.split("\n").map((line) => line.length);
  }
}
