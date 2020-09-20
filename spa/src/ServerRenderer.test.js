import ServerRenderer from "./ServerRenderer";

test("is replaces the title correctly", () => {
  const sr = new ServerRenderer();
  expect(sr).toBeTruthy();
  return sr.init("./public").then(() => {
    const body = "<div>My body</div>";
    const headElements = "<title>My title</title>";
    const html = sr.renderFullHtml(body, headElements);
    expect(html).toMatch(
      /<html.*<head>.*<title>My title<\/title>.*<\/head>.*<body>.*<div id="root"><div>My body<\/div><\/div>.*<\/body>.*<\/html>/s
    );
  });
});
