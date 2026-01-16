# Tour Reservation System - Setup Guide

## Quick Start

### 1. Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Sign up or log in
   - Click "New Project"
   - Fill in project details and wait for provisioning

2. **Run the Database Schema**
   - Open your Supabase project dashboard
   - Go to the SQL Editor (left sidebar)
   - Copy the SQL from `database-schema.md`
   - Paste and execute the SQL commands

3. **Get Your Credentials**
   - Go to Project Settings (gear icon) > API
   - Copy your Project URL (e.g., `https://xxxxx.supabase.co`)
   - Copy your `anon` public key
   - Open `supabase-config.js` and replace the placeholder values:

```javascript
const SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key-here'
};
```

4. **Enable Realtime** (Recommended)
   - Go to Database > Replication
   - Find the `reservations` table
   - Toggle on the replication switch
   - This enables real-time updates across devices

### 2. Run the Application

**Option 1: Using a simple HTTP server**
```bash
# If you have Python installed
python3 -m http.server 8000

# Or using Node.js
npx -y serve .
```

**Option 2: Using VS Code Live Server**
- Install the "Live Server" extension
- Right-click on `index.html`
- Select "Open with Live Server"

### 3. Access the App

Open your browser and navigate to:
- `http://localhost:8000` (Python)
- `http://localhost:3000` (serve)
- Or the URL provided by Live Server

## Testing the Application

### Basic Flow Test

1. **Select a Time Slot**
   - Click on one of the time buttons (11:00, 12:00, 13:00, 14:00)
   - The button should highlight and seats should become available

2. **Select a Seat**
   - Click on an available (green) seat
   - The seat should turn blue (selected)

3. **Fill Customer Information**
   - Enter customer name
   - Enter phone number (at least 9 digits)
   - Select number of people

4. **Submit Reservation**
   - Click "Confirmar Reserva"
   - You should see a success modal
   - The seat should now appear as reserved (red)
   - The reservation should appear in the list on the right

### Real-time Test

1. Open the app in two browser windows/tabs
2. Make a reservation in one window
3. The seat should automatically update in the other window
4. This confirms real-time synchronization is working

### Multi-device Test (Tablet)

1. Get your computer's local IP address:
   ```bash
   # On Mac/Linux
   ifconfig | grep "inet "
   
   # On Windows
   ipconfig
   ```

2. On your tablet, navigate to:
   ```
   http://YOUR-IP-ADDRESS:8000
   ```

3. Test touch interactions and responsiveness

## Troubleshooting

### "Supabase no está configurado" Error
- Make sure you've updated `supabase-config.js` with your actual credentials
- Check that the Supabase CDN script is loading (check browser console)

### Seats Not Updating
- Verify you've enabled replication for the `reservations` table in Supabase
- Check browser console for errors
- Make sure you're using the correct date (app uses current date)

### Form Won't Submit
- Ensure all fields are filled
- Phone number must be at least 9 digits
- A time slot and seat must be selected

### Database Errors
- Verify the SQL schema was executed successfully
- Check that RLS policies are set correctly
- Look at the Supabase logs (Logs & Analytics in dashboard)

## Features Overview

### For Staff/Operators

- **Visual Seat Management**: See all 10 seats at a glance with color coding
- **Time Slot Selection**: Easy switching between 4 daily tours
- **Real-time Updates**: Changes sync instantly across all devices
- **Reservation Management**: View and cancel reservations
- **Capacity Tracking**: See available seats for each tour

### Technical Features

- **Supabase Integration**: Cloud database with real-time capabilities
- **Responsive Design**: Optimized for tablets (768px - 1024px)
- **Touch-Friendly**: Large buttons and interactive elements
- **Premium UI**: Modern design with glassmorphism and animations
- **Data Persistence**: All reservations stored securely in the cloud

## Customization

### Change Tour Times

Edit the time slots in `index.html` (around line 26):
```html
<button class="time-slot-btn" data-time="15:00">
  <span class="time">15:00</span>
  <span class="period">PM</span>
  <span class="capacity" data-time="15:00">0/10</span>
</button>
```

And update the array in `app.js` (around line 220):
```javascript
const timeSlots = ['11:00', '12:00', '13:00', '14:00', '15:00'];
```

### Change Maximum Capacity

Update the database schema to change from 10 seats to another number, then update the seat grid generation in `app.js`.

### Change Colors

Edit CSS variables in `styles.css` (lines 5-30) to customize the color scheme.

## Production Deployment

### Recommended Platforms

1. **Vercel** (Easiest)
   - Connect your GitHub repo
   - Auto-deploys on push
   - Free tier available

2. **Netlify**
   - Drag and drop deployment
   - Custom domain support
   - Free tier available

3. **GitHub Pages**
   - Free hosting for static sites
   - Custom domain support

### Before Deploying

1. Test thoroughly on actual tablet devices
2. Verify Supabase credentials are correct
3. Consider adding authentication for production
4. Review and tighten RLS policies in Supabase
5. Add error tracking (e.g., Sentry)

## Support

For issues or questions:
1. Check the browser console for errors
2. Review Supabase logs in the dashboard
3. Verify all setup steps were completed
4. Test with sample data first
