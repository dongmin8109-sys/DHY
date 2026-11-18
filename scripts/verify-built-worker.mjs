import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const wrangler = path.join(root, "node_modules/wrangler/bin/wrangler.js");
const config = path.join(root, "dist/server/wrangler.json");
const migration = path.join(root, "drizzle/0000_bizarre_wraith.sql");
const bindings = JSON.parse(await readFile(config, "utf8"));
assert.ok(bindings.d1_databases?.some((item) => item.binding === "DB"));
assert.ok(bindings.r2_buckets?.some((item) => item.binding === "BUCKET"));

const state = await mkdtemp(
  path.join(root, ".wrangler", "verify-built-worker-"),
);
const args = [
  "--import",
  new URL("./sites-env.mjs", import.meta.url).href,
  wrangler,
];
const migrate = spawnSync(
  process.execPath,
  [
    ...args,
    "d1",
    "execute",
    "DB",
    "--local",
    "--config",
    config,
    "--persist-to",
    state,
    "--file",
    migration,
  ],
  { cwd: root, encoding: "utf8" },
);
if (migrate.status !== 0)
  throw new Error(`Local D1 migration failed: ${migrate.stderr}`);

const listener = createServer();
await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
const port = listener.address().port;
await new Promise((resolve) => listener.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const worker = spawn(
  process.execPath,
  [
    ...args,
    "dev",
    "--config",
    config,
    "--local",
    "--persist-to",
    state,
    "--ip",
    "127.0.0.1",
    "--port",
    String(port),
    "--inspector-port",
    "0",
  ],
  { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
);
let output = "";
worker.stdout.on("data", (chunk) => {
  output += chunk.toString();
});
worker.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

async function ready() {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (worker.exitCode !== null)
      throw new Error(`Worker exited early: ${output.slice(-2000)}`);
    try {
      const response = await fetch(origin, {
        signal: AbortSignal.timeout(1000),
      });
      return response;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error(`Worker did not start: ${output.slice(-2000)}`);
}

try {
  const page = await ready();
  const html = await page.text();
  assert.equal(
    page.status,
    200,
    `App Router returned ${page.status}: ${html.slice(0, 200)}`,
  );
  assert.match(html, /DHY \| CLASSIFIED DATABASE/);
  assert.match(html, /INITIALIZING SECURE TERMINAL/);

  const session = await fetch(`${origin}/api/session`);
  assert.equal(session.status, 200);
  assert.equal((await session.json()).setupRequired, true);
  assert.equal((await fetch(`${origin}/api/records`)).status, 401);

  const password = randomBytes(24).toString("base64url");
  const bootstrap = await fetch(`${origin}/api/auth/bootstrap`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      "oai-authenticated-user-id": "local-verification-owner",
    },
    body: JSON.stringify({
      username: "verify_admin",
      displayName: "Verify Admin",
      password,
    }),
  });
  if (bootstrap.status !== 201)
    throw new Error(`D1 bootstrap failed: ${await bootstrap.text()}`);

  const login = await fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ username: "verify_admin", password }),
  });
  if (login.status !== 200)
    throw new Error(`Login failed: ${await login.text()}`);
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  const people = await fetch(`${origin}/api/records?kind=person`, {
    headers: { cookie },
  });
  assert.equal(people.status, 200);
  const records = await people.json();
  assert.equal(records.total, 11);

  const form = new FormData();
  form.set("recordId", records.items[0].id);
  form.set("classification", "1");
  form.set(
    "file",
    new Blob(["R2 verification"], { type: "text/plain" }),
    "verify.txt",
  );
  const upload = await fetch(`${origin}/api/files`, {
    method: "POST",
    headers: { origin, cookie },
    body: form,
  });
  if (upload.status !== 201)
    throw new Error(`R2 upload failed: ${await upload.text()}`);
  const { id } = await upload.json();
  const file = await fetch(`${origin}/api/files/${id}`, {
    headers: { cookie },
  });
  assert.equal(file.status, 200);
  assert.equal(await file.text(), "R2 verification");

  console.log(
    "PASS: built Worker rendered App Router page; API routing, D1, login, and R2 round-trip work.",
  );
} finally {
  worker.kill();
  if (
    path.dirname(state) === path.join(root, ".wrangler") &&
    path.basename(state).startsWith("verify-built-worker-")
  )
    await rm(state, { recursive: true, force: true });
}
