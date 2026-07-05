const fs = require('fs');
let code = fs.readFileSync('src/supabase.ts', 'utf8');

code = code.replace(/const isNew = !product\.id \|\| product\.id\.toString\(\)\.length > 10 \|\| product\.id\.toString\(\)\.includes\('-'\);/g, "const isNew = !product.id || String(product.id).includes('_') || String(product.id).startsWith('temp-');");

code = code.replace(/const isNew = !photo\.id \|\| photo\.id\.toString\(\)\.length > 10 \|\| photo\.id\.toString\(\)\.includes\('-'\);/g, "const isNew = !photo.id || String(photo.id).includes('_') || String(photo.id).startsWith('temp-');");

fs.writeFileSync('src/supabase.ts', code);
