import { pgTable, unique, uuid, text, timestamp, serial, varchar, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const craftpartsSyncHistory = pgTable("craftparts_sync_history", {
  id: serial().primaryKey().notNull(),
  connectorType: varchar("connector_type", { length: 255 }).default(''),
  status: varchar({ length: 255 }).default(''),
  lastOperation: varchar("last_operation", { length: 255 }).default(''),
  lastOperationTs: timestamp("last_operation_ts", { mode: "string" }),
  lastErrorMessage: text("last_error_message").default(''),
  attemptCount: integer("attempt_count").default(0),
  bindingId: varchar("binding_id", { length: 255 }).default(''),
  entityType: varchar("entity_type", { length: 255 }).default(''),
  externDescription: varchar("extern_description", { length: 255 }).default(''),
  externId: varchar("extern_id", { length: 255 }).notNull(),
  source: varchar({ length: 255 }).default(''),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
}, (table) => [
  unique("craftparts_sync_history_extern_id_key").on(table.externId),
]);

export const tblAcBcCustPriceClassHyphen = pgTable("tbl_ac_bc_custPriceClass_pr2c7ic0n-d3v", {
  customerId: uuid("customer_id").defaultRandom().primaryKey().notNull(),
  acCustomerId: text("ac_customer_id"),
  acCustomerName: text("ac_customer_name"),
  email: text(),
  priceClass: text("price_class"),
  createdAt: timestamp("created_at", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  unique("customer_key_ingest_ac_bc_custPriceClass_pr2c7ic0n-d3v").on(table.email),
]);

export const tblAcBcCustPriceClassUnderscore = pgTable("tbl_ac_bc_custPriceClass_pr2c7ic0n_d3v", {
  customerId: uuid("customer_id").defaultRandom().primaryKey().notNull(),
  acCustomerId: text("ac_customer_id"),
  acCustomerName: text("ac_customer_name"),
  email: text(),
  priceClass: text("price_class"),
  createdAt: timestamp("created_at", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  unique("pre").on(table.email),
]);

export const lastExecutionOfFlows = pgTable("last_execution_of_flows", {
  flowKey: text("flow_key").primaryKey().notNull(),
  tenantId: text("tenant_id"),
  flow: text(),
  triggerType: text("trigger_type"),
  lastExecution: timestamp("last_execution", { mode: "string" }),
});
