import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://klocxiemfsdorcjylbeg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsb2N4aWVtZnNkb3JjanlsYmVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODYwMzgsImV4cCI6MjA3NTM2MjAzOH0.iS-y9jIOA86tagkQZeGYqzABI5F059TcWLmk9vt1_bM'

console.log('🔧 supabase.js: Module loading...');

// Test if localStorage is available and working
try {
  const testKey = '__localStorage_test__';
  localStorage.setItem(testKey, 'test');
  const testValue = localStorage.getItem(testKey);
  localStorage.removeItem(testKey);
  console.log('✅ supabase.js: localStorage is working:', testValue === 'test');
} catch (e) {
  console.error('❌ supabase.js: localStorage is NOT available or blocked:', e);
}

// Custom storage implementation that logs all operations
const customStorage = {
  getItem: (key) => {
    const value = localStorage.getItem(key);
    console.log('📖 supabase storage getItem:', key, '=', value ? 'EXISTS' : 'NULL');
    return value;
  },
  setItem: (key, value) => {
    console.log('💾 supabase storage setItem:', key, 'length:', value?.length);
    localStorage.setItem(key, value);
    console.log('✅ supabase storage setItem: SAVED');
  },
  removeItem: (key) => {
    console.log('🗑️ supabase storage removeItem:', key);
    localStorage.removeItem(key);
  },
};

console.log('🔧 supabase.js: Creating Supabase client with custom storage...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

console.log('✅ supabase.js: Supabase client created successfully!');