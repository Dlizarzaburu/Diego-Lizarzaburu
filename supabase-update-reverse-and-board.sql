-- S27 Events — idempotent schema update
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query → Run).
-- Safe to run more than once.

-- 1) Event-level toggle: allow scanner supervisors to reverse a check-in.
ALTER TABLE "Event"
  ADD COLUMN IF NOT EXISTS "allowReverseCheckIn" BOOLEAN NOT NULL DEFAULT false;

-- 2) Executive board members (managed from the admin portal /admin/board).
CREATE TABLE IF NOT EXISTS "BoardMember" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "photoUrl"  TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BoardMember_pkey" PRIMARY KEY ("id")
);
