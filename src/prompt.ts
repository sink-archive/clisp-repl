import { stdout } from "process";
import {
  CLEAR_LINE,
  CURBACK,
  CURDOWN,
  CURFWD,
  CURUP,
  MOVE_CUR_HORIZ,
  TO_COL,
} from "./ansi.js";

const DELETE_CHAR = "\u007f";

export class Prompt {
  constructor(
    preProcess?: (c: string) => string,
    postProcess?: (str: string) => string,
    preDispCallback?: (str: string) => void
  ) {
    this.PreProcess = preProcess;
    this.PostProcess = postProcess;
    this.PreDisplay = preDispCallback;
    this.#display();
  }

  #buffer = "";
  #lastDisplayLengths: number[] = [0];
  #escapeMode = 0;
  // cursor position - in [y, x] just to annoy people :)
  #seek: [number, number] = [0, 0];
  #lastDisplaySeek: [number, number] = [...this.#seek];

  get BufferRaw() {
    return this.#buffer;
  }
  get BufferProcessed() {
    return this.PostProcess?.(this.#buffer);
  }

  PreProcess;
  PostProcess;
  PreDisplay;

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

  #spliceOutOfBuffer() {
    const i = this.#rawSeek;
    const before = this.#buffer.slice(0, i - 1);
    const after = this.#buffer.slice(i);
    this.#buffer = before + after;
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

  PutChar(c: string) {
    if (c.length !== 1) throw new Error("c must be a single character");

    if (c === DELETE_CHAR) {
      this.#spliceOutOfBuffer();
      this.#goback();
    } else if (this.#escapeMode === 2) {
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
      this.#spliceIntoBuffer(this.PreProcess?.(c));

      this.#gofwd();
    }

    this.#display();
  }

  #wipeLast() {
    let toPrnt = "";

    const movementToSeek = this.#getMovementToSeek(true);
    if (movementToSeek[0] > 0) toPrnt += CURDOWN(movementToSeek[0]);

    this.#lastDisplayLengths.forEach((len, i, a) => {
      toPrnt += TO_COL(1) + CLEAR_LINE;
      if (i !== a.length - 1) toPrnt += CURUP(1);
    });

    stdout.write(toPrnt);
    this.#lastDisplayLengths = [];
  }

  #getMovementToSeek(last = false) {
    const splitBuffer = last
      ? this.#lastDisplayLengths
      : this.#buffer.split("\n").map((l) => l.length);
    const currentPos = [
      splitBuffer.length - 1,
      splitBuffer[splitBuffer.length - 1],
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
    this.PreDisplay?.(this.#buffer);

    const toWrite = this.BufferProcessed;

    this.#wipeLast();

    stdout.write(toWrite + this.#moveCursorToSeek());
    this.#lastDisplayLengths = toWrite.split("\n").map((line) => line.length);
    this.#lastDisplaySeek = [...this.#seek];
  }
}
