// src/db/schema/payments.ts
import { pgTable, serial, varchar, timestamp, numeric, integer, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./user.schema";
import { events } from "./events";

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  eventId: uuid("event_id").references(() => events.id).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("INR"),
  stripePaymentId: varchar("stripe_payment_id", { length: 255 }).notNull(), // PaymentIntent or Checkout ID
  status: varchar("status", { length: 50 }).default("pending"), // 'pending' | 'success' | 'failed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paymentRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [payments.eventId],
    references: [events.id],
  }),
}));
