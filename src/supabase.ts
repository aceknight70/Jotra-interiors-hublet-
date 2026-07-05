import { createClient } from '@supabase/supabase-js';
import { Product, GalleryPhoto } from './types';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Log warning if environment variables are not configured
if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials are not configured in your environment variables.');
}

const handleSupabaseError = (error: any, operation: string) => {
  if (error?.message?.includes('row violates row-level security policy') || error.message.includes('row-level security') || error.code === '42501') {
    throw new Error(`Database RLS Violation during ${operation}: You need to go to your Supabase Dashboard -> Authentication -> Policies (or Database -> Policies) and create a policy for the 'products' table to allow INSERT, UPDATE, and DELETE operations for anon/authenticated roles. Note that 'upsert' requires both INSERT and UPDATE policies.`);
  }
  throw error;
};

/**
 * PRODUCTS
 */
export function subscribeToProducts(callback: (products: Product[]) => void): () => void {
  let active = true;
  let productsList: Product[] = [];

  const mapRow = (p: any): Product => ({
    ...p,
    id: p.id,
    name: p.description_headline || '',
    description: p.description_bullets || '',
    price: p.price || '',
    spec: p.technical_specs || '',
    availability: p.stock_status || '',
    imageUrl: p.front_image_url || '',
    staffNotes: p.staff_notes || '',
    category: p.category || '',
    createdAt: p.created_at || null,
    brand: p.brand || '',
    productCode: p.product_code || '',
    isAccessory: false
  });

  // 1. Fetch initial products
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('client_id', 'jotra');

      if (error) throw error;

      if (active && data) {
        const mappedData = (data as any[]).map(mapRow);
        
        // Sort by createdAt descending (using Date.now() fallback if none)
        mappedData.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        productsList = mappedData;
        callback(productsList);
        localStorage.setItem('jt_productsFallback', JSON.stringify(productsList));
      }
    } catch (err) {
      console.error('Supabase fetch products error, loading fallback:', err);
      // Load from localStorage fallback
      const stored = localStorage.getItem('jt_productsFallback');
      if (stored && active) {
        productsList = JSON.parse(stored);
        callback(productsList);
      }
    }
  };

  fetchProducts();

  // 2. Subscribe to real-time changes
  const channel = supabase
    .channel('public:products')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'products',
      filter: 'client_id=eq.jotra'
    }, (payload) => {
      if (!active) return;
      
      const { eventType, new: newRow, old: oldRow } = payload;
      
      if (eventType === 'INSERT') {
        productsList = [mapRow(newRow), ...productsList];
      } else if (eventType === 'UPDATE') {
        productsList = productsList.map(p => p.id === newRow.id ? mapRow(newRow) : p);
      } else if (eventType === 'DELETE') {
        productsList = productsList.filter(p => p.id !== oldRow.id);
      }
      
      // Keep sorted by createdAt desc
      productsList.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      callback(productsList);
      localStorage.setItem('jt_productsFallback', JSON.stringify(productsList));
    })
    .subscribe();

  return () => {
    active = false;
    channel.unsubscribe();
  };
}

export async function saveProduct(product: Product): Promise<any> {
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
    product_code: product.productCode || `PRD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  };

  const isNew = !product.id || String(product.id).includes('_') || String(product.id).startsWith('temp-');
  let result;

  try {
    if (isNew) {
      const { data, error } = await supabase
        .from('products')
        .insert(dbProduct)
        .select();
      if (error) handleSupabaseError(error, 'saving product');
      result = data && data[0];
    } else {
      const { data, error } = await supabase
        .from('products')
        .update(dbProduct)
        .eq('id', product.id)
        .select();
      if (error) handleSupabaseError(error, 'saving product');
      result = data && data[0];
    }
    return result;
  } catch (error) {
    console.error('Error saving product:', error);
    throw error;
  }
}


export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('client_id', 'jotra');

  if (error) handleSupabaseError(error, 'deleting product');
}

export async function saveProductsBulk(products: Product[]): Promise<void> {
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
    product_code: product.productCode || `PRD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  }));

  const { error } = await supabase
    .from('products')
    .insert(formattedProducts);

  if (error) handleSupabaseError(error, 'bulk saving products');
}

