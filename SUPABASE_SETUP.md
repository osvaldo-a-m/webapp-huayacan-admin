# Supabase Setup Instructions - Tour Reservation System

## Step 1: Create Your Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click **"New Project"**
4. Fill in the project details:
   - **Name**: Huaycan Tour Reservations (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your location
5. Click **"Create new project"**
6. Wait 2-3 minutes for the project to be provisioned

---

## Step 2: Run the SQL to Create Tables

1. In your Supabase dashboard, click on the **SQL Editor** icon in the left sidebar (looks like `</>`)
2. Click **"New Query"**
3. Copy and paste the following SQL code:

```sql
-- ===================================
-- Create Tours Table
-- ===================================
CREATE TABLE tours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL CHECK (time_slot IN ('11:00', '12:00', '13:00', '14:00')),
  max_capacity INTEGER DEFAULT 10 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, time_slot)
);

-- Create index for faster queries
CREATE INDEX idx_tours_date_time ON tours(date, time_slot);

-- ===================================
-- Create Reservations Table
-- ===================================
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

-- Create indexes for faster queries
CREATE INDEX idx_reservations_tour ON reservations(tour_id);
CREATE INDEX idx_reservations_date_time ON reservations(reservation_date, time_slot);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_phone ON reservations(customer_phone);

-- ===================================
-- Enable Row Level Security (RLS)
-- ===================================
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (for development)
-- IMPORTANT: In production, you should implement proper authentication
CREATE POLICY "Enable all for tours" ON tours FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for reservations" ON reservations FOR ALL USING (true) WITH CHECK (true);
```

4. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)
5. You should see a success message: "Success. No rows returned"

---

## Step 3: Enable Realtime (Optional but Recommended)

This allows the app to update automatically when reservations are made on other devices.

1. In the left sidebar, click **"Database"**
2. Click **"Replication"**
3. Find the **`reservations`** table in the list
4. Toggle the switch to **ON** (it will turn green)
5. Wait a few seconds for replication to be enabled

---

## Step 4: Get Your API Credentials

1. In the left sidebar, click the **Settings** icon (gear icon at the bottom)
2. Click **"API"** in the settings menu
3. You'll see two important values:

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   
   **anon public key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
   ```

4. Copy both of these values

---

## Step 5: Configure Your App

1. Open the file `supabase-config.js` in your project
2. Replace the placeholder values with your actual credentials:

```javascript
const SUPABASE_CONFIG = {
  url: 'https://xxxxxxxxxxxxx.supabase.co',  // ← Paste your Project URL here
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  // ← Paste your anon key here
};
```

3. Save the file

---

## Step 6: Test Your Connection

1. Refresh your app in the browser (`http://localhost:3000`)
2. You should no longer see the "Supabase no está configurado" error
3. Try making a test reservation:
   - Select a time slot (e.g., 11:00)
   - Select number of people (e.g., 3 personas)
   - Click any available seat
   - Fill in customer information
   - Click "Confirmar Reserva"

4. Verify the reservation was saved:
   - Go back to Supabase dashboard
   - Click **"Table Editor"** in the left sidebar
   - Click on the **`reservations`** table
   - You should see your test reservation!

---

## Troubleshooting

### Error: "relation 'reservations' does not exist"
- Make sure you ran the SQL in Step 2
- Check that both tables were created in the Table Editor

### Error: "Invalid API key"
- Double-check that you copied the entire `anon` key (it's very long)
- Make sure there are no extra spaces or line breaks

### Reservations not showing up
- Check the browser console for errors (F12 → Console tab)
- Verify your Supabase credentials are correct
- Make sure RLS policies are enabled (Step 2)

### Real-time updates not working
- Make sure you enabled replication for the `reservations` table (Step 3)
- Try refreshing the page

---

## Viewing Your Data

### In Supabase Dashboard:
1. Click **"Table Editor"** in the left sidebar
2. Select **`reservations`** or **`tours`** table
3. You can view, edit, or delete records directly

### Useful SQL Queries:

**See all reservations for today:**
```sql
SELECT * FROM reservations 
WHERE reservation_date = CURRENT_DATE 
  AND status = 'active'
ORDER BY time_slot, seat_number;
```

**See capacity for each time slot today:**
```sql
SELECT 
  time_slot,
  COUNT(*) as reserved_seats,
  10 - COUNT(*) as available_seats
FROM reservations 
WHERE reservation_date = CURRENT_DATE 
  AND status = 'active'
GROUP BY time_slot
ORDER BY time_slot;
```

**Cancel all reservations for a specific phone number:**
```sql
UPDATE reservations 
SET status = 'cancelled'
WHERE customer_phone = '999888777';
```

---

## Next Steps

✅ Your database is now set up!
✅ Your app is connected to Supabase
✅ You can start taking real reservations

### For Production Deployment:

1. **Tighten Security**: Update RLS policies to require authentication
2. **Add Authentication**: Implement Supabase Auth for staff login
3. **Backup**: Enable automatic backups in Supabase settings
4. **Monitor**: Check the Supabase logs regularly for errors

---

## Need Help?

- **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)
- **Check the browser console** (F12) for error messages
- **Check Supabase logs**: Dashboard → Logs & Analytics
