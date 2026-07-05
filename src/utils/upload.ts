import { supabase } from '../supabase';
import imageCompression from 'browser-image-compression';

export const compressAndConvertToBase64 = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string); // fallback to original base64
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

export const uploadToSupabase = async (file: File): Promise<string> => {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/jpeg'
  };
  
  let fileToUpload = file;
  try {
    fileToUpload = await imageCompression(file, options);
  } catch (error) {
    console.warn('Image compression failed, uploading original:', error);
  }

  const fileExt = fileToUpload.name.split('.').pop() || 'jpg';
  const filePath = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  try {
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, fileToUpload, {
        upsert: false,
        contentType: fileToUpload.type
      });

    if (error) {
      console.warn('Supabase storage upload failed, falling back to base64:', error);
      return await compressAndConvertToBase64(fileToUpload);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.warn('Supabase storage exception, falling back to base64:', err);
    return await compressAndConvertToBase64(fileToUpload);
  }
};

export const uploadOrConvertToBase64 = async (file: File, path: string): Promise<string> => {
  const cleanPath = path.replace(/^\/+/, '');
  try {
    const { data, error } = await supabase.storage.from('images').upload(cleanPath, file, {
      upsert: false,
      contentType: file.type
    });
    
    if (error) {
      console.warn('Supabase storage upload failed, falling back to base64:', error);
      return await compressAndConvertToBase64(file);
    }
    
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(cleanPath);
    return publicUrl;
  } catch (err) {
    console.warn('Supabase storage exception, falling back to base64:', err);
    return await compressAndConvertToBase64(file);
  }
};
