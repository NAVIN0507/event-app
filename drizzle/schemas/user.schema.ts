// src/db/schema/users.ts
import { pgTable, serial, varchar, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { events } from "./events";
import { usersToEvents } from "./usersToEvents";
import { payments } from "./payments";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  profileImage: text("profile_image"),
  role: varchar("role", { length: 50 }).notNull().default("attendee"), // 'attendee' | 'organizer'
  organizationName: varchar("organization_name", { length: 255 }), // for organizers only
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }), // store Stripe customer reference
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userRelations = relations(users, ({ many }) => ({
  createdEvents: many(events), // if user is an organizer
  registeredEvents: many(usersToEvents), // if user is an attendee
  payments: many(payments), // Stripe payments
}));
