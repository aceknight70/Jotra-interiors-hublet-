const fs = require('fs');
let code = fs.readFileSync('src/supabase.ts', 'utf8');

code = code.replace(/const supabaseUrl = \(import\.meta as any\)\.env\?\.VITE_SUPABASE_URL \|\| '';/g, "const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';");

code = code.replace(/const supabaseKey = \(import\.meta as any\)\.env\?\.VITE_SUPABASE_ANON_KEY \|\| '';/g, "const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'placeholder_key';");

fs.writeFileSync('src/supabase.ts', code);
