# 📊 VIEW LAST 30 PILATES BOOKINGS - 100% SAFE SQL

## 🎯 Purpose:
View the last 30 users who booked Pilates classes with dates and times.

## ✅ Safety:
- **READ-ONLY** query
- **No changes** to database
- **No risk** to real users

---

## 📋 How to Use:

### 1. Open Supabase Dashboard
```
https://supabase.com/dashboard/project/nolqodpfaqdnprixaqlo
```

### 2. Go to SQL Editor

### 3. Copy and paste the SQL from:
```
database/VIEW_LAST_30_PILATES_BOOKINGS.sql
```

### 4. Run it (RUN button)

---

## 📊 What You'll See:

The query returns:

| Column | Description |
|--------|-------------|
| **user_name** | Full name of the user |
| **user_email** | User's email |
| **booking_datetime** | When the booking was made |
| **booking_status** | Status (confirmed) |
| **class_date** | Date of the Pilates class |
| **class_start_time** | Start time of the class |
| **class_end_time** | End time of the class |
| **slot_capacity** | Max capacity of the slot |
| **booking_id** | Unique booking ID |

---

## 🔍 Alternative Queries:

The SQL file contains 3 different queries:

1. **Main Query**: Last 30 bookings with full details
2. **Alternative 1**: Last 30 unique users (commented out)
3. **Alternative 2**: Detailed view with formatted dates (commented out)

You can uncomment any of these to use them instead.

---

## ⚠️ Note:

- Query shows only **confirmed** bookings
- Ordered by **most recent first**
- Limits to **30 results**

**100% SAFE - READ-ONLY!**

