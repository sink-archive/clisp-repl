import { stdin } from "process";

export function initStdin() {
  stdin.setRawMode?.(true);
  stdin.resume();
  stdin.setEncoding("utf8");
  //stdin.on("end", endStdin);

  let buffer = "";

  return (): Promise<string> => {
    if (buffer.length > 0) {
      const first = buffer[0];
      buffer = buffer.slice(1);
      return Promise.resolve(first);
    }

    return new Promise((res) => {
      const handler = (chunk: Buffer) => {
        const str = chunk.toString();
        if (str.length > 0) {
          buffer += str.substring(1);
        }

        // ctrl-c
        if (str[0] === "\u0003")
          process.exit();

        res(str[0]);
        stdin.off("data", handler);
      };
      stdin.on("data", handler);
    });
  };
}

export function endStdin() {
  stdin.setRawMode?.(false);
  stdin.destroy();
}
