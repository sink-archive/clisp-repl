import { asString, libBasic, run, VM, VMScope, wrapFunc } from "cumlisp";
import { resolve } from "path";
import { readFile } from "fs/promises";
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
  });

export default api;