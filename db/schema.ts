import { pgTable, uuid, text, timestamp, pgEnum, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const stickerStatus = pgEnum('sticker_status', ['active', 'inactive']);
export const vehicleType = pgEnum('vehicle_type', [
  'car',
  'bike',
  'scooter',
  'auto',
  'bus',
  'truck',
  'other',
]);
export const incidentStatus = pgEnum('incident_status', [
  'pending',
  'notified',
  'failed',
  'resolved',
  'cancelled',
]);
export const messageStatus = pgEnum('message_status', ['queued', 'sent', 'failed']);
export const messageProvider = pgEnum('message_provider', ['mtalkz', 'whatsapp', 'call']);
// free: push only. premium: push + SMS + WhatsApp. premium_pro: + phone call (placeholder).
// No self-serve payment flow yet — admin-granted only via admin_set_user_plan().
export const userPlan = pgEnum('user_plan', ['free', 'premium', 'premium_pro']);

// Sticker owners. `auth_user_id` links to Supabase Auth when the owner has an account;
// nullable so an owner can be provisioned (e.g. by an admin) before they ever sign in.
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  authUserId: uuid('auth_user_id'),
  name: text('name'),
  phoneNumber: text('phone_number'),
  plan: userPlan('plan').default('free').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// One row per physical/printed sticker (QR code -> /scan/[sticker_id]).
export const stickers = pgTable('stickers', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerUserId: uuid('owner_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  vehicleHint: text('vehicle_hint'),
  vehicleType: vehicleType('vehicle_type'),
  status: stickerStatus('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// One row per scan-and-notify event.
export const incidents = pgTable('incidents', {
  id: uuid('id').defaultRandom().primaryKey(),
  stickerId: uuid('sticker_id')
    .notNull()
    .references(() => stickers.id, { onDelete: 'cascade' }),
  status: incidentStatus('status').default('pending').notNull(),
  reporterNote: text('reporter_note'),
  // False when this scan's alert was suppressed by rate-limiting/dedupe (see
  // supabase/functions/trigger-sms/index.ts) rather than actually sent to the owner.
  alertAttempted: boolean('alert_attempted').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

// Append-only log of every outbound SMS attempt, written exclusively by the trigger-sms
// edge function via the service role. Never exposed to anon/authenticated clients.
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  incidentId: uuid('incident_id')
    .notNull()
    .references(() => incidents.id, { onDelete: 'cascade' }),
  provider: messageProvider('provider').default('mtalkz').notNull(),
  toNumber: text('to_number').notNull(),
  body: text('body').notNull(),
  status: messageStatus('status').default('queued').notNull(),
  providerResponse: jsonb('provider_response'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  stickers: many(stickers),
}));

export const stickersRelations = relations(stickers, ({ one, many }) => ({
  owner: one(users, { fields: [stickers.ownerUserId], references: [users.id] }),
  incidents: many(incidents),
}));

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  sticker: one(stickers, { fields: [incidents.stickerId], references: [stickers.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  incident: one(incidents, { fields: [messages.incidentId], references: [incidents.id] }),
}));
