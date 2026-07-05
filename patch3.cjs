const fs = require('fs');
let code = fs.readFileSync('src/supabase.ts', 'utf8');

code = code.replace(/export async function saveProduct\([\s\S]*?if \(error\) handleSupabaseError\(error, 'saving product'\);\s*}/m, `export async function saveProduct(product: Product): Promise<void> {
  const dbProduct: any = {
    client_id: 'jotra',
    description_headline: product.name,
    category: product.category,
    technical_specs: product.spec,
    price: product.price,
    description_bullets: product.description,
    stock_status: product.availability,
    front_image_url: product.imageUrl,
    staff_notes: product.staffNotes || '',
    brand: product.brand || '',
    product_code: product.productCode || ''
  };

  const isNew = !product.id || product.id.toString().length > 10 || product.id.toString().includes('-');

  if (isNew) {
    const { error } = await supabase
      .from('products')
      .insert(dbProduct);
    if (error) handleSupabaseError(error, 'saving product');
  } else {
    const { error } = await supabase
      .from('products')
      .update(dbProduct)
      .eq('id', product.id);
    if (error) handleSupabaseError(error, 'saving product');
  }
}`);

code = code.replace(/export async function saveProductsBulk\([\s\S]*?if \(error\) handleSupabaseError\(error, 'bulk saving products'\);\s*}/m, `export async function saveProductsBulk(products: Product[]): Promise<void> {
  const formattedProducts = products.map(product => ({
    client_id: 'jotra',
    description_headline: product.name,
    category: product.category,
    technical_specs: product.spec,
    price: product.price,
    description_bullets: product.description,
    stock_status: product.availability,
    front_image_url: product.imageUrl,
    staff_notes: product.staffNotes || '',
    brand: product.brand || '',
    product_code: product.productCode || ''
  }));

  const { error } = await supabase
    .from('products')
    .insert(formattedProducts);

  if (error) handleSupabaseError(error, 'bulk saving products');
}`);

code = code.replace(/export async function saveGalleryPhoto\([\s\S]*?if \(error\) handleSupabaseError\(error, 'saving gallery photo'\);\s*}/m, `export async function saveGalleryPhoto(photo: GalleryPhoto): Promise<void> {
  const dbPhoto: any = {
    client_id: 'jotra',
    description_headline: photo.name,
    category: photo.category,
    front_image_url: photo.imageUrl
  };

  const isNew = !photo.id || photo.id.toString().length > 10 || photo.id.toString().includes('-');

  if (isNew) {
    const { error } = await supabase
      .from('products')
      .insert(dbPhoto);
    if (error) handleSupabaseError(error, 'saving gallery photo');
  } else {
    const { error } = await supabase
      .from('products')
      .update(dbPhoto)
      .eq('id', photo.id);
    if (error) handleSupabaseError(error, 'saving gallery photo');
  }
}`);

fs.writeFileSync('src/supabase.ts', code);
