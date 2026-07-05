const fs = require('fs');
let code = fs.readFileSync('src/supabase.ts', 'utf8');

code = code.replace(/PRD-\$\{Date.now\(\)\}-\$\{Math.floor\(Math.random\(\) \* 1000\)\}/g, "PRD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}");

fs.writeFileSync('src/supabase.ts', code);
