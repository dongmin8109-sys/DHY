import assert from "node:assert/strict";

const origin = new URL(
  process.argv[2] ?? "https://dhy.dongmin8109.workers.dev",
);
if (origin.protocol !== "https:")
  throw new Error("Live verification requires HTTPS.");

const page = await fetch(new URL("/", origin), {
  signal: AbortSignal.timeout(15000),
});
const html = await page.text();
assert.equal(
  page.status,
  200,
  `Live page returned ${page.status}: ${html.slice(0, 250)}`,
);
assert.match(html, /DHY \| CLASSIFIED DATABASE/);

const session = await fetch(new URL("/api/session", origin), {
  signal: AbortSignal.timeout(15000),
});
const contentType = session.headers.get("content-type") ?? "";
assert.equal(
  session.status,
  200,
  `Live API returned ${session.status}: ${(await session.text()).slice(0, 250)}`,
);
assert.match(contentType, /application\/json/);

console.log(
  `PASS: ${origin.origin} renders the DHY page and responds to the session API.`,
);
