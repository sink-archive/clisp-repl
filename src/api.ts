import { asString, libBasic, run, trueValue, VM, VMScope, wrapFunc } from "cumlisp";
import { join, resolve } from "path";
import * as os from "os"
import { exec } from "child_process";
import { mkdtemp, readFile } from "fs/promises";
import installStools from "clisp-stools"
import { wrapPromise } from "clisp-stools/dist/utils";

export const makeVM = (currentPath = ".") => {
  const vm = new VM(() => {});
  libBasic.installBasic(vm);
  installStools(vm);
  api(vm, currentPath);
  return vm;
};

export const requireFunc = async (path: string, current: string) => {
  const resolvedPath = resolve(current, path);
  
  const vm = makeVM(resolvedPath);

  const txt = await readFile(resolvedPath, "utf8");

  return await run(`%(${txt})`, vm);
}

const api = (vm: VM, currentPath: string) =>
  vm.install({
    require: wrapFunc("require", 1, ([path]) =>
      requireFunc(asString(path), currentPath)
    ),
    "require-async": wrapFunc("require-async", 1, async ([path]) =>
      wrapPromise(requireFunc(asString(path), currentPath))
    ),
    "require-js": wrapFunc("require-js", 1, async ([path]) => {
      const exp = await import(resolve(currentPath, asString(path)));
      if (typeof exp.default !== "function")
        throw new Error("JS file did not export a function. Please export a (VM) => void");
      exp.default(vm);
      return trueValue;
    }),

    "require-npm": wrapFunc("require-npm", 1, async ([pkg]) => {
      const pkgName = asString(pkg);
      const dirName = await mkdtemp(join(os.tmpdir(), "clisp-npm-"))
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
      exp.default(vm);
      return trueValue;
    })
  });

export default api;