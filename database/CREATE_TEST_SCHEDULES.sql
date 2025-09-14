-- Create test schedules with specific trainer names
-- First, let's see what users we have
SELECT 'Available users:' as status;
SELECT user_id, first_name, last_name, email, role FROM user_profiles WHERE role = 'user' LIMIT 5;

-- Create test schedules with Mike and Jordan as trainers
INSERT INTO personal_training_schedules (
    user_id,
    month,
    year,
    schedule_data,
    status,
    created_by
) VALUES 
-- Schedule for user 1 with Mike
(
    (SELECT user_id FROM user_profiles WHERE role = 'user' LIMIT 1),
    1,
    2025,
    '{
        "sessions": [
            {
                "id": "session-1",
                "date": "2025-01-15",
                "startTime": "10:00",
                "endTime": "11:00",
                "type": "personal",
                "trainer": "Mike",
                "room": "Αίθουσα Mike",
                "notes": "Test session with Mike"
            },
            {
                "id": "session-2", 
                "date": "2025-01-17",
                "startTime": "14:00",
                "endTime": "15:00",
                "type": "personal",
                "trainer": "Mike",
                "room": "Αίθουσα Mike",
                "notes": "Another session with Mike"
            }
        ],
        "notes": "Test program with Mike",
        "specialInstructions": "Focus on strength training"
    }'::jsonb,
    'accepted',
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1)
),
-- Schedule for user 2 with Jordan
(
    (SELECT user_id FROM user_profiles WHERE role = 'user' LIMIT 1 OFFSET 1),
    1,
    2025,
    '{
        "sessions": [
            {
                "id": "session-3",
                "date": "2025-01-16",
                "startTime": "16:00",
                "endTime": "17:00",
                "type": "kickboxing",
                "trainer": "Jordan",
                "room": "Αίθουσα Jordan",
                "notes": "Test session with Jordan"
            },
            {
                "id": "session-4",
                "date": "2025-01-18",
                "startTime": "18:00",
                "endTime": "19:00",
                "type": "personal",
                "trainer": "Jordan",
                "room": "Αίθουσα Jordan",
                "notes": "Another session with Jordan"
            }
        ],
        "notes": "Test program with Jordan",
        "specialInstructions": "Focus on cardio and technique"
    }'::jsonb,
    'accepted',
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1)
),
-- Schedule for user 3 with Mike
(
    (SELECT user_id FROM user_profiles WHERE role = 'user' LIMIT 1 OFFSET 2),
    1,
    2025,
    '{
        "sessions": [
            {
                "id": "session-5",
                "date": "2025-01-20",
                "startTime": "09:00",
                "endTime": "10:00",
                "type": "combo",
                "trainer": "Mike",
                "room": "Αίθουσα Mike",
                "notes": "Combo session with Mike"
            }
        ],
        "notes": "Combo program with Mike",
        "specialInstructions": "Mixed training approach"
    }'::jsonb,
    'pending',
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1)
);

-- Verify the schedules were created
SELECT 'Created schedules:' as status;
SELECT 
    pts.id,
    pts.user_id,
    up.first_name,
    up.last_name,
    up.email,
    jsonb_array_elements(pts.schedule_data->'sessions')->>'trainer' as trainer_name,
    jsonb_array_elements(pts.schedule_data->'sessions')->>'date' as session_date,
    jsonb_array_elements(pts.schedule_data->'sessions')->>'startTime' as session_time
FROM personal_training_schedules pts
JOIN user_profiles up ON pts.user_id = up.user_id
WHERE pts.schedule_data->'sessions' IS NOT NULL
ORDER BY pts.created_at DESC
LIMIT 10;
