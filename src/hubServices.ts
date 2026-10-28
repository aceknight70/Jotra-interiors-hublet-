import { supabase } from './supabase';

export interface JotraAlly {
  id: string;
  ally_name: string;
  business_type?: string | null;
  description?: string | null;
  logo_or_photo?: string | null;
  contact_info?: {
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
  } | null;
  external_link?: string | null;
  referral_code?: string | null;
  status: 'active' | 'inactive';
  date_added?: string;
  referral_count?: number;
}

export interface JotraTenant {
  id: string;
  tenant_name: string;
  category?: string | null;
  description?: string | null;
  photos: string[]; // array of 30 photo URLs or nulls
  contact_info?: {
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
  } | null;
  invoicing_enabled?: boolean;
  referral_code?: string | null;
  assigned_by?: string;
  commission_rate?: number;
  pixel_id?: string | null; // Used for secure hashed PIN storage
  status: 'active' | 'inactive';
  date_added?: string;
  referral_traffic?: number;
  discovery_traffic?: number;
}

export interface JotraTenantProduct {
  id?: string;
  tenant_id: string;
  product_name: string;
  price?: number | null;
  unit: 'piece' | 'metre' | 'roll' | 'sheet' | 'pack' | 'kg' | 'litre';
  description?: string | null;
  photo_url?: string | null;
  category?: string | null;
  in_stock: boolean;
  date_added?: string;
  updated_at?: string;
}

export interface JotraTenantOrder {
  id?: string;
  tenant_id: string;
  product_id?: string | null;
  product_name_snapshot: string;
  unit_snapshot: string;
  quantity: number;
  price_per_unit_snapshot?: number | null;
  total_amount?: number | null;
  customer_name: string;
  customer_phone: string;
  delivery_requested: boolean;
  delivery_address?: string | null;
  status: 'Pending' | 'Completed' | 'Cancelled';
  created_at?: string;
}

export interface JotraTenantCommission {
  id?: string;
  tenant_id: string;
  tenant_name?: string;
  referral_code?: string;
  invoice_reference: string;
  customer_name: string;
  sale_amount: number;
  commission_rate_applied: number;
  commission_amount: number;
  status: 'Pending' | 'Paid' | 'Reversed';
  logged_by_staff: string;
  reversed_by?: string | null;
  reversed_at?: string | null;
  reversal_reason?: string | null;
  created_at?: string;
}

export interface JotraMasterNotification {
  id?: string;
  tenant_id?: string;
  tenant_name?: string;
  event: string;
  by_role: string;
  seen: boolean;
  created_at?: string;
}

/**
 * SHA-256 Hash Helper for Tenant PINs
 */
