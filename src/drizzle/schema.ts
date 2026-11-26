import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const ts = () =>
  timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow();
const upd = () =>
  timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow();

// ---- users ----
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("email_verified"),
    passwordHash: text("password_hash"),
    image: text("image"),
    isAdmin: boolean("is_admin").notNull().default(false),
    role: varchar("role", { length: 16 }).notNull().default("user"),
    createdAt: ts(),
    updatedAt: upd(),
  },
  (t) => [index("users_email_idx").on(t.email)]
);

// ---- workspaces ----
export const workspaces = pgTable(
  "workspaces",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    isPersonal: boolean("is_personal").notNull().default(true),
    createdBy: text("created_by").notNull(),
    createdAt: ts(),
    updatedAt: upd(),
  },
  (t) => [index("workspaces_slug_idx").on(t.slug)]
);

// ---- memberships ----
export const memberships = pgTable(
  "memberships",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    userId: text("user_id").notNull(),
    workspaceId: text("workspace_id").notNull(),
    role: text("role").notNull().default("member"),
    invitedBy: text("invited_by"),
    acceptedAt: timestamp("accepted_at"),
    createdAt: ts(),
  },
  (t) => [
    uniqueIndex("memberships_user_workspace_idx").on(t.userId, t.workspaceId),
    index("memberships_workspace_idx").on(t.workspaceId),
    index("memberships_user_idx").on(t.userId),
  ]
);

// ---- projects ----
export const projects = pgTable(
  "projects",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    userId: text("user_id"),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    status: text("status").notNull().default("draft"),
    type: text("type").notNull().default("video"),
    brandKitId: text("brand_kit_id"),
    timelineId: text("timeline_id"),
    createdAt: ts(),
    updatedAt: upd(),
  },
  (t) => [index("projects_workspace_idx").on(t.workspaceId)]
);

// ---- timelines ----
export const timelines = pgTable(
  "timelines",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    projectId: text("project_id").notNull().unique(),
    width: text("width"),
    aspectRatio: text("aspect_ratio"),
  },
  (t) => [index("timelines_project_idx").on(t.projectId)]
);

export const timelineTracks = pgTable(
  "timeline_tracks",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    timelineId: text("timeline_id").notNull(),
    name: text("name").notNull(),
    trackType: text("track_type").notNull(),
    order: integer("order").notNull(),
    createdAt: ts(),
  },
  (t) => [index("timeline_tracks_timeline_idx").on(t.timelineId)]
);

export const timelineClips = pgTable(
  "timeline_clips",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    timelineId: text("timeline_id"),
    trackId: text("track_id"),
    assetId: text("asset_id"),
    generationId: text("generation_id"),
    startTime: real("start_time").notNull().default(0),
    duration: real("duration").notNull().default(0),
    order: integer("order").notNull().default(0),
    opacity: real("opacity").notNull().default(1),
    text: text("text"),
    voiceoverId: text("voiceover_id"),
    keyframes: jsonb("keyframes"),
    transitions: jsonb("transitions").$type<string[]>(),
    isHidden: boolean("is_hidden").notNull().default(false),
    createdAt: ts(),
    updatedAt: upd(),
  },
  (t) => [index("timeline_clips_track_idx").on(t.trackId)]
);

// ---- assets ----
export const assets = pgTable(
  "assets",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    projectId: text("project_id"),
    ownerId: text("owner_id").notNull(),
    kind: text("kind").notNull(),
    url: text("url").notNull(),
    mimeType: text("mime_type"),
    width: integer("width"),
    height: integer("height"),
    duration: real("duration"),
    fileSize: bigint("file_size", { mode: "bigint" }),
    isGenerated: boolean("is_generated").notNull().default(false),
    metadata: jsonb("metadata"),
    createdAt: ts(),
    updatedAt: upd(),
  },
  (t) => [index("assets_workspace_idx").on(t.workspaceId)]
);

// ---- generations ----
export const generations = pgTable(
  "generations",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    projectId: text("project_id"),
    userId: text("user_id").notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    kind: text("kind").notNull(),
    prompt: text("prompt"),
    status: text("status").notNull().default("queued"),
    jobId: text("job_id"),
    progress: jsonb("progress"),
    providerMetadata: jsonb("provider_metadata"),
    resultUrl: text("result_url"),
    resultAssetId: text("result_asset_id"),
    estimatedCredits: real("estimated_credits").notNull().default(0),
    creditsUsed: real("credits_used"),
    error: text("error"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: ts(),
    updatedAt: upd(),
  },
  (t) => [index("generations_workspace_idx").on(t.workspaceId)]
);

export const generationEvents = pgTable(
  "generation_events",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    generationId: text("generation_id").notNull(),
    eventType: text("event_type").notNull(),
    message: text("message"),
    progress: real("progress"),
    details: jsonb("details"),
    createdAt: ts(),
  }
);

// ---- AI providers & models ----
export const aiProviders = pgTable(
  "ai_providers",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    type: text("type").notNull(),
    status: text("status").notNull().default("active"),
    apiKeyEnvVar: text("api_key_env_var").notNull(),
    baseUrl: text("base_url"),
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: ts(),
  }
);

