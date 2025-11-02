// src/db/schema/usersToEvents.ts
import { pgTable, integer, timestamp, primaryKey, boolean, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./user.schema";
import { events } from "./events";

export const usersToEvents = pgTable(
  "users_to_events",
  {
    userId: uuid("user_id").references(() => users.id).notNull(),
    eventId: uuid("event_id").references(() => events.id).notNull(),
    registeredAt: timestamp("registered_at").defaultNow().notNull(),
    checkedIn: boolean("checked_in").default(false).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.eventId] }),
  })
);

export const usersToEventsRelations = relations(usersToEvents, ({ one }) => ({
  user: one(users, {
    fields: [usersToEvents.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [usersToEvents.eventId],
    references: [events.id],
  }),
}));
