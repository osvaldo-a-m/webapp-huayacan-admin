# Database Schema for Tour Reservation System

This document describes the Supabase database schema for the tour reservation system.

## Tables

### `tours`
Stores information about each tour instance.

```sql
CREATE TABLE tours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL CHECK (time_slot IN ('11:00', '12:00', '13:00', '14:00')),
  max_capacity INTEGER DEFAULT 10 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, time_slot)
);

-- Index for faster queries
CREATE INDEX idx_tours_date_time ON tours(date, time_slot);
```

### `reservations`
Stores individual seat reservations for tours.

```sql
CREATE TABLE reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  seat_number INTEGER NOT NULL CHECK (seat_number >= 1 AND seat_number <= 10),
  number_of_people INTEGER DEFAULT 1 NOT NULL CHECK (number_of_people >= 1),
  reservation_date DATE NOT NULL,
  time_slot TEXT NOT NULL CHECK (time_slot IN ('11:00', '12:00', '13:00', '14:00')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tour_id, seat_number)
);

-- Indexes for faster queries
CREATE INDEX idx_reservations_tour ON reservations(tour_id);
CREATE INDEX idx_reservations_date_time ON reservations(reservation_date, time_slot);
CREATE INDEX idx_reservations_status ON reservations(status);
```

## Row Level Security (RLS) Policies

For development, you can disable RLS or use permissive policies. For production, implement proper authentication.

```sql
-- Enable RLS
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust for production)
CREATE POLICY "Enable all for tours" ON tours FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for reservations" ON reservations FOR ALL USING (true) WITH CHECK (true);
```

## Setup Instructions

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the project to be provisioned

2. **Run the SQL Schema**
   - Navigate to the SQL Editor in your Supabase dashboard
   - Copy and paste the SQL commands above
   - Execute the commands to create tables and policies

3. **Get Your Credentials**
   - Go to Project Settings > API
   - Copy your project URL (e.g., `https://xxxxx.supabase.co`)
   - Copy your `anon` public key
   - Add these to `supabase-config.js`

4. **Enable Realtime** (Optional but recommended)
   - Go to Database > Replication
   - Enable replication for `reservations` table
   - This allows real-time updates across devices

## Data Flow

1. When a user selects a date and time slot, the app queries for existing reservations
2. The seat grid displays which seats are taken (from `reservations` table)
3. When a reservation is made:
   - A tour record is created/retrieved for that date and time
   - A reservation record is created with the customer details and seat number
4. Real-time subscriptions update all connected clients when reservations change

## Sample Queries

### Get all reservations for a specific date and time
```sql
SELECT * FROM reservations 
WHERE reservation_date = '2026-01-15' 
  AND time_slot = '11:00' 
  AND status = 'active';
```

### Get available seats for a tour
```sql
-- Returns seat numbers 1-10 that are NOT reserved
SELECT seat_num 
FROM generate_series(1, 10) AS seat_num
WHERE seat_num NOT IN (
  SELECT seat_number 
  FROM reservations 
  WHERE reservation_date = '2026-01-15' 
    AND time_slot = '11:00' 
    AND status = 'active'
);
```

### Get capacity for a tour
```sql
SELECT 
  COUNT(*) as reserved_seats,
  10 - COUNT(*) as available_seats
FROM reservations 
WHERE reservation_date = '2026-01-15' 
  AND time_slot = '11:00' 
  AND status = 'active';
```
