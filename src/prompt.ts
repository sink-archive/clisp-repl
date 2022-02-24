import { stdout } from "process";
import {
  CLEAR_LINE,
  CURBACK,
  CURDOWN,
  CURFWD,
  CURUP,
  MOVE_CUR_HORIZ,
  TO_COL,
} from "./ansi";

const DELETE_CHAR = "\u007f";

export class Prompt {
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
  #escapeMode = 0;
  // cursor position - in [y, x] just to annoy people :)
  #seek: [number, number] = [0, 0];
  #lastDisplaySeek: [number, number] = [...this.#seek];

  get bufferRaw() {
    return this.#buffer;
  }
  get bufferProcessed() {
    return this.postProcess?.(this.#buffer);
  }

  preProcess;

  postProcess;

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
    else if (this.#seek[0] < lineLengths.length - 1) {
      this.#seek[0]++;
      this.#seek[1] = 0;
    }
  }

  writeChar(c: string) {
    if (c.length !== 1) throw new Error("c must be a single character");

    if (c === DELETE_CHAR) this.back(1);
    else if (this.#escapeMode === 2) {
      switch (c) {
        case "D":
          this.#goback();
          break;
        case "C":
          this.#gofwd();
          break;
      }
      this.#escapeMode = 0;
    } else if (this.#escapeMode === 1) this.#escapeMode = c === "[" ? 2 : 0;
    else if (this.#escapeMode === 0 && c === "\u001b") this.#escapeMode = 1;
    else {
      this.#spliceIntoBuffer(this.preProcess?.(c));

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

    const movementToSeek = this.#getMovementToSeek(true);
    if (movementToSeek[0] > 0) toPrnt += CURDOWN(movementToSeek[0]);

    this.#lastDisplayLength.forEach((len, i, a) => {
      toPrnt += TO_COL(1) + CLEAR_LINE;
      if (i !== a.length - 1) toPrnt += CURUP(1);
    });

    stdout.write(toPrnt);
    this.#lastDisplayLength = [];
  }

  #getMovementToSeek(last = false) {
    const splitBuffer = this.#buffer.split("\n");
    const currentPos = [
      splitBuffer.length - 1,
      splitBuffer[splitBuffer.length - 1].length,
    ];

    const seek = last ? this.#lastDisplaySeek : this.#seek;

    return [currentPos[0] - seek[0], seek[1] - currentPos[1]];
  }

  #moveCursorToSeek() {
    const movement = this.#getMovementToSeek();

    let buf = "";

    if (movement[0] > 0) buf += CURUP(movement[0]);

    buf += MOVE_CUR_HORIZ(movement[1]);

    return buf;
  }

  #display() {
    const toWrite = this.bufferProcessed;

    this.#wipeLast();

    stdout.write(toWrite + this.#moveCursorToSeek());
    this.#lastDisplayLength = toWrite.split("\n").map((line) => line.length);
    this.#lastDisplaySeek = [...this.#seek];
  }
}
