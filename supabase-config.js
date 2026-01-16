// Supabase Configuration
// Replace these values with your actual Supabase project credentials

const SUPABASE_CONFIG = {
  url: 'https://rgdnqjnkiwdzknpejvwp.supabase.co', // e.g., 'https://xxxxx.supabase.co'
  anonKey: 'sb_publishable_vetzqDRDYn8FbAe62fBYzw_Nd6mb0Fp' // Your public anon key
};

// Initialize Supabase client
let supabaseClient = null;

function initSupabase() {
  if (typeof supabase === 'undefined') {
    console.error('Supabase library not loaded. Make sure to include the Supabase CDN script in your HTML.');
    return null;
  }

  if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL') {
    console.warn('⚠️ Supabase URL not configured. Please update supabase-config.js with your project credentials.');
    return null;
  }

  supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  console.log('✅ Supabase client initialized');
  return supabaseClient;
}

// Export for use in other files
function getSupabaseClient() {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
}
