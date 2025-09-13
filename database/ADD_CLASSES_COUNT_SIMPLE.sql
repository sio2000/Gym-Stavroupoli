-- Simple script to add classes_count column to membership_requests
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS classes_count INTEGER DEFAULT NULL;