/**
 * GALLERY
 */
export function subscribeToGallery(callback: (photos: GalleryPhoto[]) => void): () => void {
  let active = true;
  let photosList: GalleryPhoto[] = [];

  const fetchGallery = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('client_id', 'jotra');

      if (error) throw error;

      if (active && data) {
        const mappedData = (data as any[]).map(p => ({
          id: p.id,
          name: p.description_headline || '',
          category: p.category || '',
          imageUrl: p.front_image_url || '',
          uploadDate: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
          uploadedBy: p.staff_notes || 'Unknown',
          status: 'active'
        })) as GalleryPhoto[];
        
        mappedData.sort((a, b) => b.uploadDate - a.uploadDate);
        photosList = mappedData;
        callback(photosList);
        localStorage.setItem('jt_galleryFallback', JSON.stringify(photosList));
      }
    } catch (err) {
      console.error('Supabase fetch gallery error, loading fallback:', err);
      const stored = localStorage.getItem('jt_galleryFallback');
      if (stored && active) {
        photosList = JSON.parse(stored);
        callback(photosList);
      }
    }
  };

  fetchGallery();

  const channel = supabase
    .channel('public:gallery')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'products',
      filter: 'client_id=eq.jotra'
    }, (payload) => {
      if (!active) return;
      
      const { eventType, new: newRow, old: oldRow } = payload;
      
      const mapRow = (p: any): GalleryPhoto => ({
        id: p.id,
        name: p.description_headline || '',
        category: p.category || '',
        imageUrl: p.front_image_url || '',
        uploadDate: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
        uploadedBy: p.staff_notes || 'Unknown',
        status: 'active'
      });

      if (eventType === 'INSERT') {
        photosList = [mapRow(newRow), ...photosList];
      } else if (eventType === 'UPDATE') {
        const index = photosList.findIndex(p => p.id === newRow.id);
        if (index >= 0) {
          photosList = photosList.map(p => p.id === newRow.id ? mapRow(newRow) : p);
        } else {
          photosList = [mapRow(newRow), ...photosList];
        }
      } else if (eventType === 'DELETE') {
        photosList = photosList.filter(p => p.id !== oldRow.id);
      }
      
      // Keep sorted
      photosList.sort((a, b) => b.uploadDate - a.uploadDate);

      callback(photosList);
      localStorage.setItem('jt_galleryFallback', JSON.stringify(photosList));
    })
    .subscribe();

  return () => {
    active = false;
    channel.unsubscribe();
  };
}

export async function saveGalleryPhoto(photo: GalleryPhoto): Promise<any> {
  const dbPhoto: any = {
    client_id: 'jotra',
    description_headline: photo.name,
    category: photo.category,
    front_image_url: photo.imageUrl,
    product_code: `GAL-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  };

  const isNew = !photo.id || String(photo.id).includes('_') || String(photo.id).startsWith('temp-');
  let result;

  try {
    if (isNew) {
      const { data, error } = await supabase
        .from('products')
        .insert(dbPhoto)
        .select();
      if (error) handleSupabaseError(error, 'saving gallery photo');
      result = data && data[0];
    } else {
      const { data, error } = await supabase
        .from('products')
        .update(dbPhoto)
        .eq('id', photo.id)
        .select();
      if (error) handleSupabaseError(error, 'saving gallery photo');
      result = data && data[0];
    }
    return result;
  } catch (error) {
    console.error('Error saving gallery photo:', error);
    throw error;
  }
}


export async function deleteGalleryPhoto(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('client_id', 'jotra');

  if (error) handleSupabaseError(error, 'deleting gallery photo');
}