export const aiModels = pgTable(
  "ai_models",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    providerId: text("provider_id").notNull(),
    modelName: text("model_name").notNull(),
    displayName: text("display_name").notNull(),
    capabilities: jsonb("capabilities").notNull(),
    status: text("status").notNull().default("active"),
    priority: integer("priority").notNull().default(0),
    createdAt: ts(),
  }
);

// ---- credits ----
export const creditAccounts = pgTable(
  "credit_accounts",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    workspaceId: text("workspace_id").notNull().unique(),
    ownerId: text("owner_id").notNull(),
    balance: text("balance").notNull().default("0"),
    creditsUsed: text("credits_used").notNull().default("0"),
    totalSpent: text("total_spent").notNull().default("0"),
    createdAt: ts(),
    updatedAt: upd(),
  }
);

export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    accountId: text("account_id").notNull(),
    type: text("type").notNull(),
    amount: text("amount").notNull(),
    reason: text("reason"),
    generationId: text("generation_id"),
    subscriptionId: text("subscription_id"),
    stripeInvoiceId: text("stripe_invoice_id"),
    idempotencyKey: text("idempotency_key").unique(),
    createdAt: ts(),
  }
);

// ---- subscriptions ----
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    userId: text("user_id").notNull(),
    workspaceId: text("workspace_id").notNull(),
    plan: text("plan").notNull().default("free"),
    status: text("status").notNull().default("active"),
    stripeCustomerId: text("stripe_customer_id").unique(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    paidInvoiceId: text("paid_invoice_id").unique(),
    maxProjects: integer("max_projects"),
    maxVideoSecondsPerGeneration: real("max_video_seconds_per_generation")
      .notNull()
      .default(60),
    startedAt: ts(),
    endsAt: timestamp("ends_at"),
    cancelledAt: timestamp("cancelled_at"),
    createdAt: ts(),
    updatedAt: upd(),
  }
);

// ---- exports ----
export const exportsTable = pgTable(
  "exports",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    projectId: text("project_id").notNull(),
    userId: text("user_id").notNull(),
    status: text("status").notNull().default("pending"),
    fileUrl: text("file_url"),
    fileSize: bigint("file_size", { mode: "bigint" }),
    platform: text("platform"),
    duration: real("duration"),
    presetName: text("preset_name"),
    creditsUsed: real("credits_used").notNull().default(0),
    error: text("error"),
    createdAt: ts(),
    completedAt: timestamp("completed_at"),
  },
  (t) => [index("exports_workspace_idx").on(t.workspaceId)]
);

// ---- templates ----
export const templates = pgTable(
  "templates",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    kind: text("kind").notNull(),
    prompt: text("prompt"),
    assetUrl: text("asset_url"),
    isPublic: boolean("is_public").notNull().default(false),
    createdAt: ts(),
  }
);

// ---- brand kits ----
export const brandKits = pgTable(
  "brand_kits",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    name: text("name").notNull(),
    isDefault: boolean("is_default").notNull().default(true),
    colors: jsonb("colors").notNull(),
    fonts: jsonb("fonts").notNull(),
    typography: text("typography"),
    createdAt: ts(),
  }
);

// ---- comments ----
export const comments = pgTable(
  "comments",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    projectId: text("project_id").notNull(),
    userId: text("user_id").notNull(),
    text: text("text").notNull(),
    parentId: text("parent_id"),
    createdAt: ts(),
    updatedAt: upd(),
  },
  (t) => [index("comments_project_idx").on(t.projectId)]
);

// ---- invitations ----
export const invitations = pgTable(
  "invitations",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    email: text("email").notNull(),
    role: text("role").notNull().default("member"),
    token: text("token").notNull().unique(),
    invitedBy: text("invited_by").notNull(),
    acceptedAt: timestamp("accepted_at"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: ts(),
  }
);

// ---- publishing ----
export const publishingAccounts = pgTable(
  "publishing_accounts",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    userId: text("user_id").notNull(),
    workspaceId: text("workspace_id").notNull(),
    provider: text("provider").notNull(),
    accountId: text("account_id").notNull(),
    accountName: text("account_name"),
    createdAt: ts(),
  }
);

export const publishingJobs = pgTable(
  "publishing_jobs",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    userId: text("user_id").notNull(),
    workspaceId: text("workspace_id").notNull(),
    projectId: text("project_id"),
    exportId: text("export_id"),
    platform: text("platform").notNull(),
    status: text("status").notNull().default("queued"),
    assetId: text("asset_id"),
    scheduledFor: timestamp("scheduled_for"),
    publishedAt: timestamp("published_at"),
    error: text("error"),
    createdAt: ts(),
    updatedAt: upd(),
  }
);

// ---- audit ----
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id", { length: 40 }).primaryKey(),
  userId: text("user_id"),
  workspaceId: text("workspace_id"),
  action: text("action").notNull(),
  resource: text("resource"),
  resourceId: text("resource_id"),
  details: jsonb("details"),
  ip: text("ip"),
  createdAt: ts(),
});
