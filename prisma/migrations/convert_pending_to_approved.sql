-- Migration: Convert all PENDING posts to APPROVED
-- This makes all existing posts instantly visible (no approval needed)

UPDATE Post 
SET status = 'APPROVED' 
WHERE status = 'PENDING';

-- Verify the update
SELECT status, COUNT(*) as count 
FROM Post 
GROUP BY status;

