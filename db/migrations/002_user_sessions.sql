-- ============================================================
-- TSIO Innovation Hub — Session Store Migration
-- Migration: 002_user_sessions.sql
-- Creates the connect-pg-simple session table used by express-session.
-- Must run AFTER 001_supporting_tables.sql (users table exists).
-- ============================================================

-- connect-pg-simple canonical schema (v10+)
-- https://github.com/voxpelli/node-connect-pg-simple#table-setup
CREATE TABLE IF NOT EXISTS user_sessions (
    sid     VARCHAR         NOT NULL COLLATE "default",
    sess    JSON            NOT NULL,
    expire  TIMESTAMP(6)    NOT NULL,
    CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX IF NOT EXISTS idx_session_expire ON user_sessions (expire);
