import {
  integer,
  sqliteTable,
  text,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    displayName: text("display_name").notNull(),
    role: text("role").notNull(),
    clearance: integer("clearance").notNull().default(0),
    passwordSalt: text("password_salt").notNull(),
    passwordHash: text("password_hash").notNull(),
    ownerIdentity: text("owner_identity"),
    active: integer("active").notNull().default(1),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [uniqueIndex("users_username_idx").on(t.username)],
);

export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const records = sqliteTable(
  "records",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    recordNo: text("record_no").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    classification: integer("classification").notNull().default(0),
    status: text("status").notNull().default("미확인"),
    wanted: integer("wanted"),
    danger: text("danger"),
    photoKey: text("photo_key"),
    data: text("data").notNull().default("{}"),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    deletedAt: integer("deleted_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("records_no_idx").on(t.recordNo),
    index("records_kind_idx").on(t.kind, t.deletedAt, t.updatedAt),
    index("records_title_idx").on(t.title),
    index("records_status_idx").on(t.status),
  ],
);

export const relations = sqliteTable("relations", {
  id: text("id").primaryKey(),
  sourceId: text("source_id")
    .notNull()
    .references(() => records.id),
  targetId: text("target_id")
    .notNull()
    .references(() => records.id),
  label: text("label").notNull(),
  classification: integer("classification").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const files = sqliteTable(
  "files",
  {
    id: text("id").primaryKey(),
    recordId: text("record_id")
      .notNull()
      .references(() => records.id),
    objectKey: text("object_key").notNull(),
    filename: text("filename").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    classification: integer("classification").notNull().default(0),
    uploadedBy: text("uploaded_by").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("files_record_idx").on(t.recordId)],
);

export const revisions = sqliteTable(
  "revisions",
  {
    id: text("id").primaryKey(),
    recordId: text("record_id")
      .notNull()
      .references(() => records.id),
    snapshot: text("snapshot").notNull(),
    actorId: text("actor_id").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("revisions_record_idx").on(t.recordId)],
);

export const audit = sqliteTable(
  "audit",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id"),
    event: text("event").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    detail: text("detail"),
    ip: text("ip"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

export const loginAttempts = sqliteTable(
  "login_attempts",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    ip: text("ip").notNull(),
    success: integer("success").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("login_attempts_idx").on(t.username, t.ip, t.createdAt)],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
