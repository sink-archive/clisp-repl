import { exec } from "child_process";
import { mkdtemp, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

export default async (pkgName: string) => {
  const dirName = await mkdtemp(join(tmpdir(), "clisp-npm-"));
  const proc = exec(`cd ${dirName} && npm i ${pkgName}`);
  await new Promise((res) => proc.on("exit", res));

  const pkgPath = join(dirName, "node_modules", pkgName);
  const pkgJsonPath = join(pkgPath, "package.json");
  const pkgJson = JSON.parse(await readFile(pkgJsonPath, "utf8"));
  const mainPath = join(pkgPath, pkgJson.main ?? pkgJson.module);

  const exp = await import(mainPath);
  if (typeof exp.default !== "function")
    throw new Error(
      "JS file did not export a function. Please export a (VM) => void"
    );
  
  return exp.default;
}