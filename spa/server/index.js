import ServerRenderer from "../src/ServerRenderer";
import path from "path";

const outputDir = "/tmp/output";

async function main() {
  const buildDir = path.resolve(__dirname, "../client/");

  const sr = new ServerRenderer(buildDir);
  await sr.init();
  await sr.create(outputDir);
}

main()
  .then(() => {
    console.log(`Done creating output in ${outputDir}.`);
  })
  .catch(console.error);
