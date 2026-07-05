const fs = require('fs');

// Patch StaffDashboard.tsx
let sdCode = fs.readFileSync('src/components/StaffDashboard.tsx', 'utf8');

// Remove optimistic insert from handleAddProduct
sdCode = sdCode.replace(/await saveProduct\(newProduct\);\s*setProducts\(prev => {[\s\S]*?}\);/g, 'await saveProduct(newProduct);');

// Remove optimistic insert from handleBulkAdd
sdCode = sdCode.replace(/await saveProductsBulk\(bulkProducts\);\s*setProducts\(prev => {[\s\S]*?}\);/g, 'await saveProductsBulk(bulkProducts);');

// Remove optimistic update from handleEditSubmit
sdCode = sdCode.replace(/await saveProduct\({[\s\S]*?imageUrl[\s\S]*?}\);\s*setProducts\(prev => prev\.map\(p => p\.id === productData\.id \? { \.\.\.productData, imageUrl } : p\)\);/g, 'await saveProduct({ ...productData, imageUrl });');

// Remove optimistic remove from deleteProduct
sdCode = sdCode.replace(/await removeProduct\(id\);\s*setProducts\(prev => prev\.filter\(p => p\.id !== id\)\);/g, 'await removeProduct(id);');

// Patch PhotoGallery.tsx
let pgCode = fs.readFileSync('src/components/PhotoGallery.tsx', 'utf8');

// Remove optimistic insert from handleUploadSubmit
pgCode = pgCode.replace(/await saveGalleryPhoto\(newPhoto\);\s*setPhotos\(prev => {[\s\S]*?}\);/g, 'await saveGalleryPhoto(newPhoto);');

// Patch GoodsHub.tsx
let ghCode = fs.readFileSync('src/components/GoodsHub.tsx', 'utf8');

// Remove optimistic bulk insert
ghCode = ghCode.replace(/await saveProductsBulk\(demoWithIds\);\s*setProducts\(prev => \[\.\.\.demoWithIds, \.\.\.prev\]\);/g, 'await saveProductsBulk(demoWithIds);');

// Remove optimistic update
ghCode = ghCode.replace(/await saveProduct\({ \.\.\.productData, imageUrl }\);\s*setProducts\(prev => prev\.map\(p => p\.id === productData\.id \? { \.\.\.productData, imageUrl } : p\)\);/g, 'await saveProduct({ ...productData, imageUrl });');

fs.writeFileSync('src/components/StaffDashboard.tsx', sdCode);
fs.writeFileSync('src/components/PhotoGallery.tsx', pgCode);
fs.writeFileSync('src/components/GoodsHub.tsx', ghCode);
