import {
  asString,
  libBasic,
  run,
  trueValue,
  VM,
  VMScope,
  wrapFunc,
} from "cumlisp";
import { resolve } from "path";
import { readFile } from "fs/promises";
import installStools, { utils as stoolsUtils } from "clisp-stools";
import npmInstall from "./npmInstall.js";

export const makeVM = (currentPath = ".") => {
  const vm = new VM(() => {});
  libBasic.installBasic(vm);
  // @ts-expect-error I HATE NODEJS SO MUCH OH MY GOD
  installStools.default(vm);
  api(vm, currentPath);
  return vm;
};

export const requireFunc = async (path: string, current: string) => {
  const resolvedPath = resolve(current, path);

  const vm = makeVM(resolvedPath);

  const txt = await readFile(resolvedPath, "utf8");

  return await run(`%(${txt})`, vm);
};

const api = (vm: VM, currentPath: string) =>
  vm.install({
    require: wrapFunc("require", 1, ([path]) =>
      requireFunc(asString(path), currentPath)
    ),
    "require-async": wrapFunc("require-async", 1, async ([path]) =>
      stoolsUtils.wrapPromise(requireFunc(asString(path), currentPath))
    ),
    "require-js": wrapFunc("require-js", 1, async ([path]) => {
      const exp = await import(resolve(currentPath, asString(path)));
      if (typeof exp.default !== "function")
        throw new Error(
          "JS file did not export a function. Please export a (VM) => void"
        );
      exp.default(vm);
      return trueValue;
    }),

    "require-npm": wrapFunc("require-npm", 1, async ([pkg]) => {
      const installFunc = await npmInstall(asString(pkg));
      installFunc(vm);
      return trueValue;
    }),

    "require-npm-async": wrapFunc("require-npm-async", 1, async ([pkg]) =>
      stoolsUtils.wrapPromise(
        (async () => {
          const installFunc = await npmInstall(asString(pkg));
          installFunc(vm);
          return trueValue;
        })()
      )
    ),
  });

export default api;
