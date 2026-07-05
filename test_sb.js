import { createClient } from '@supabase/supabase-js';
try {
  createClient('', '');
  console.log("Success");
} catch (e) {
  console.log("Error:", e.message);
}
