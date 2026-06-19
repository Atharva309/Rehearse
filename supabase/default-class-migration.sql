-- Rehearse: Default Simulations system class
-- Run this ENTIRE file in Supabase → SQL Editor → Run
-- Safe to re-run (uses ON CONFLICT / IF NOT EXISTS patterns)

-- Step 1: Allow NULL professor_id for system classes
ALTER TABLE classes
  ALTER COLUMN professor_id DROP NOT NULL;

ALTER TABLE student_classes
  ALTER COLUMN professor_id DROP NOT NULL;

-- Step 2: Create the system default class
INSERT INTO classes (
  id,
  professor_id,
  name,
  description,
  join_code,
  is_active,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'Default Simulations',
  'Pre-built simulations available to all students.',
  'DEFAULT',
  true,
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Enroll all existing students in the default class
INSERT INTO student_classes (student_id, class_id, professor_id)
SELECT
  s.id,
  '00000000-0000-0000-0000-000000000001',
  NULL
FROM students s
WHERE NOT EXISTS (
  SELECT 1 FROM student_classes sc
  WHERE sc.student_id = s.id
  AND sc.class_id = '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (student_id, class_id) DO NOTHING;

-- Step 4: Verify
SELECT * FROM classes WHERE id = '00000000-0000-0000-0000-000000000001';
SELECT COUNT(*) AS default_class_enrollments FROM student_classes
WHERE class_id = '00000000-0000-0000-0000-000000000001';
