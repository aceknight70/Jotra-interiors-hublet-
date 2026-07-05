const fs = require('fs');
let code = fs.readFileSync('src/supabase.ts', 'utf8');

code = code.replace(/front_image_url: photo\.imageUrl\n\s*\};/g, "front_image_url: photo.imageUrl,\n    product_code: `GAL-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`\n  };");

fs.writeFileSync('src/supabase.ts', code);
