import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const config = path.join(root, "dist/server/wrangler.json");
const worker = path.join(root, "dist/server/index.js");
const assets = path.join(root, "dist/client");
if (!existsSync(config) || !existsSync(worker) || !existsSync(assets))
  throw new Error(
    "Run npm run build before deployment; the complete Vinext output is required.",
  );

const generated = JSON.parse(readFileSync(config, "utf8"));
assert.equal(generated.name, "dhy");
assert.equal(generated.main, "index.js");
assert.equal(generated.assets?.directory, "../client");
assert.ok(
  generated.d1_databases?.some(
    (db) =>
      db.binding === "DB" &&
      db.database_name === "site-creator-d1" &&
      db.database_id === "7ffb0575-335f-45d7-9eb1-17cbca72626b",
  ),
);
assert.ok(
  generated.r2_buckets?.some(
    (bucket) =>
      bucket.binding === "BUCKET" && bucket.bucket_name === "site-creator-r2",
  ),
);

if (process.argv.includes("--check")) {
  console.log(
    "PASS: deploy entry, static assets, Worker name, D1 and R2 bindings match the existing DHY resources.",
  );
  process.exit(0);
}

const wrangler = path.join(root, "node_modules/wrangler/bin/wrangler.js");
const result = spawnSync(
  process.execPath,
  [wrangler, "deploy", "--config", config],
  {
    cwd: root,
    stdio: "inherit",
  },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
