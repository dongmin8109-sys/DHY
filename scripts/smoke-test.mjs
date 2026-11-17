// Run against a fresh local preview only. Production data is never touched.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

const base = process.env.DHY_TEST_BASE ?? "http://127.0.0.1:5173";
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base))
  throw new Error("Smoke test requires a local preview URL.");
const password = randomBytes(24).toString("base64url");
const investigatorPassword = randomBytes(24).toString("base64url");
async function call(path, { method = "GET", data, cookie } = {}) {
  const response = await fetch(`${base}/api/${path}`, {
    method,
    headers: {
      origin: base,
      ...(data ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  const payload = await response.json();
  return {
    status: response.status,
    payload,
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
}

const initial = await call("session");
assert.equal(initial.status, 200);
assert.equal(
  initial.payload.setupRequired,
  true,
  "Use a fresh local preview database for this smoke test.",
);
assert.equal((await call("records")).status, 401);
assert.equal(
  (
    await call("auth/bootstrap", {
      method: "POST",
      data: {
        username: "local_smoke_admin",
        displayName: "Local Smoke Admin",
        password,
      },
    })
  ).status,
  201,
);
const login = await call("auth/login", {
  method: "POST",
  data: { username: "local_smoke_admin", password },
});
assert.equal(login.status, 200);
assert.ok(login.cookie?.startsWith("dhy_session="));
const adminCookie = login.cookie;
const people = await call("records?kind=person", { cookie: adminCookie });
assert.equal(people.status, 200);
assert.equal(people.payload.total, 11);
const bomi = people.payload.items.find((item) => item.title === "장보미");
assert.ok(bomi);
const adminBomi = await call(`records/${bomi.id}`, { cookie: adminCookie });
assert.equal(
  adminBomi.payload.record.data.secretPage.title,
  "착한 척하는 인격",
);
assert.equal(adminBomi.payload.record.wanted, false);
const dashboard = await call("dashboard", { cookie: adminCookie });
assert.equal(dashboard.payload.counts.person, 11);
assert.equal(dashboard.payload.counts.organization, 4);
assert.equal(dashboard.payload.counts.region, 2);
assert.equal(
  people.payload.items.find((item) => item.title === "주민홍")?.status,
  "탈옥",
);
assert.equal(
  people.payload.items.find((item) => item.title === "김지현")?.status,
  "탈옥",
);
assert.equal(
  people.payload.items.find((item) => item.title === "박소민")?.data.opkPercent,
  1,
);
const graph = await call("graph?q=홍범준", { cookie: adminCookie });
assert.equal(graph.status, 200);
assert.ok(graph.payload.nodes.some((item) => item.title === "홍범준"));
assert.ok(graph.payload.edges.some((item) => item.label === "직속부하"));
const createUser = await call("users", {
  method: "POST",
  cookie: adminCookie,
  data: {
    username: "local_smoke_investigator",
    displayName: "Local Smoke Investigator",
    password: investigatorPassword,
    role: "investigator",
    clearance: 6,
  },
});
assert.equal(createUser.status, 201);
const investigator = await call("auth/login", {
  method: "POST",
  data: {
    username: "local_smoke_investigator",
    password: investigatorPassword,
  },
});
assert.equal(investigator.status, 200);
const investigatorCookie = investigator.cookie;
const restricted = await call(`records/${bomi.id}`, {
  cookie: investigatorCookie,
});
assert.equal(restricted.status, 200);
assert.equal(restricted.payload.record.data.secretPage, undefined);
const document = await call("records", {
  method: "POST",
  cookie: adminCookie,
  data: {
    kind: "document",
    title: "LOCAL REDACTION TEST",
    classification: 1,
    status: "미확인",
    data: {
      sections: [
        { text: "LOCAL PRIVATE SECTION", classification: 7, redacted: true },
      ],
    },
  },
});
assert.equal(document.status, 201);
const lowDocument = await call(`records/${document.payload.id}`, {
  cookie: investigatorCookie,
});
assert.equal(
  lowDocument.payload.record.data.sections[0].text,
  "[REDACTED / 검열됨]",
);
assert.equal(lowDocument.payload.editRecord, null);
const highDocument = await call(`records/${document.payload.id}`, {
  cookie: adminCookie,
});
assert.equal(
  highDocument.payload.record.data.sections[0].text,
  "[REDACTED / 검열됨]",
);
assert.equal(
  highDocument.payload.editRecord.data.sections[0].text,
  "LOCAL PRIVATE SECTION",
);
const secretSearch = await call("records?q=LOCAL%20PRIVATE%20SECTION", {
  cookie: investigatorCookie,
});
assert.equal(secretSearch.payload.total, 0);
assert.equal(
  (
    await call(`records/${document.payload.id}`, {
      method: "DELETE",
      cookie: adminCookie,
    })
  ).status,
  200,
);
assert.equal(
  (
    await call("records", {
      method: "POST",
      cookie: investigatorCookie,
      data: { kind: "person", title: "test" },
    })
  ).status,
  404,
);
assert.notEqual(
  (await call("export", { cookie: investigatorCookie })).status,
  200,
);
assert.equal(
  (
    await call("auth/login", {
      method: "POST",
      data: { username: "local_smoke_admin", password: "incorrect" },
    })
  ).status,
  401,
);
const audit = await call("audit", { cookie: adminCookie });
assert.ok(audit.payload.items.some((item) => item.event === "auth.failure"));
const created = await call("records", {
  method: "POST",
  cookie: adminCookie,
  data: {
    kind: "person",
    title: "LOCAL TEST RECORD",
    classification: 1,
    status: "미확인",
    data: {},
  },
});
assert.equal(created.status, 201);
assert.equal(
  (
    await call(`records/${created.payload.id}`, {
      method: "DELETE",
      cookie: adminCookie,
    })
  ).status,
  200,
);
assert.equal(
  (await call("records?kind=person", { cookie: adminCookie })).payload.total,
  11,
);
assert.equal(
  (await call("auth/logout", { method: "POST", cookie: adminCookie })).status,
  200,
);
assert.equal((await call("dashboard", { cookie: adminCookie })).status, 401);
console.log(
  "PASS: bootstrap, login, DB seed, dashboard, clearance filtering, write authorization, audit, soft delete, logout",
);