export async function hashPin(pin: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(pin.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Upload Photo to Supabase 'jotra-tenant-photos' Bucket
 */
export async function uploadTenantPhoto(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
  
  const { data, error } = await supabase.storage
    .from('jotra-tenant-photos')
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type || 'image/jpeg'
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error('Failed to upload photo to jotra-tenant-photos bucket: ' + error.message);
  }

  const { data: urlData } = supabase.storage
    .from('jotra-tenant-photos')
    .getPublicUrl(data.path);

  if (!urlData?.publicUrl) {
    throw new Error('Could not retrieve public URL for uploaded photo.');
  }

  return urlData.publicUrl;
}

/**
 * HUBALLY SERVICES
 */
export async function fetchActiveAllies(): Promise<JotraAlly[]> {
  const { data, error } = await supabase
    .from('jotra_allies')
    .select('*')
    .eq('status', 'active')
    .order('date_added', { ascending: false });

  if (error) {
    console.error('Error fetching active allies:', error);
    return [];
  }
  return (data as JotraAlly[]) || [];
}

export async function fetchAllAllies(): Promise<JotraAlly[]> {
  const { data, error } = await supabase
    .from('jotra_allies')
    .select('*')
    .order('date_added', { ascending: false });

  if (error) {
    console.error('Error fetching all allies:', error);
    return [];
  }

  // Also fetch referral counts
  const { data: refs } = await supabase.from('jotra_ally_referrals').select('ally_id');
  const counts: Record<string, number> = {};
  if (refs) {
    refs.forEach((r: any) => {
      counts[r.ally_id] = (counts[r.ally_id] || 0) + 1;
    });
  }

  return (data || []).map((ally: any) => ({
    ...ally,
    referral_count: counts[ally.id] || 0
  }));
}

export async function logAllyReferral(allyId: string): Promise<void> {
  try {
    await supabase.from('jotra_ally_referrals').insert({ ally_id: allyId });
  } catch (err) {
    console.error('Error logging ally referral:', err);
  }
}

export async function saveAlly(ally: Partial<JotraAlly>): Promise<JotraAlly> {
  // Generate referral code if empty
  const referral_code = ally.referral_code?.trim() || 
    (ally.ally_name?.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7) || 'ALLY') + Math.floor(10 + Math.random() * 90);

  const payload: any = {
    ally_name: ally.ally_name,
    business_type: ally.business_type || null,
    description: ally.description || null,
    logo_or_photo: ally.logo_or_photo || null,
    contact_info: ally.contact_info || null,
    external_link: ally.external_link || null,
    referral_code,
    status: ally.status || 'active'
  };

  if (ally.id) {
    const { data, error } = await supabase
      .from('jotra_allies')
      .update(payload)
      .eq('id', ally.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('jotra_allies')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteAlly(id: string): Promise<void> {
  const { error } = await supabase.from('jotra_allies').delete().eq('id', id);
  if (error) throw error;
}

export async function getAllyByCode(code: string): Promise<JotraAlly | null> {
  const clean = (code || '').trim();
  if (!clean) return null;

  // 1. Try exact referral code match
  const { data, error } = await supabase
    .from('jotra_allies')
    .select('*')
    .ilike('referral_code', clean.toUpperCase())
    .limit(1);

  if (!error && data && data.length > 0) {
    return data[0] as JotraAlly;
  }

  // 2. Try ally name match
  const { data: nameMatches } = await supabase
    .from('jotra_allies')
    .select('*')
    .ilike('ally_name', `%${clean}%`)
    .limit(1);

  if (nameMatches && nameMatches.length > 0) {
    return nameMatches[0] as JotraAlly;
  }

  return null;
}

/**
 * HUBTENANT SERVICES
 */
export async function fetchActiveTenants(): Promise<JotraTenant[]> {
  const { data, error } = await supabase
    .from('jotra_tenants')
    .select('*')
    .eq('status', 'active')
    .order('date_added', { ascending: false });

  if (error) {
    console.error('Error fetching active tenants:', error);
    return [];
  }
  return (data as JotraTenant[]) || [];
}

export async function fetchAllTenants(): Promise<JotraTenant[]> {
  const { data, error } = await supabase
    .from('jotra_tenants')
    .select('*')
    .order('date_added', { ascending: false });

  if (error) {
    console.error('Error fetching all tenants:', error);
    return [];
  }

  // Fetch traffic counts
  const { data: traffic } = await supabase.from('jotra_tenant_traffic').select('tenant_id, source');
  const refCounts: Record<string, number> = {};
  const discCounts: Record<string, number> = {};

  if (traffic) {
    traffic.forEach((t: any) => {
      if (t.source === 'referral') {
        refCounts[t.tenant_id] = (refCounts[t.tenant_id] || 0) + 1;
      } else {
        discCounts[t.tenant_id] = (discCounts[t.tenant_id] || 0) + 1;
      }
    });
  }

  return (data || []).map((t: any) => ({
    ...t,
    referral_traffic: refCounts[t.id] || 0,
    discovery_traffic: discCounts[t.id] || 0
  }));
}

export async function getTenantByCode(code: string): Promise<JotraTenant | null> {
  const clean = code.trim();
  if (!clean) return null;

  // 1. Try exact referral code match
  const { data, error } = await supabase
    .from('jotra_tenants')
    .select('*')
    .ilike('referral_code', clean.toUpperCase())
    .limit(1);

  if (!error && data && data.length > 0) {
    return data[0] as JotraTenant;
  }

  // 2. Try tenant name match (e.g. RueRack, Shed's RueRack)
  const { data: nameMatches } = await supabase
    .from('jotra_tenants')
    .select('*')
    .ilike('tenant_name', `%${clean}%`)
    .limit(1);

  if (nameMatches && nameMatches.length > 0) {
    return nameMatches[0] as JotraTenant;
  }

  // 3. Fallback: RueRack alias to SHEDRACK01
  if (clean.toUpperCase().includes('RUERACK')) {
    const { data: ruerackMatch } = await supabase
      .from('jotra_tenants')
      .select('*')
      .ilike('referral_code', 'SHEDRACK01')
      .limit(1);
    if (ruerackMatch && ruerackMatch.length > 0) {
      return ruerackMatch[0] as JotraTenant;
    }
  }

  return null;
}

export async function logTenantTraffic(tenantId: string, source: 'referral' | 'discovery'): Promise<void> {
  try {
    await supabase.from('jotra_tenant_traffic').insert({ tenant_id: tenantId, source });
  } catch (err) {
    console.error('Error logging tenant traffic:', err);
  }
}

export async function saveTenant(
  tenant: Partial<JotraTenant>, 
  byRole: 'manager' | 'master' = 'manager'
): Promise<JotraTenant> {
  const referral_code = tenant.referral_code?.trim().toUpperCase() || 
    (tenant.tenant_name?.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7) || 'TENANT') + Math.floor(10 + Math.random() * 90);

  const payload: any = {
    tenant_name: tenant.tenant_name,
    category: tenant.category || null,
    description: tenant.description || null,
    photos: Array.isArray(tenant.photos) ? tenant.photos : [],
    contact_info: tenant.contact_info || null,
    invoicing_enabled: tenant.invoicing_enabled ?? true,
    referral_code,
    assigned_by: tenant.assigned_by || byRole,
    commission_rate: tenant.commission_rate ?? 1.0,
    status: tenant.status || 'active'
  };

  // If a hashed PIN is being set or updated
  if (tenant.pixel_id) {
    payload.pixel_id = tenant.pixel_id;
  }

  let result: JotraTenant;
  if (tenant.id) {
    const { data, error } = await supabase
      .from('jotra_tenants')
      .update(payload)
      .eq('id', tenant.id)
      .select()
      .single();
    if (error) throw error;
    result = data;

    // Notify Master of change
    await supabase.from('jotra_master_tenant_notifications').insert({
      tenant_id: result.id,
      tenant_name: result.tenant_name,
      event: `Tenant '${result.tenant_name}' updated (Code: ${result.referral_code})`,
      by_role: byRole
    });
  } else {
    // If new tenant, default 30 placeholder slots if photos empty
    if (!payload.photos || payload.photos.length === 0) {
      payload.photos = [];
    }
    const { data, error } = await supabase
      .from('jotra_tenants')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    result = data;

    // Notify Master of creation
    await supabase.from('jotra_master_tenant_notifications').insert({
      tenant_id: result.id,
      tenant_name: result.tenant_name,
      event: `New tenant added: '${result.tenant_name}' (Assigned Code: ${result.referral_code})`,
      by_role: byRole
    });
  }

  return result;
}

export async function resetTenantPin(tenantId: string, newPin: string): Promise<void> {
  const pinHash = await hashPin(newPin);
  const { error } = await supabase
    .from('jotra_tenants')
    .update({ pixel_id: pinHash })
    .eq('id', tenantId);

  if (error) throw error;
}

export async function deleteTenant(id: string): Promise<void> {
  const { error } = await supabase.from('jotra_tenants').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Update Tenant Photos Array (Survives login/logout and across devices)
 */
export async function updateTenantPhotoSlot(tenantId: string, slotIndex: number, photoUrl: string): Promise<string[]> {
  // First fetch latest photos from DB
  const { data, error } = await supabase
    .from('jotra_tenants')
    .select('photos')
    .eq('id', tenantId)
    .single();

  if (error) throw error;

  const currentPhotos: string[] = Array.isArray(data?.photos) ? [...data.photos] : [];
  // Ensure array has enough slots
  while (currentPhotos.length <= slotIndex) {
    currentPhotos.push('');
  }
  currentPhotos[slotIndex] = photoUrl;

  const { error: updateError } = await supabase
    .from('jotra_tenants')
    .update({ photos: currentPhotos })
    .eq('id', tenantId);

  if (updateError) throw updateError;
  return currentPhotos;
}

/**
 * TENANT PRODUCTS SERVICES
 */
export async function fetchTenantProducts(tenantId: string): Promise<JotraTenantProduct[]> {
  const { data, error } = await supabase
    .from('jotra_tenant_products')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('date_added', { ascending: false });

  if (error) {
    console.error('Error fetching tenant products:', error);
    return [];
  }
  return (data as JotraTenantProduct[]) || [];
}

export async function saveTenantProduct(product: JotraTenantProduct): Promise<JotraTenantProduct> {
  const payload = {
    tenant_id: product.tenant_id,
    product_name: product.product_name,
    price: product.price ?? null,
    unit: product.unit || 'piece',
    description: product.description || null,
    photo_url: product.photo_url || null,
    category: product.category || null,
    in_stock: product.in_stock ?? true,
    updated_at: new Date().toISOString()
  };

  if (product.id) {
    const { data, error } = await supabase
      .from('jotra_tenant_products')
      .update(payload)
      .eq('id', product.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('jotra_tenant_products')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteTenantProduct(id: string): Promise<void> {
  const { error } = await supabase.from('jotra_tenant_products').delete().eq('id', id);
  if (error) throw error;
}

/**
 * TENANT ORDERS SERVICES
 */
export async function createTenantOrder(order: JotraTenantOrder): Promise<JotraTenantOrder> {
  const payload = {
    tenant_id: order.tenant_id,
    product_id: order.product_id || null,
    product_name_snapshot: order.product_name_snapshot,
    unit_snapshot: order.unit_snapshot,
    quantity: order.quantity,
    price_per_unit_snapshot: order.price_per_unit_snapshot ?? null,
    total_amount: order.total_amount ?? null,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    delivery_requested: order.delivery_requested,
    delivery_address: order.delivery_requested ? (order.delivery_address || null) : null,
    status: order.status || 'Pending'
  };

  const { data, error } = await supabase
    .from('jotra_tenant_orders')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchTenantOrders(tenantId: string): Promise<JotraTenantOrder[]> {
  const { data, error } = await supabase
    .from('jotra_tenant_orders')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tenant orders:', error);
    return [];
  }
  return (data as JotraTenantOrder[]) || [];
}

export async function updateTenantOrderStatus(orderId: string, status: 'Pending' | 'Completed' | 'Cancelled'): Promise<void> {
  const { error } = await supabase
    .from('jotra_tenant_orders')
    .update({ status })
    .eq('id', orderId);

  if (error) throw error;
}

/**
 * TENANT COMMISSIONS & EARNINGS SERVICES
 */
export async function fetchTenantCommissions(tenantId: string): Promise<JotraTenantCommission[]> {
  const { data, error } = await supabase
    .from('jotra_tenant_commissions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tenant commissions:', error);
    return [];
  }
  return (data as JotraTenantCommission[]) || [];
}

export async function fetchAllCommissions(): Promise<JotraTenantCommission[]> {
  const { data, error } = await supabase
    .from('jotra_tenant_commissions')
    .select('*, jotra_tenants(tenant_name, referral_code)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all commissions:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    ...row,
    tenant_name: row.jotra_tenants?.tenant_name || 'Tenant',
    referral_code: row.jotra_tenants?.referral_code || ''
  }));
}

export async function recordCommission(params: {
  tenant_id: string;
  invoice_reference: string;
  customer_name: string;
  sale_amount: number;
  commission_rate: number;
  logged_by_staff: string;
}): Promise<JotraTenantCommission> {
  const commission_amount = (params.sale_amount * params.commission_rate) / 100;
  const payload = {
    tenant_id: params.tenant_id,
    invoice_reference: params.invoice_reference,
    customer_name: params.customer_name,
    sale_amount: params.sale_amount,
    commission_rate_applied: params.commission_rate,
    commission_amount,
    status: 'Pending',
    logged_by_staff: params.logged_by_staff
  };

  const { data, error } = await supabase
    .from('jotra_tenant_commissions')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCommissionStatus(
  commissionId: string, 
  status: 'Pending' | 'Paid' | 'Reversed',
  reversalInfo?: { reversed_by: string; reversal_reason: string }
): Promise<void> {
  const payload: any = { status };
  if (status === 'Reversed' && reversalInfo) {
    payload.reversed_by = reversalInfo.reversed_by;
    payload.reversed_at = new Date().toISOString();
    payload.reversal_reason = reversalInfo.reversal_reason;
  }

  const { error } = await supabase
    .from('jotra_tenant_commissions')
    .update(payload)
    .eq('id', commissionId);

  if (error) throw error;
}

/**
 * MASTER NOTIFICATIONS & MANAGER SECURITY SERVICES
 */
export async function fetchMasterNotifications(): Promise<JotraMasterNotification[]> {
  const { data, error } = await supabase
    .from('jotra_master_tenant_notifications')
    .select('*')
    .neq('tenant_name', 'SYSTEM_MANAGER_SECURITY')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching master notifications:', error);
    return [];
  }
  return (data as JotraMasterNotification[]) || [];
}

export async function markNotificationSeen(id: string): Promise<void> {
  await supabase
    .from('jotra_master_tenant_notifications')
    .update({ seen: true })
    .eq('id', id);
}

/**
 * MANAGER HUB PIN SECURITY
 * Stored securely hashed (SHA-256) in jotra_master_tenant_notifications
 * under tenant_name = 'SYSTEM_MANAGER_SECURITY'.
 * Master sets and updates it. Never plain text. No default placeholder.
 */
export async function getManagerPinHash(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('jotra_master_tenant_notifications')
      .select('event')
      .eq('tenant_name', 'SYSTEM_MANAGER_SECURITY')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching manager pin hash:', error);
      return null;
    }

    if (data && data.length > 0) {
      const ev = (data[0].event || '').trim();
      if (ev.startsWith('MANAGER_PIN_HASH:')) {
        return ev.replace('MANAGER_PIN_HASH:', '').trim();
      }
    }
    return null;
  } catch (err) {
    console.error('Error getting manager pin hash:', err);
    return null;
  }
}

export async function setManagerPin(newPin: string): Promise<void> {
  const cleanPin = (newPin || '').trim();
  if (!cleanPin) {
    throw new Error('Manager PIN cannot be empty.');
  }
  const hashed = await hashPin(cleanPin);
  const { error } = await supabase
    .from('jotra_master_tenant_notifications')
    .insert({
      tenant_id: null,
      tenant_name: 'SYSTEM_MANAGER_SECURITY',
      event: 'MANAGER_PIN_HASH:' + hashed,
      by_role: 'master',
      seen: true
    });

  if (error) {
    console.error('Error saving manager PIN:', error);
    throw new Error('Failed to save manager PIN: ' + error.message);
  }
}

