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

  // cursor position - in [y, x] just to annoy people :)
  #seek = [0, 0];

  get #rawSeek() {
    const lineLengths = this.#buffer.split("\n").map((line) => line.length);

    let i = this.#seek[1];
    for (let j = 0; j < this.#seek[0]; j++) i += lineLengths[j] + 1;
    return i;
  }

  #spliceIntoBuffer(c: string) {
    const i = this.#rawSeek;

    const before = this.#buffer.slice(0, i);
    const after = this.#buffer.slice(i);
    this.#buffer = before + c + after;
  }

  #goback() {
    const lineLengths = this.#buffer.split("\n").map((line) => line.length);
    if (this.#seek[1] > 0) this.#seek[1]--;
    else if (this.#seek[0] > 0) {
      this.#seek[0]--;
      this.#seek[1] = lineLengths[this.#seek[0]];
    }
  }

  #gofwd() {
    const lineLengths = this.#buffer.split("\n").map((line) => line.length);
    if (this.#seek[1] < lineLengths[this.#seek[0]]) this.#seek[1]++;
    else if (this.#seek[0] < lineLengths.length) {
      this.#seek[0]++;
      this.#seek[1] = 0;
    }
  }

  writeChar(c: string) {
    if (c.length !== 1) throw new Error("c must be a single character");
    if (c === DELETE_CHAR) this.back(1);
    else {
      this.#spliceIntoBuffer(this.preProcess?.(c));

      const bufSlice = () => {
        let i = this.#rawSeek;
        return this.#buffer.slice(i - 2, i + 1);
      }

      while (bufSlice() === CURBACK(1)) {
        this.back(3, false);
        this.#goback();
      }

      while (bufSlice() === CURFWD(1)) {
        this.back(3, false);
        this.#gofwd();
      }

      this.#gofwd();
    }

    this.#display();
  }

  back(n: number, display = true) {
    this.#buffer = this.#buffer.slice(0, -n);
    for (let i = 0; i < n; i++) this.#goback();
    if (display) this.#display();
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

    stdout.write(toWrite) /* + CURBACK(this.#buffer.length - this.#seek[1]) */;
    this.#lastDisplayLength = toWrite.split("\n").map((line) => line.length);
  }
}
