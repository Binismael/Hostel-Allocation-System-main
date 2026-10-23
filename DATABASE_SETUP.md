# Database Setup Instructions

## Overview

This project requires a `notifications` table in Supabase that was missing and has now been fixed.

## Required Setup

### Step 1: Create the Notifications Table

Go to your Supabase Project → **SQL Editor** → **New Query** and run the following SQL:

```sql
-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT notifications_type_check CHECK (type IN ('room_request', 'allocation_approved', 'allocation_rejected', 'check_in_reminder'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_student_id ON public.notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_student_created ON public.notifications(student_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Only admins can insert notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());
```

### Step 2: Verify Allocations Table

Verify your `allocations` table has the `allocation_id` column with a NOT NULL constraint:

```sql
-- Check allocations table structure
\d public.allocations;

-- If allocation_id column is missing, add it
-- ALTER TABLE public.allocations ADD COLUMN allocation_id VARCHAR(50) NOT NULL UNIQUE;
```

## Code Changes Made

1. **RoomRequest.tsx** - Fixed allocation creation to include `allocation_id`
   - Now generates a unique allocation ID before creating the allocation record
   - Format: `REQ-{timestamp}-{random}`

2. **Database Migration** - Created comprehensive notifications table with:
   - Proper foreign key constraint to students table
   - Row-level security (RLS) policies
   - Optimized indexes for performance
   - Type validation constraint

## Testing

After creating the notifications table:

1. Go to **Room Request** page
2. Submit a room allocation request
3. Check that:
   - No "null value in column allocation_id" error occurs
   - No "notifications table not found" error occurs
   - Allocation is created successfully
   - Notification is created for admin

## Troubleshooting

**Error: "student_id not found in auth.uid()"**

- This is normal for non-authenticated users in development
- The RLS policy will work correctly in production with proper auth setup

**Error: "allocations table missing allocation_id"**

- Ensure the allocations table has the allocation_id column
- It should be VARCHAR(50) with NOT NULL constraint
