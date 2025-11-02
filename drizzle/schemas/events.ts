// src/db/schema/events.ts
import { pgTable, serial, varchar, text, timestamp, integer, boolean, numeric, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./user.schema";
import { usersToEvents } from "./usersToEvents";
import { payments } from "./payments";

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  time: varchar("time", { length: 50 }),
  location: varchar("location", { length: 255 }), // if offline
  image: text("image"),
  isOnline: boolean("is_online").default(false).notNull(),
  onlineLink: varchar("online_link", { length: 500 }), // e.g., Zoom/Meet link
  price: numeric("price", { precision: 10, scale: 2 }).default("0.00"), // event fee (0 = free)
  isPaid: boolean("is_paid").default(false),
  organizerId: uuid("organizer_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  attendees: many(usersToEvents),
  payments: many(payments),
}));
