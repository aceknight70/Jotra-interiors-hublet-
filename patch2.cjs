const fs = require('fs');
let code = fs.readFileSync('src/supabase.ts', 'utf8');
code = code.replace(/if \(error\.message\.includes/g, "if (error?.message?.includes");
fs.writeFileSync('src/supabase.ts', code);
