import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://klocxiemfsdorcjylbeg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsb2N4aWVtZnNkb3JjanlsYmVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODYwMzgsImV4cCI6MjA3NTM2MjAzOH0.iS-y9jIOA86tagkQZeGYqzABI5F059TcWLmk9vt1_bM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)