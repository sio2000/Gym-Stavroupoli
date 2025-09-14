-- Insert test trainer schedules as admin
-- This script should be run in Supabase SQL Editor with admin privileges

-- First, let's check if we have any users to create schedules for
SELECT 
    user_id, 
    email, 
    first_name, 
    last_name, 
    role 
FROM user_profiles 
WHERE role = 'user' 
LIMIT 5;

-- Get a user ID to create schedules for (replace with actual user_id from above query)
-- For this example, we'll use a placeholder that should be replaced

-- Create Mike's schedule
INSERT INTO personal_training_schedules (
    user_id,
    month,
    year,
    schedule_data,
    status,
    created_by
) VALUES (
    (SELECT user_id FROM user_profiles WHERE role = 'user' LIMIT 1), -- Get first user
    9, -- September
    2025,
    '{
        "sessions": [
            {
                "id": "mike-session-1",
                "date": "2025-09-06",
                "startTime": "09:00",
                "endTime": "10:00",
                "type": "personal",
                "trainer": "Mike",
                "room": "Αίθουσα Mike",
                "notes": "Morning personal training with Mike"
            },
            {
                "id": "mike-session-2",
                "date": "2025-09-07",
                "startTime": "18:00",
                "endTime": "19:00",
                "type": "kickboxing",
                "trainer": "Mike",
                "room": "Αίθουσα Mike",
                "notes": "Evening kickboxing with Mike"
            },
            {
                "id": "mike-session-3",
                "date": "2025-09-08",
                "startTime": "10:00",
                "endTime": "11:00",
                "type": "personal",
                "trainer": "Mike",
                "room": "Αίθουσα Mike",
                "notes": "Personal training session"
            }
        ],
        "notes": "Mike training program - Focus on strength and technique",
        "trainer": "Mike",
        "specialInstructions": "Focus on strength and technique development"
    }'::jsonb,
    'accepted',
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1) -- Created by admin
);

-- Create Jordan's schedule
INSERT INTO personal_training_schedules (
    user_id,
    month,
    year,
    schedule_data,
    status,
    created_by
) VALUES (
    (SELECT user_id FROM user_profiles WHERE role = 'user' LIMIT 1), -- Get first user
    9, -- September
    2025,
    '{
        "sessions": [
            {
                "id": "jordan-session-1",
                "date": "2025-09-06",
                "startTime": "14:00",
                "endTime": "15:00",
                "type": "personal",
                "trainer": "Jordan",
                "room": "Αίθουσα Jordan",
                "notes": "Afternoon personal training with Jordan"
            },
            {
                "id": "jordan-session-2",
                "date": "2025-09-07",
                "startTime": "19:00",
                "endTime": "20:00",
                "type": "combo",
                "trainer": "Jordan",
                "room": "Αίθουσα Jordan",
                "notes": "Evening combo training with Jordan"
            },
            {
                "id": "jordan-session-3",
                "date": "2025-09-08",
                "startTime": "16:00",
                "endTime": "17:00",
                "type": "kickboxing",
                "trainer": "Jordan",
                "room": "Αίθουσα Jordan",
                "notes": "Kickboxing session with Jordan"
            }
        ],
        "notes": "Jordan training program - Focus on cardio and flexibility",
        "trainer": "Jordan",
        "specialInstructions": "Focus on cardio and flexibility development"
    }'::jsonb,
    'accepted',
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1) -- Created by admin
);

-- Create additional schedules for different users to have more data
-- Get second user for more variety
INSERT INTO personal_training_schedules (
    user_id,
    month,
    year,
    schedule_data,
    status,
    created_by
) VALUES (
    (SELECT user_id FROM user_profiles WHERE role = 'user' OFFSET 1 LIMIT 1), -- Get second user
    9, -- September
    2025,
    '{
        "sessions": [
            {
                "id": "mike-session-4",
                "date": "2025-09-09",
                "startTime": "11:00",
                "endTime": "12:00",
                "type": "personal",
                "trainer": "Mike",
                "room": "Αίθουσα Mike",
                "notes": "Personal training with Mike"
            }
        ],
        "notes": "Mike training program for second user",
        "trainer": "Mike",
        "specialInstructions": "Beginner level training"
    }'::jsonb,
    'accepted',
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1) -- Created by admin
);

-- Verify the data was inserted
SELECT 
    id,
    user_id,
    month,
    year,
    status,
    schedule_data->'sessions' as sessions,
    created_at
FROM personal_training_schedules 
ORDER BY created_at DESC 
LIMIT 10;

-- Check specifically for Mike and Jordan schedules
SELECT 
    id,
    user_id,
    month,
    year,
    status,
    jsonb_array_elements(schedule_data->'sessions')->>'trainer' as trainer,
    jsonb_array_elements(schedule_data->'sessions')->>'startTime' as start_time,
    jsonb_array_elements(schedule_data->'sessions')->>'endTime' as end_time,
    jsonb_array_elements(schedule_data->'sessions')->>'date' as session_date
FROM personal_training_schedules 
WHERE schedule_data->'sessions' @> '[{"trainer": "Mike"}]' 
   OR schedule_data->'sessions' @> '[{"trainer": "Jordan"}]'
ORDER BY created_at DESC;
