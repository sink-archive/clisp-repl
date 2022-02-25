import { run } from "cumlisp";
import { readFile } from "fs/promises";
import { dirname, resolve } from "path";
import { argv } from "process";
import { COLOR, COLORS } from "./ansi.js";
import { makeVM } from "./api.js";
import interactive from "./interactive.js";

const args = argv[0].includes("node") ? argv.slice(2) : argv.slice(1);

if (args.length === 0) await interactive();

const vm = makeVM(dirname(resolve(args[0])));
const buf = await readFile(args[0]);
try {
  const res = await run(`%(${buf.toString()})`, vm);
  console.log(COLOR(COLORS.green) + res + COLOR(COLORS.white));
} catch (e) {
  console.error(COLOR(COLORS.red) + e + COLOR(COLORS.white));
}