const fs = require('fs');
let code = fs.readFileSync('src/supabase.ts', 'utf8');

code = code.replace(/product_code: product\.productCode \|\| ''/g, "product_code: product.productCode || `PRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`");

fs.writeFileSync('src/supabase.ts', code);
