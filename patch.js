const fs = require('fs');
let code = fs.readFileSync('src/utils/upload.ts', 'utf8');
code = code.replace(/img\.onerror = \(err\) => reject\(err\);/g, "img.onerror = (err) => reject(new Error('Failed to load image for compression'));");
code = code.replace(/reader\.onerror = \(err\) => reject\(err\);/g, "reader.onerror = (err) => reject(new Error('Failed to read file'));");
fs.writeFileSync('src/utils/upload.ts', code);
