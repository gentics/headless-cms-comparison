import ServerRenderer from "../src/ServerRenderer";
import path from "path";
import fs from "fs";

async function main() {
  const buildDir = path.resolve(__dirname, "../dist/client/");

  const sr = new ServerRenderer(buildDir);
  await sr.init();
  await sr.create("/tmp/output");
}

main()
  .then(() => {
    console.log("Done!");
  })
  .catch((err) => console.error(err));
