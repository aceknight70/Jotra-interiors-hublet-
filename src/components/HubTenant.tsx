import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, UserCheck, Phone, MessageSquare, Plus, Edit2, Trash2, 
  ArrowLeft, Search, CheckCircle, ShieldCheck, Share2, Upload, Lock,
  ShoppingBag, Image as ImageIcon, DollarSign, PackageCheck, AlertCircle,
  Truck, Check, Clock, Eye, RefreshCw, KeyRound, ChevronRight, X, Link2
} from 'lucide-react';
import { 
  JotraTenant, JotraTenantProduct, JotraTenantOrder, JotraTenantCommission,
  JotraMasterNotification, fetchActiveTenants, fetchAllTenants, getTenantByCode,
  saveTenant, deleteTenant, resetTenantPin, logTenantTraffic, updateTenantPhotoSlot,
  fetchTenantProducts, saveTenantProduct, deleteTenantProduct, createTenantOrder,
  fetchTenantOrders, updateTenantOrderStatus, fetchTenantCommissions, fetchAllCommissions,
  recordCommission, updateCommissionStatus, fetchMasterNotifications, markNotificationSeen,
  uploadTenantPhoto, hashPin, getManagerPinHash, setManagerPin
} from '../hubServices';

interface HubTenantProps {
  onBack?: () => void;
  isStaffLoggedIn?: boolean;
  initialCode?: string | null;
  onSetReferralBanner?: (tenant: JotraTenant | null) => void;
  onGoToShowroom?: () => void;
  isManagerAuthenticated?: boolean;
  setIsManagerAuthenticated?: (v: boolean) => void;
}

// Public base URL setting for shareable links; falls back to window.location.origin if empty
export const PUBLIC_BASE_URL = "https://jotra-interiors.hublet.cc";

export const getTenantBaseUrl = () => {
  const custom = (PUBLIC_BASE_URL || '').trim();
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  const rawBase = custom || origin;
  return rawBase.replace(/\/+$/, '');
};

export const getTenantShareableLink = (code: string) => {
  const base = getTenantBaseUrl();
  return `${base}/?tenant=${encodeURIComponent(code || '')}`;
};

// 30 high-quality workshop & artisan placeholder visual templates
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80', // Welding torch
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80', // Electrical board
  'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80', // Metal fabrication
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80', // Electrical wiring
  'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80', // Steel cutting
  'https://images.unsplash.com/photo-1508873696983-2df5703bc225?auto=format&fit=crop&w=600&q=80', // Industrial sparks
  'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=600&q=80', // Tools & workshop
  'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80', // Workshop craft
  'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=600&q=80', // Electrical switches
  'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80', // Construction worker
  'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=600&q=80', // Safety helmet
  'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=600&q=80', // Equipment
  'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=600&q=80', // Precision welding
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80', // Tech gears
  'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=600&q=80', // Metal tube
  'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=600&q=80', // Industrial piping
  'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=600&q=80', // Machine lathe
  'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=600&q=80', // Electronic components
  'https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?auto=format&fit=crop&w=600&q=80', // Power breakers
  'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=600&q=80', // Assembly bench
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80', // Welder in mask
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80', // Circuitry
  'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80', // Iron framing
  'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80', // Grinder sparks
  'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=600&q=80', // Measuring caliper
  'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=600&q=80', // Power socket box
  'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80', // Heavy machinery
  'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=600&q=80', // Project supervisor
  'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=600&q=80', // Steel joinery
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80'  // Finished electrical box
];

export default function HubTenant({ 
  onBack, 
  isStaffLoggedIn, 
  initialCode, 
  onSetReferralBanner,
  onGoToShowroom,
  isManagerAuthenticated,
  setIsManagerAuthenticated
}: HubTenantProps) {
  // Navigation & Tenant state
  const [tenants, setTenants] = useState<JotraTenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<JotraTenant | null>(null);
  const [pendingConfirmationTenant, setPendingConfirmationTenant] = useState<{ tenant: JotraTenant; source: 'referral' | 'discovery' } | null>(null);
  const [tenantNotFound, setTenantNotFound] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [enterCode, setEnterCode] = useState('');
  const [enterCodeError, setEnterCodeError] = useState('');

  // Active space view
  const [activeTab, setActiveTab] = useState<'gallery' | 'products' | 'admin'>('gallery');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Tenant Authentication
  const [isTenantAuthenticated, setIsTenantAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinAttempts, setPinAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [remainingLockoutSecs, setRemainingLockoutSecs] = useState(0);

  // Tenant Products & Ordering
  const [tenantProducts, setTenantProducts] = useState<JotraTenantProduct[]>([]);
  const [orderingProduct, setOrderingProduct] = useState<JotraTenantProduct | null>(null);
  const [orderQuantity, setOrderQuantity] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryRequested, setDeliveryRequested] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Tenant Admin / Manager Data
  const [tenantOrders, setTenantOrders] = useState<JotraTenantOrder[]>([]);
  const [tenantCommissions, setTenantCommissions] = useState<JotraTenantCommission[]>([]);
  const [editingProduct, setEditingProduct] = useState<Partial<JotraTenantProduct> | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadingSlotIndex, setUploadingSlotIndex] = useState<number | null>(null);

  // Manager Hub state & PIN Security
  const [isManagerMode, setIsManagerMode] = useState(false);
  const [managerTab, setManagerTab] = useState<'tenants' | 'commissions' | 'notifications' | 'master_settings'>('tenants');
  const [managerTenants, setManagerTenants] = useState<JotraTenant[]>([]);
  const [allCommissions, setAllCommissions] = useState<JotraTenantCommission[]>([]);
  const [notifications, setNotifications] = useState<JotraMasterNotification[]>([]);
  const [editingTenant, setEditingTenant] = useState<Partial<JotraTenant> | null>(null);
  const [resetPinTenant, setResetPinTenant] = useState<JotraTenant | null>(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [newCommissionForm, setNewCommissionForm] = useState({
    tenant_id: '',
    invoice_reference: '',
    customer_name: '',
    sale_amount: '',
    commission_rate: 1.0,
    logged_by_staff: 'Manager'
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [linkModalTenant, setLinkModalTenant] = useState<JotraTenant | null>(null);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  // Manager PIN Modal State
  const [showManagerPinModal, setShowManagerPinModal] = useState(false);
  const [managerPinInput, setManagerPinInput] = useState('');
  const [managerPinError, setManagerPinError] = useState('');
  const [managerPinAttempts, setManagerPinAttempts] = useState(0);
  const [managerLockoutUntil, setManagerLockoutUntil] = useState<number | null>(null);
  const [managerRemainingLockoutSecs, setManagerRemainingLockoutSecs] = useState(0);
  const [storedManagerPinHash, setStoredManagerPinHash] = useState<string | null | undefined>(undefined);
  const [checkingManagerPin, setCheckingManagerPin] = useState(false);

  // Master Set / Change Manager PIN Modal State
  const [showMasterChangePinModal, setShowMasterChangePinModal] = useState(false);
  const [masterPinInput, setMasterPinInput] = useState('');
  const [newManagerPinInput, setNewManagerPinInput] = useState('');
  const [confirmNewManagerPinInput, setConfirmNewManagerPinInput] = useState('');
  const [masterPinError, setMasterPinError] = useState('');
  const [masterPinSuccess, setMasterPinSuccess] = useState('');
  const [isSavingManagerPin, setIsSavingManagerPin] = useState(false);

  // Load Tenants list
  const loadTenants = async () => {
    setLoading(true);
    try {
      const active = await fetchActiveTenants();
      setTenants(active);

      // Handle initial code from URL (?tenant=CODE)
      if (initialCode) {
        const found = await getTenantByCode(initialCode);
        if (found) {
          setPendingConfirmationTenant({ tenant: found, source: 'referral' });
        } else {
          setTenantNotFound(initialCode);
        }
      }

      if (isManagerMode) {
        const fullTenants = await fetchAllTenants();
        setManagerTenants(fullTenants);
      }
    } catch (err) {
      console.error('Error loading tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [isManagerMode]);

  // Handle countdown for lockout
  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = setInterval(() => {
      const diff = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (diff <= 0) {
        setLockoutUntil(null);
        setPinAttempts(0);
        setPinError('');
      } else {
        setRemainingLockoutSecs(diff);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // Handle countdown for Manager Lockout
  useEffect(() => {
    if (!managerLockoutUntil) return;
    const interval = setInterval(() => {
      const diff = Math.ceil((managerLockoutUntil - Date.now()) / 1000);
      if (diff <= 0) {
        setManagerLockoutUntil(null);
        setManagerPinAttempts(0);
        setManagerPinError('');
      } else {
        setManagerRemainingLockoutSecs(diff);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [managerLockoutUntil]);

  // Fetch current Manager PIN configuration when Manager PIN modal opens
  useEffect(() => {
    if (showManagerPinModal) {
      setCheckingManagerPin(true);
      getManagerPinHash().then(hash => {
        setStoredManagerPinHash(hash);
        setCheckingManagerPin(false);
      });
    }
  }, [showManagerPinModal]);

  // Load space details when tenant is selected
  useEffect(() => {
    if (!selectedTenant) return;
    setIsTenantAuthenticated(false);
    setPinInput('');
    setPinError('');
    setActiveTab('gallery');
    
    // Load products
    fetchTenantProducts(selectedTenant.id).then(setTenantProducts);
  }, [selectedTenant?.id]);

  // Load authenticated data for tenant
  const loadAuthenticatedTenantData = async (tenantId: string) => {
    const [orders, commissions] = await Promise.all([
      fetchTenantOrders(tenantId),
      fetchTenantCommissions(tenantId)
    ]);
    setTenantOrders(orders);
    setTenantCommissions(commissions);
  };

  // Confirmation handling ("Is this who you want to buy from?")
  const handleConfirmTenant = async (confirmed: boolean) => {
    if (!pendingConfirmationTenant) return;
    const { tenant, source } = pendingConfirmationTenant;
    setPendingConfirmationTenant(null);

    if (confirmed) {
      // Log traffic
      await logTenantTraffic(tenant.id, source);
      setSelectedTenant(tenant);
      if (onSetReferralBanner && source === 'referral') {
        onSetReferralBanner(tenant);
      }
    } else {
      if (source === 'referral') {
        if (onGoToShowroom) {
          onGoToShowroom();
        } else if (onBack) {
          onBack();
        }
      }
    }
  };

  // Enter by code / ID
  const handleEnterByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enterCode.trim()) return;
    setEnterCodeError('');
    try {
      const found = await getTenantByCode(enterCode);
      if (found) {
        setEnterCode('');
        setPendingConfirmationTenant({ tenant: found, source: 'referral' });
      } else {
        setEnterCodeError(`No tenant found with code "${enterCode.toUpperCase()}".`);
      }
    } catch (err) {
      setEnterCodeError('Error looking up tenant code.');
    }
  };

  // Tenant PIN Authentication (4-digit, hashed with SHA-256)
  const handleTenantLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    if (lockoutUntil && Date.now() < lockoutUntil) {
      setPinError(`Account locked. Please wait ${remainingLockoutSecs}s.`);
      return;
    }

    if (pinInput.length !== 4) {
      setPinError('Please enter a 4-digit PIN.');
      return;
    }

    const inputHash = await hashPin(pinInput);

    if (selectedTenant.pixel_id && selectedTenant.pixel_id === inputHash) {
      setIsTenantAuthenticated(true);
      setPinError('');
      setPinInput('');
      setPinAttempts(0);
      await loadAuthenticatedTenantData(selectedTenant.id);
    } else {
      const newAttempts = pinAttempts + 1;
      setPinAttempts(newAttempts);
      if (newAttempts >= 5) {
        const lockoutTime = Date.now() + 5 * 60 * 1000; // 5 minutes
        setLockoutUntil(lockoutTime);
        setRemainingLockoutSecs(300);
        setPinError('5 incorrect attempts. Account locked for 5 minutes.');
      } else {
        setPinError(`Incorrect PIN. ${5 - newAttempts} attempt(s) remaining.`);
      }
    }
  };

  const handleTenantLogout = () => {
    setIsTenantAuthenticated(false);
    setActiveTab('gallery');
  };

  // Upload Photo to Gallery slot (survives logout & across devices)
  const handleSlotPhotoUpload = async (slotIndex: number, file: File) => {
    if (!selectedTenant) return;
    setUploadingSlotIndex(slotIndex);
    try {
      const publicUrl = await uploadTenantPhoto(file);
      const updatedPhotos = await updateTenantPhotoSlot(selectedTenant.id, slotIndex, publicUrl);
      setSelectedTenant({ ...selectedTenant, photos: updatedPhotos });
    } catch (err: any) {
      alert('Photo upload failed: ' + err.message);
    } finally {
      setUploadingSlotIndex(null);
    }
  };

  // Customer Order calculation
  const calculatedOrderTotal = () => {
    if (!orderingProduct?.price) return null;
    const qty = parseFloat(orderQuantity) || 0;
    return qty * orderingProduct.price;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant || !orderingProduct) return;
    const qty = parseFloat(orderQuantity);
    if (!qty || qty <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }
    if (!customerName || !customerPhone) {
      alert('Please provide your name and phone number.');
      return;
    }
    if (deliveryRequested && !deliveryAddress.trim()) {
      alert('Please enter your delivery address.');
      return;
    }

    setOrderSubmitting(true);
    try {
      await createTenantOrder({
        tenant_id: selectedTenant.id,
        product_id: orderingProduct.id,
        product_name_snapshot: orderingProduct.product_name,
        unit_snapshot: orderingProduct.unit,
        quantity: qty,
        price_per_unit_snapshot: orderingProduct.price ?? null,
        total_amount: calculatedOrderTotal(),
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_requested: deliveryRequested,
        delivery_address: deliveryAddress,
        status: 'Pending'
      });
      setOrderSuccess(true);
      setTimeout(() => {
        setOrderSuccess(false);
        setOrderingProduct(null);
        setOrderQuantity('1');
        setCustomerName('');
        setCustomerPhone('');
        setDeliveryAddress('');
        setDeliveryRequested(false);
      }, 2500);
    } catch (err: any) {
      alert('Failed to place order: ' + err.message);
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Product CRUD
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant || !editingProduct?.product_name) return;
    try {
      await saveTenantProduct({
        ...editingProduct,
        tenant_id: selectedTenant.id,
        product_name: editingProduct.product_name,
        unit: editingProduct.unit || 'piece',
        in_stock: editingProduct.in_stock ?? true
      } as JotraTenantProduct);
      setEditingProduct(null);
      const updated = await fetchTenantProducts(selectedTenant.id);
      setTenantProducts(updated);
    } catch (err: any) {
      alert('Failed to save product: ' + err.message);
    }
  };

  const handleDeleteProduct = async (productId: string, name: string) => {
    if (!selectedTenant || !window.confirm(`Delete product "${name}"?`)) return;
    try {
      await deleteTenantProduct(productId);
      const updated = await fetchTenantProducts(selectedTenant.id);
      setTenantProducts(updated);
    } catch (err: any) {
      alert('Failed to delete product: ' + err.message);
    }
  };

  // Manager Hub actions & PIN protection
  const handleOpenManagerHubClick = async () => {
    if (isManagerAuthenticated) {
      setIsManagerMode(true);
      setManagerTab('tenants');
      const [fullTenants, commissions, notifs] = await Promise.all([
        fetchAllTenants(),
        fetchAllCommissions(),
        fetchMasterNotifications()
      ]);
      setManagerTenants(fullTenants);
      setAllCommissions(commissions);
      setNotifications(notifs);
    } else {
      setManagerPinInput('');
      setManagerPinError('');
      setShowManagerPinModal(true);
    }
  };

  const handleLockManagerHub = () => {
    setIsManagerMode(false);
    if (setIsManagerAuthenticated) {
      setIsManagerAuthenticated(false);
    }
  };

  const handleManagerPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (managerLockoutUntil && Date.now() < managerLockoutUntil) {
      setManagerPinError(`Manager Hub locked. Please wait ${managerRemainingLockoutSecs}s.`);
      return;
    }

    if (!storedManagerPinHash) {
      setManagerPinError('Master must set the Manager PIN first.');
      return;
    }

    if (!managerPinInput.trim()) {
      setManagerPinError('Please enter the Manager PIN.');
      return;
    }

    const inputHash = await hashPin(managerPinInput.trim());
    if (inputHash === storedManagerPinHash) {
      // Session authenticated
      if (setIsManagerAuthenticated) {
        setIsManagerAuthenticated(true);
      }
      setShowManagerPinModal(false);
      setIsManagerMode(true);
      setManagerPinInput('');
      setManagerPinError('');
      setManagerPinAttempts(0);
      const [fullTenants, commissions, notifs] = await Promise.all([
        fetchAllTenants(),
        fetchAllCommissions(),
        fetchMasterNotifications()
      ]);
      setManagerTenants(fullTenants);
      setAllCommissions(commissions);
      setNotifications(notifs);
    } else {
      const next = managerPinAttempts + 1;
      setManagerPinAttempts(next);
      if (next >= 5) {
        const lockUntil = Date.now() + 5 * 60 * 1000;
        setManagerLockoutUntil(lockUntil);
        setManagerRemainingLockoutSecs(300);
        setManagerPinError('5 incorrect attempts. Manager Hub locked for 5 minutes.');
      } else {
        setManagerPinError(`Incorrect Manager PIN. ${5 - next} attempt(s) remaining.`);
      }
    }
  };

  const handleMasterChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMasterPinError('');
    setMasterPinSuccess('');

    // Check Master PIN (must match Master credentials: '0000' or active staff login)
    if (!isStaffLoggedIn && masterPinInput.trim() !== '0000') {
      setMasterPinError('Incorrect Master PIN.');
      return;
    }

    if (!newManagerPinInput.trim() || newManagerPinInput.trim().length < 4) {
      setMasterPinError('Manager PIN must be at least 4 digits.');
      return;
    }

    if (newManagerPinInput.trim() !== confirmNewManagerPinInput.trim()) {
      setMasterPinError('New PINs do not match.');
      return;
    }

    setIsSavingManagerPin(true);
    try {
      await setManagerPin(newManagerPinInput.trim());
      const newHash = await hashPin(newManagerPinInput.trim());
      setStoredManagerPinHash(newHash);
      setMasterPinSuccess('Manager PIN updated successfully! It is now active.');
      setMasterPinInput('');
      setNewManagerPinInput('');
      setConfirmNewManagerPinInput('');
      setTimeout(() => {
        setShowMasterChangePinModal(false);
        setMasterPinSuccess('');
      }, 1500);
    } catch (err: any) {
      setMasterPinError('Failed to save Manager PIN: ' + err.message);
    } finally {
      setIsSavingManagerPin(false);
    }
  };

  const handleSaveTenantManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant?.tenant_name) return;
    try {
      await saveTenant(editingTenant, 'manager');
      setEditingTenant(null);
      const fullTenants = await fetchAllTenants();
      setManagerTenants(fullTenants);
      await loadTenants();
    } catch (err: any) {
      alert('Failed to save tenant: ' + err.message);
    }
  };

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPinTenant || newPinValue.length !== 4) {
      alert('Please enter a valid 4-digit PIN.');
      return;
    }
    try {
      await resetTenantPin(resetPinTenant.id, newPinValue);
      alert(`PIN successfully reset for ${resetPinTenant.tenant_name}.`);
      setResetPinTenant(null);
      setNewPinValue('');
      const fullTenants = await fetchAllTenants();
      setManagerTenants(fullTenants);
    } catch (err: any) {
      alert('Failed to reset PIN: ' + err.message);
    }
  };

  const handleRecordCommissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newCommissionForm.sale_amount);
    if (!newCommissionForm.tenant_id || !newCommissionForm.invoice_reference || !amount) {
      alert('Please fill all required commission fields.');
      return;
    }
    try {
      await recordCommission({
        tenant_id: newCommissionForm.tenant_id,
        invoice_reference: newCommissionForm.invoice_reference,
        customer_name: newCommissionForm.customer_name || 'Customer',
        sale_amount: amount,
        commission_rate: newCommissionForm.commission_rate,
        logged_by_staff: newCommissionForm.logged_by_staff
      });
      alert('Commission recorded successfully!');
      setNewCommissionForm({
        tenant_id: '',
        invoice_reference: '',
        customer_name: '',
        sale_amount: '',
        commission_rate: 1.0,
        logged_by_staff: 'Manager'
      });
      const comms = await fetchAllCommissions();
      setAllCommissions(comms);
    } catch (err: any) {
      alert('Failed to record commission: ' + err.message);
    }
  };

  const handleUpdateCommissionStatus = async (
    commId: string, 
    status: 'Pending' | 'Paid' | 'Reversed'
  ) => {
    let reversalInfo;
    if (status === 'Reversed') {
      const reason = window.prompt('Enter reason for commission reversal:');
      if (!reason) return;
      reversalInfo = { reversed_by: 'Manager', reversal_reason: reason };
    }
    try {
      await updateCommissionStatus(commId, status, reversalInfo);
      const comms = await fetchAllCommissions();
      setAllCommissions(comms);
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleCopyLink = (code: string) => {
    const url = getTenantShareableLink(code);
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredTenants = tenants.filter(t => {
    const q = search.toLowerCase();
    return (
      t.tenant_name.toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* CONFIRMATION MODAL ("Is this who you want to buy from?") */}
      {pendingConfirmationTenant && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-emerald-500/40 rounded-3xl max-w-md w-full p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-5 shadow-lg">
              <Store className="w-8 h-8" />
            </div>
            
            <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Verified Resident Artisan
            </span>
            
            <h3 className="text-xl font-black text-white mt-3">
              Is this who you want to buy from?
            </h3>
            
            <div className="bg-neutral-800/80 border border-neutral-700 rounded-2xl p-4 my-5 text-left">
              <div className="text-lg font-black text-white">{pendingConfirmationTenant.tenant.tenant_name}</div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mt-0.5">
                {pendingConfirmationTenant.tenant.category || 'Resident Merchant'}
              </div>
              {pendingConfirmationTenant.tenant.description && (
                <p className="text-xs text-neutral-300 mt-2 line-clamp-2 leading-relaxed">
                  {pendingConfirmationTenant.tenant.description}
                </p>
              )}
            </div>

            <p className="text-xs text-neutral-400 mb-6">
              You will enter {pendingConfirmationTenant.tenant.tenant_name}'s personal space with direct pricing, orders, and workshop gallery.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleConfirmTenant(false)}
                className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-bold text-xs rounded-xl transition-colors"
              >
                No, Go Back
              </button>
              <button
                onClick={() => handleConfirmTenant(true)}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Yes, Enter Space
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR GALLERY */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            className="absolute top-6 right-6 p-3 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={lightboxImage} 
            alt="Gallery Fullscreen" 
            className="max-h-[88vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl border border-white/10"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900 border border-emerald-500/30 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          {(selectedTenant || onBack) && (
            <button 
              onClick={() => {
                if (selectedTenant) {
                  setSelectedTenant(null);
                  setIsTenantAuthenticated(false);
                } else if (onBack) {
                  onBack();
                }
              }}
              className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Mini-Storefronts
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">HubTenant</h2>
            </div>
            <p className="text-neutral-400 text-sm mt-0.5">
              {selectedTenant 
                ? `${selectedTenant.tenant_name}'s Personal Space · ${selectedTenant.category || 'Artisan'}`
                : "Independent youth businesses selling as tenants in Jotra's digital storefront."}
            </p>
          </div>
        </div>

        {/* Manager Mode Button & Refresh */}
        <div className="flex items-center gap-3">
          {isManagerMode ? (
            <>
              <button
                onClick={handleLockManagerHub}
                className="px-3.5 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                title="Lock Manager Hub"
              >
                <Lock className="w-3.5 h-3.5" /> Lock
              </button>
              <button
                onClick={() => setIsManagerMode(false)}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                ← Tenant View
              </button>
            </>
          ) : (
            /* Hide the Manager Hub button from tenants who are logged into their own space. Tenants must never see it. */
            !isTenantAuthenticated && (
              <button
                onClick={handleOpenManagerHubClick}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Manager Hub
              </button>
            )
          )}
          <button
            onClick={loadTenants}
            className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* "This space was not found" message when opened with invalid ?tenant=CODE */}
      {tenantNotFound && !selectedTenant && !isManagerMode && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md mx-auto text-center space-y-4 my-8 shadow-2xl animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-white">This space was not found</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            The resident storefront link you opened (<span className="text-amber-400 font-mono font-bold">{tenantNotFound}</span>) does not match any active tenant on Jotra Interiors.
          </p>
          <div className="pt-2 space-y-2.5">
            <button
              onClick={() => {
                if (onGoToShowroom) onGoToShowroom();
                else if (onBack) onBack();
              }}
              className="w-full py-3 px-4 bg-white hover:bg-neutral-100 text-neutral-950 font-black text-xs rounded-xl shadow-lg transition-all"
            >
              Go to Jotra Interiors Showroom →
            </button>
            <button
              onClick={() => setTenantNotFound(null)}
              className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs rounded-xl transition-colors"
            >
              Browse All Resident Tenants
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW A: TENANT LIST & ENTER-BY-ID (Customer Hub View) */}
      {/* ========================================================================= */}
      {!selectedTenant && !isManagerMode && !tenantNotFound && (
        <div className="space-y-6">
          {/* Top Bar: Search & Enter by ID box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search resident artisans, welding, electricals..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 shadow-md"
              />
            </div>

            {/* Enter by Code / ID Box */}
            <form onSubmit={handleEnterByCode} className="flex gap-2">
              <input 
                type="text"
                value={enterCode}
                onChange={e => {
                  setEnterCode(e.target.value.toUpperCase());
                  setEnterCodeError('');
                }}
                placeholder="Enter Code (e.g. SHEDRACK01)"
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 uppercase tracking-wider shadow-md"
              />
              <button 
                type="submit"
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl transition-all shadow-md shadow-emerald-600/20 whitespace-nowrap"
              >
                Enter
              </button>
            </form>
          </div>

          {enterCodeError && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-400 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {enterCodeError}
            </div>
          )}

          {/* Tenants Grid */}
          {loading ? (
            <div className="p-16 text-center text-neutral-400 font-bold">
              Loading resident storefronts...
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="p-16 text-center bg-neutral-900/40 border border-neutral-800 rounded-3xl">
              <Store className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-300 font-bold">No active tenants found.</p>
              <p className="text-neutral-500 text-sm mt-1">Check back soon as new resident artisans join.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTenants.map(tenant => {
                const photosCount = Array.isArray(tenant.photos) ? tenant.photos.filter(Boolean).length : 0;
                return (
                  <div
                    key={tenant.id}
                    onClick={() => setPendingConfirmationTenant({ tenant, source: 'discovery' })}
                    className="group bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 rounded-3xl p-6 transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-emerald-500/5 flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white text-xl font-black shadow-md border border-white/10">
                          {tenant.tenant_name.charAt(0)}
                        </div>
                        {tenant.referral_code && (
                          <span className="text-[11px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                            {tenant.referral_code}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors">
                        {tenant.tenant_name}
                      </h3>
                      {tenant.category && (
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mt-1">
                          {tenant.category}
                        </p>
                      )}
                      {tenant.description && (
                        <p className="text-sm text-neutral-400 mt-3 line-clamp-3 leading-relaxed">
                          {tenant.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-6 mt-4 border-t border-neutral-800/80 flex items-center justify-between">
                      <span className="text-xs text-neutral-400 font-bold group-hover:text-neutral-200 flex items-center gap-1.5 transition-colors">
                        Enter Mini-Storefront →
                      </span>
                      <span className="text-[11px] font-bold text-emerald-400/80 bg-emerald-950/40 px-2 py-0.5 rounded-md">
                        30 Gallery Slots
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: TENANT MINI-SPACE (Space Header, Tabs: Gallery, Products, Admin) */}
      {/* ========================================================================= */}
      {selectedTenant && !isManagerMode && (
        <div className="space-y-6">
          {/* GENTLE WAY INTO JOTRA INTERIORS SHOWROOM */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 border border-emerald-500/30 p-4 rounded-3xl shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  You are exploring {selectedTenant.tenant_name}&apos;s Storefront
                </div>
                <div className="text-[11px] text-neutral-400">
                  Ready to browse Jotra&apos;s full furnishings, doors, ceilings & gates?
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (onGoToShowroom) onGoToShowroom();
                else if (onBack) onBack();
              }}
              className="px-4 py-2.5 bg-white hover:bg-neutral-100 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              Visit Jotra Interiors Showroom →
            </button>
          </div>

          {/* Tenant Space Header Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white text-3xl font-black shadow-xl border border-white/10 flex-shrink-0">
                  {selectedTenant.tenant_name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Resident Mini-Storefront
                    </span>
                    <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300">
                      {selectedTenant.referral_code}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-white mt-1.5">{selectedTenant.tenant_name}</h2>
                  {selectedTenant.category && (
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{selectedTenant.category}</p>
                  )}
                  {selectedTenant.description && (
                    <p className="text-sm text-neutral-300 mt-2 max-w-2xl leading-relaxed">{selectedTenant.description}</p>
                  )}
                </div>
              </div>

              {/* Actions & Contact */}
              <div className="flex flex-wrap md:flex-col gap-2.5 justify-end">
                {selectedTenant.contact_info?.whatsapp && (
                  <a
                    href={`https://wa.me/${selectedTenant.contact_info.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                )}
                {selectedTenant.contact_info?.phone && (
                  <a
                    href={`tel:${selectedTenant.contact_info.phone}`}
                    className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl transition-all border border-neutral-700 flex items-center justify-center gap-2"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Tenant
                  </a>
                )}
                <button
                  onClick={() => {
                    setLinkModalTenant(selectedTenant);
                    setIsLinkCopied(false);
                  }}
                  className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl transition-all border border-neutral-700 flex items-center justify-center gap-2"
                >
                  <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                  Get Link
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-8 pt-6 border-t border-neutral-800">
              <button
                onClick={() => setActiveTab('gallery')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  activeTab === 'gallery'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" /> My Gallery (30 Slots)
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  activeTab === 'products'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" /> My Products ({tenantProducts.length})
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ml-auto ${
                  activeTab === 'admin'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                {isTenantAuthenticated ? 'Tenant Space Dashboard' : 'Tenant Private Access'}
              </button>
            </div>
          </div>

          {/* TAB 1: MY GALLERY (30 Slots) */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 px-6 py-4 rounded-2xl">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    Workshop & Showcase Gallery
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Tap any photo for full-screen view. {isTenantAuthenticated ? 'As the owner, you can replace any slot with your own work.' : 'Browse the visual showcase.'}
                  </p>
                </div>
                <div className="text-xs font-bold text-neutral-400">
                  <span className="text-emerald-400">30</span> Slots Total
                </div>
              </div>

              {/* 30 Slots Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {Array.from({ length: 30 }).map((_, slotIdx) => {
                  const uploadedUrl = selectedTenant.photos?.[slotIdx];
                  const imageUrl = uploadedUrl || PLACEHOLDER_IMAGES[slotIdx % PLACEHOLDER_IMAGES.length];
                  const isUploaded = Boolean(uploadedUrl);

                  return (
                    <div 
                      key={slotIdx}
                      className="group relative aspect-square bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-md hover:border-emerald-500/60 transition-all flex flex-col justify-between"
                    >
                      <img 
                        src={imageUrl} 
                        alt={`Slot ${slotIdx + 1}`}
                        onClick={() => setLightboxImage(imageUrl)}
                        className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Slot Number Badge */}
                      <span className="absolute top-2 left-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/70 text-white backdrop-blur-sm pointer-events-none">
                        #{slotIdx + 1}
                      </span>

                      {/* Custom Upload Tag */}
                      {isUploaded && (
                        <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-600/90 text-white shadow pointer-events-none">
                          Custom
                        </span>
                      )}

                      {/* Upload Button for Authenticated Tenant */}
                      {isTenantAuthenticated && (
                        <div className="absolute inset-x-2 bottom-2">
                          <label className="cursor-pointer w-full py-1.5 px-2 bg-black/80 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-xl transition-all backdrop-blur-sm flex items-center justify-center gap-1 shadow-lg border border-white/10">
                            <Upload className="w-3 h-3" />
                            {uploadingSlotIndex === slotIdx ? 'Uploading...' : 'Replace'}
                            <input 
                              type="file"
                              accept="image/*"
                              disabled={uploadingSlotIndex === slotIdx}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleSlotPhotoUpload(slotIdx, file);
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: MY PRODUCTS (Customer Ordering with decimal quantities, delivery & snapshots) */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 px-6 py-4 rounded-2xl">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    Available Products & Services
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Order directly with custom quantities, delivery to your site or workshop pickup
                  </p>
                </div>
                {isTenantAuthenticated && (
                  <button
                    onClick={() => {
                      setEditingProduct({
                        product_name: '',
                        price: null,
                        unit: 'piece',
                        description: '',
                        photo_url: '',
                        in_stock: true
                      });
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product
                  </button>
                )}
              </div>

              {tenantProducts.length === 0 ? (
                <div className="p-16 text-center bg-neutral-900/40 border border-neutral-800 rounded-3xl">
                  <PackageCheck className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-300 font-bold">No products currently listed.</p>
                  <p className="text-neutral-500 text-sm mt-1">
                    {isTenantAuthenticated 
                      ? 'Click "Add Product" above to list your first item.' 
                      : 'Please contact the tenant via WhatsApp or phone for custom quotes.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {tenantProducts.map(prod => {
                    const priceDisplay = prod.price 
                      ? `₦ ${Number(prod.price).toLocaleString()} per ${prod.unit}` 
                      : 'Price on request';

                    return (
                      <div
                        key={prod.id}
                        className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between"
                      >
                        <div>
                          {/* Product Image */}
                          <div className="aspect-square bg-neutral-800 rounded-2xl overflow-hidden mb-4 relative">
                            {prod.photo_url ? (
                              <img src={prod.photo_url} alt={prod.product_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 text-xs gap-2">
                                <ShoppingBag className="w-8 h-8 opacity-40" />
                                No product photo
                              </div>
                            )}
                            <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              prod.in_stock ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {prod.in_stock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>

                          <h4 className="text-base font-black text-white leading-snug">{prod.product_name}</h4>
                          <p className="text-sm font-black text-emerald-400 mt-1">{priceDisplay}</p>
                          {prod.description && (
                            <p className="text-xs text-neutral-400 mt-2 line-clamp-3 leading-relaxed">{prod.description}</p>
                          )}
                        </div>

                        <div className="pt-4 mt-4 border-t border-neutral-800 flex items-center justify-between gap-2">
                          {isTenantAuthenticated ? (
                            <div className="flex items-center gap-2 w-full justify-end">
                              <button
                                onClick={() => setEditingProduct(prod)}
                                className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod.id!, prod.product_name)}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setOrderingProduct(prod);
                                setOrderQuantity('1');
                                setOrderSuccess(false);
                              }}
                              disabled={!prod.in_stock}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              {prod.in_stock ? 'Order Now' : 'Currently Unavailable'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TENANT PRIVATE ACCESS & DASHBOARD */}
          {activeTab === 'admin' && (
            <div className="space-y-6">
              {!isTenantAuthenticated ? (
                /* 4-digit PIN Authentication Form with 5-attempt lockout */
                <div className="max-w-md mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-white">Tenant Private Access</h3>
                  <p className="text-xs text-neutral-400 mt-1 mb-6">
                    Enter your private 4-digit PIN to manage {selectedTenant.tenant_name}'s gallery, products, orders and earnings.
                  </p>

                  <form onSubmit={handleTenantLogin} className="space-y-4">
                    <div>
                      <input 
                        type="password"
                        maxLength={4}
                        value={pinInput}
                        onChange={e => {
                          setPinInput(e.target.value.replace(/[^0-9]/g, ''));
                          setPinError('');
                        }}
                        placeholder="••••"
                        disabled={Boolean(lockoutUntil && Date.now() < lockoutUntil)}
                        className="w-48 mx-auto bg-neutral-800 border border-neutral-700 rounded-2xl px-4 py-3 text-center text-2xl tracking-[0.6em] font-mono text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                      />
                    </div>

                    {pinError && (
                      <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {pinError}
                      </div>
                    )}

                    {lockoutUntil && Date.now() < lockoutUntil && (
                      <div className="text-xs text-amber-400 font-bold">
                        Lockout active: {remainingLockoutSecs} seconds remaining
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={Boolean(lockoutUntil && Date.now() < lockoutUntil)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
                    >
                      Unlock Tenant Space
                    </button>
                  </form>
                </div>
              ) : (
                /* Authenticated Tenant Dashboard */
                <div className="space-y-8">
                  <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 px-6 py-4 rounded-2xl flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white">Logged in as {selectedTenant.tenant_name}</div>
                        <div className="text-xs text-neutral-400">You can edit your gallery, products, and view private orders & earnings.</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setLinkModalTenant(selectedTenant);
                          setIsLinkCopied(false);
                        }}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        Get Link
                      </button>
                      <button
                        onClick={handleTenantLogout}
                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-bold text-xs rounded-xl transition-colors"
                      >
                        Lock / Logout
                      </button>
                    </div>
                  </div>

                  {/* Section A: Customer Orders for this Tenant */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-black text-white flex items-center gap-2">
                          <PackageCheck className="w-5 h-5 text-emerald-400" />
                          My Orders ({tenantOrders.length})
                        </h4>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Direct customer orders placed for your products with snapshot details
                        </p>
                      </div>
                    </div>

                    {tenantOrders.length === 0 ? (
                      <p className="text-xs text-neutral-500 py-6 text-center">No orders placed yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-neutral-800/60 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                            <tr>
                              <th className="p-3">Date</th>
                              <th className="p-3">Product</th>
                              <th className="p-3">Quantity</th>
                              <th className="p-3">Total</th>
                              <th className="p-3">Customer</th>
                              <th className="p-3">Delivery</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Update</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-800">
                            {tenantOrders.map(order => (
                              <tr key={order.id} className="hover:bg-neutral-800/30">
                                <td className="p-3 text-neutral-400">
                                  {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                                </td>
                                <td className="p-3 font-bold text-white">{order.product_name_snapshot}</td>
                                <td className="p-3 font-mono font-bold text-emerald-400">
                                  {order.quantity} {order.unit_snapshot}
                                </td>
                                <td className="p-3 font-bold text-white">
                                  {order.total_amount ? `₦ ${Number(order.total_amount).toLocaleString()}` : 'Custom'}
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-white">{order.customer_name}</div>
                                  <div className="text-[11px] text-neutral-400">{order.customer_phone}</div>
                                </td>
                                <td className="p-3">
                                  {order.delivery_requested ? (
                                    <span className="text-amber-400 flex items-center gap-1" title={order.delivery_address || ''}>
                                      <Truck className="w-3.5 h-3.5" /> Address specified
                                    </span>
                                  ) : (
                                    <span className="text-neutral-500">Pickup</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    order.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                    order.status === 'Cancelled' ? 'bg-red-500/20 text-red-400' :
                                    'bg-amber-500/20 text-amber-400'
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <select
                                    value={order.status}
                                    onChange={async (e) => {
                                      await updateTenantOrderStatus(order.id!, e.target.value as any);
                                      await loadAuthenticatedTenantData(selectedTenant.id);
                                    }}
                                    className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-2 py-1 text-[11px] focus:outline-none"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Section B: My Earnings & Commissions */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-black text-white flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-emerald-400" />
                          My Earnings & Commission Log
                        </h4>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Referral commissions tracked from invoice sales across Jotra staff
                        </p>
                      </div>
                    </div>

                    {tenantCommissions.length === 0 ? (
                      <p className="text-xs text-neutral-500 py-6 text-center">No commission records yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-neutral-800/60 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                            <tr>
                              <th className="p-3">Date</th>
                              <th className="p-3">Invoice Ref</th>
                              <th className="p-3">Customer</th>
                              <th className="p-3">Sale Amount</th>
                              <th className="p-3">Rate</th>
                              <th className="p-3">Commission Earned</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Logged By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-800">
                            {tenantCommissions.map(comm => (
                              <tr key={comm.id} className="hover:bg-neutral-800/30">
                                <td className="p-3 text-neutral-400">
                                  {comm.created_at ? new Date(comm.created_at).toLocaleDateString() : '—'}
                                </td>
                                <td className="p-3 font-mono font-bold text-white">{comm.invoice_reference}</td>
                                <td className="p-3 text-neutral-300">{comm.customer_name}</td>
                                <td className="p-3 text-white font-mono">₦ {Number(comm.sale_amount).toLocaleString()}</td>
                                <td className="p-3 text-emerald-400 font-bold">{comm.commission_rate_applied}%</td>
                                <td className="p-3 font-bold font-mono text-emerald-400">
                                  ₦ {Number(comm.commission_amount).toLocaleString()}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    comm.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' :
                                    comm.status === 'Reversed' ? 'bg-red-500/20 text-red-400' :
                                    'bg-amber-500/20 text-amber-400'
                                  }`}>
                                    {comm.status}
                                  </span>
                                </td>
                                <td className="p-3 text-neutral-400">{comm.logged_by_staff}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CUSTOMER ORDERING MODAL */}
      {/* ========================================================================= */}
      {orderingProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative text-left">
            <button 
              onClick={() => setOrderingProduct(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-sm font-bold"
            >
              ✕
            </button>

            {orderSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white">Order Placed Successfully!</h3>
                <p className="text-xs text-neutral-400 mt-2">
                  Your order snapshot has been sent to {selectedTenant?.tenant_name}. They will contact you shortly to confirm fulfillment.
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                  Order Product
                </h3>
                <p className="text-xs text-neutral-400 mb-5">
                  Ordering from: <span className="text-white font-bold">{selectedTenant?.tenant_name}</span>
                </p>

                <div className="bg-neutral-800/80 rounded-2xl p-4 mb-5 border border-neutral-700">
                  <div className="text-sm font-black text-white">{orderingProduct.product_name}</div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">
                    {orderingProduct.price 
                      ? `₦ ${Number(orderingProduct.price).toLocaleString()} per ${orderingProduct.unit}` 
                      : 'Price on request'}
                  </div>
                </div>

                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  {/* Quantity with decimal support */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">
                      Quantity ({orderingProduct.unit}) *
                    </label>
                    <input 
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      value={orderQuantity}
                      onChange={e => setOrderQuantity(e.target.value)}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  {/* Live Total Display */}
                  {orderingProduct.price && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-between">
                      <span className="text-xs text-neutral-400 font-bold uppercase">Estimated Total:</span>
                      <span className="text-base font-black text-emerald-400 font-mono">
                        ₦ {Number(calculatedOrderTotal() || 0).toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Your Full Name *</label>
                    <input 
                      type="text"
                      required
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="e.g. Samuel Ade"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Phone Number (Calls/WhatsApp) *</label>
                    <input 
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="+234..."
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Delivery Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-300">
                      <input 
                        type="checkbox"
                        checked={deliveryRequested}
                        onChange={e => setDeliveryRequested(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                      />
                      Request Site Delivery
                    </label>

                    {deliveryRequested && (
                      <textarea 
                        rows={2}
                        value={deliveryAddress}
                        onChange={e => setDeliveryAddress(e.target.value)}
                        placeholder="Enter full site delivery address..."
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white mt-2 focus:outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setOrderingProduct(null)}
                      className="px-4 py-2.5 text-neutral-400 hover:text-white text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={orderSubmitting}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20"
                    >
                      {orderSubmitting ? 'Placing Order...' : 'Confirm Order'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TENANT ADD/EDIT PRODUCT MODAL */}
      {/* ========================================================================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative text-left">
            <button 
              onClick={() => setEditingProduct(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-sm font-bold"
            >
              ✕
            </button>

            <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              {editingProduct.id ? 'Edit Product' : 'Add New Product'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Product / Item Name *</label>
                <input 
                  type="text"
                  required
                  value={editingProduct.product_name || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, product_name: e.target.value })}
                  placeholder="e.g. 100A Electrical Distribution Box"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Price (₦) [Optional]</label>
                  <input 
                    type="number"
                    value={editingProduct.price ?? ''}
                    onChange={e => setEditingProduct({ 
                      ...editingProduct, 
                      price: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                    placeholder="Leave blank for request"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Unit *</label>
                  <select
                    value={editingProduct.unit || 'piece'}
                    onChange={e => setEditingProduct({ ...editingProduct, unit: e.target.value as any })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="piece">piece</option>
                    <option value="metre">metre</option>
                    <option value="roll">roll</option>
                    <option value="sheet">sheet</option>
                    <option value="pack">pack</option>
                    <option value="kg">kg</option>
                    <option value="litre">litre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Description</label>
                <textarea 
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Specs, thickness, material or ratings..."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Photo Upload to jotra-tenant-photos */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Product Photo</label>
                <div className="flex items-center gap-3">
                  {editingProduct.photo_url ? (
                    <img src={editingProduct.photo_url} alt="Product" className="w-14 h-14 rounded-xl object-cover border border-neutral-700" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-neutral-800 border border-dashed border-neutral-700 flex items-center justify-center text-[10px] text-neutral-500">
                      No Photo
                    </div>
                  )}
                  <label className="cursor-pointer px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition-colors border border-neutral-700 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    {isUploadingPhoto ? 'Uploading...' : 'Upload'}
                    <input 
                      type="file"
                      accept="image/*"
                      disabled={isUploadingPhoto}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploadingPhoto(true);
                        try {
                          const url = await uploadTenantPhoto(file);
                          setEditingProduct({ ...editingProduct, photo_url: url });
                        } catch (err: any) {
                          alert('Photo upload failed: ' + err.message);
                        } finally {
                          setIsUploadingPhoto(false);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-300">
                  <input 
                    type="checkbox"
                    checked={editingProduct.in_stock ?? true}
                    onChange={e => setEditingProduct({ ...editingProduct, in_stock: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                  />
                  Item in stock
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-neutral-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW C: MANAGER HUB (Tenant Management, PIN Resets, Commissions, Master Notifications) */}
      {/* ========================================================================= */}
      {isManagerMode && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-6 rounded-3xl">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Manager Hub · Resident Tenants & Commissions
              </h3>
              <p className="text-neutral-400 text-xs mt-1">
                Add tenants, reset PINs, track referral vs discovery traffic, record commissions and notify Master
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setManagerTab('tenants')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  managerTab === 'tenants' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                Tenants ({managerTenants.length})
              </button>
              <button
                onClick={() => setManagerTab('commissions')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  managerTab === 'commissions' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                Commissions ({allCommissions.length})
              </button>
              <button
                onClick={() => setManagerTab('notifications')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  managerTab === 'notifications' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                Master Notifs ({notifications.length})
              </button>
              <button
                onClick={() => setManagerTab('master_settings')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  managerTab === 'master_settings' ? 'bg-amber-600 text-white shadow-md' : 'bg-neutral-800 text-amber-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" /> Master Settings
              </button>
            </div>
          </div>

          {/* MANAGER TAB 1: TENANTS LIST */}
          {managerTab === 'tenants' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setEditingTenant({
                      tenant_name: '',
                      category: '',
                      description: '',
                      contact_info: { phone: '', whatsapp: '', email: '' },
                      referral_code: '',
                      commission_rate: 1.0,
                      status: 'active'
                    });
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add New Tenant
                </button>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-800/60 text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                      <tr>
                        <th className="p-4">Tenant</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Referral Code</th>
                        <th className="p-4">Traffic (Ref / Disc)</th>
                        <th className="p-4">Commission %</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {managerTenants.map(t => (
                        <tr key={t.id} className="hover:bg-neutral-800/40 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 font-black flex items-center justify-center text-sm border border-emerald-500/30">
                                {t.tenant_name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-white">{t.tenant_name}</div>
                                {t.contact_info?.phone && (
                                  <div className="text-xs text-neutral-400">{t.contact_info.phone}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-neutral-300 text-xs">{t.category || '—'}</td>
                          <td className="p-4 font-mono font-bold text-xs text-emerald-400">{t.referral_code}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-xs font-mono">
                              {t.referral_traffic || 0} ref / {t.discovery_traffic || 0} disc
                            </span>
                          </td>
                          <td className="p-4 font-bold text-xs text-emerald-400">{t.commission_rate ?? 1.0}%</td>
                          <td className="p-4">
                            <button
                              onClick={async () => {
                                const next = t.status === 'active' ? 'inactive' : 'active';
                                await saveTenant({ ...t, status: next });
                                const updated = await fetchAllTenants();
                                setManagerTenants(updated);
                              }}
                              className={`px-3 py-1 rounded-full text-xs font-black transition-colors ${
                                t.status === 'active'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                              }`}
                            >
                              {t.status === 'active' ? '● Active' : '○ Inactive'}
                            </button>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setLinkModalTenant(t);
                                  setIsLinkCopied(false);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-colors flex items-center gap-1"
                                title="Get Shareable Link"
                              >
                                <Link2 className="w-3.5 h-3.5" />
                                Get Link
                              </button>
                              <button
                                onClick={() => {
                                  setResetPinTenant(t);
                                  setNewPinValue('');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold text-xs transition-colors"
                                title="Reset 4-Digit PIN"
                              >
                                Reset PIN
                              </button>
                              <button
                                onClick={() => setEditingTenant(t)}
                                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                                title="Edit Tenant"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (!window.confirm(`Delete tenant ${t.tenant_name}?`)) return;
                                  await deleteTenant(t.id);
                                  const updated = await fetchAllTenants();
                                  setManagerTenants(updated);
                                }}
                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                title="Delete Tenant"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MANAGER TAB 2: COMMISSIONS & RECORDING */}
          {managerTab === 'commissions' && (
            <div className="space-y-6">
              {/* Record Commission Form */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
                <h4 className="text-base font-black text-white mb-1 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Log Staff Sale Commission for Tenant
                </h4>
                <p className="text-xs text-neutral-400 mb-4">
                  Enter the tenant referral code or select tenant from dropdown, invoice reference, and sale amount.
                </p>

                <form onSubmit={handleRecordCommissionSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Select Tenant *</label>
                    <select
                      required
                      value={newCommissionForm.tenant_id}
                      onChange={e => {
                        const sel = managerTenants.find(t => t.id === e.target.value);
                        setNewCommissionForm({
                          ...newCommissionForm,
                          tenant_id: e.target.value,
                          commission_rate: sel?.commission_rate ?? 1.0
                        });
                      }}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                    >
                      <option value="">-- Choose Tenant --</option>
                      {managerTenants.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.tenant_name} ({t.referral_code}) - {t.commission_rate ?? 1.0}%
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Invoice Reference *</label>
                    <input 
                      type="text"
                      required
                      value={newCommissionForm.invoice_reference}
                      onChange={e => setNewCommissionForm({ ...newCommissionForm, invoice_reference: e.target.value })}
                      placeholder="e.g. INV-2026-904"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Customer Name</label>
                    <input 
                      type="text"
                      value={newCommissionForm.customer_name}
                      onChange={e => setNewCommissionForm({ ...newCommissionForm, customer_name: e.target.value })}
                      placeholder="e.g. Chief Okafor"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Sale Amount (₦) *</label>
                    <input 
                      type="number"
                      required
                      value={newCommissionForm.sale_amount}
                      onChange={e => setNewCommissionForm({ ...newCommissionForm, sale_amount: e.target.value })}
                      placeholder="e.g. 500000"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Commission Rate %</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={newCommissionForm.commission_rate}
                      onChange={e => setNewCommissionForm({ ...newCommissionForm, commission_rate: parseFloat(e.target.value) || 1.0 })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all"
                    >
                      Record Commission
                    </button>
                  </div>
                </form>
              </div>

              {/* Commissions List */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-800/60 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                      <tr>
                        <th className="p-3">Tenant</th>
                        <th className="p-3">Invoice Ref</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Sale (₦)</th>
                        <th className="p-3">Commission (₦)</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Logged By</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {allCommissions.map(comm => (
                        <tr key={comm.id} className="hover:bg-neutral-800/30">
                          <td className="p-3 font-bold text-white">{comm.tenant_name || 'Tenant'}</td>
                          <td className="p-3 font-mono font-bold text-emerald-400">{comm.invoice_reference}</td>
                          <td className="p-3 text-neutral-300">{comm.customer_name}</td>
                          <td className="p-3 font-mono text-white">₦ {Number(comm.sale_amount).toLocaleString()}</td>
                          <td className="p-3 font-mono font-bold text-emerald-400">
                            ₦ {Number(comm.commission_amount).toLocaleString()} ({comm.commission_rate_applied}%)
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              comm.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' :
                              comm.status === 'Reversed' ? 'bg-red-500/20 text-red-400' :
                              'bg-amber-500/20 text-amber-400'
                            }`}>
                              {comm.status}
                            </span>
                          </td>
                          <td className="p-3 text-neutral-400">{comm.logged_by_staff}</td>
                          <td className="p-3 text-right">
                            {comm.status === 'Pending' && (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleUpdateCommissionStatus(comm.id!, 'Paid')}
                                  className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg text-[10px] font-bold"
                                >
                                  Mark Paid
                                </button>
                                <button
                                  onClick={() => handleUpdateCommissionStatus(comm.id!, 'Reversed')}
                                  className="px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg text-[10px] font-bold"
                                >
                                  Reverse
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MANAGER TAB 3: MASTER NOTIFICATIONS */}
          {managerTab === 'notifications' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h4 className="text-base font-black text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Master Tenant Notifications
              </h4>
              <p className="text-xs text-neutral-400">
                Logged automatically when tenants are created or referral codes are assigned.
              </p>

              {notifications.length === 0 ? (
                <p className="text-xs text-neutral-500 py-6 text-center">No notifications yet.</p>
              ) : (
                <div className="divide-y divide-neutral-800">
                  {notifications.map(n => (
                    <div key={n.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-white">{n.event}</div>
                        <div className="text-[10px] text-neutral-400">
                          By: {n.by_role} · {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                        </div>
                      </div>
                      {!n.seen && (
                        <button
                          onClick={async () => {
                            await markNotificationSeen(n.id!);
                            const updated = await fetchMasterNotifications();
                            setNotifications(updated);
                          }}
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-bold rounded-lg"
                        >
                          Mark Seen
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MANAGER TAB 4: MASTER SETTINGS & MANAGER PIN */}
          {managerTab === 'master_settings' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Master Administration
                  </span>
                  <h4 className="text-xl font-black text-white mt-1">Manager Hub PIN & Access Security</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Configure and change the Manager PIN. The PIN is stored hashed with SHA-256 and never in plain text.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-neutral-800/60 border border-neutral-700/60 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Manager PIN Protection</div>
                    <div className="text-base font-black text-emerald-400 flex items-center gap-1.5 mt-1">
                      <ShieldCheck className="w-5 h-5" /> Active & Protected
                    </div>
                    <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                      Entering Manager Hub requires this private PIN. 5 consecutive incorrect attempts will automatically lock the hub for 5 minutes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMasterPinError('');
                      setMasterPinSuccess('');
                      setMasterPinInput('');
                      setNewManagerPinInput('');
                      setConfirmNewManagerPinInput('');
                      setShowMasterChangePinModal(true);
                    }}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" /> Change Manager PIN
                  </button>
                </div>

                <div className="bg-neutral-800/60 border border-neutral-700/60 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Lock Manager Hub</div>
                    <div className="text-base font-black text-white flex items-center gap-1.5 mt-1">
                      <Lock className="w-5 h-5 text-amber-400" /> Session Security
                    </div>
                    <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                      This session will be terminated upon page refresh or closing. You can also explicitly lock the Manager Hub right now.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLockManagerHub}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" /> Lock Manager Hub Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESET PIN MODAL (Manager resets PIN; never shows or stores plain PIN) */}
      {resetPinTenant && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl">
            <h3 className="text-lg font-black text-white">Reset 4-Digit PIN</h3>
            <p className="text-xs text-neutral-400 mt-1 mb-5">
              Set new PIN for <span className="text-white font-bold">{resetPinTenant.tenant_name}</span>. The PIN will be hashed and cannot be read back.
            </p>

            <form onSubmit={handleResetPinSubmit} className="space-y-4">
              <input 
                type="password"
                maxLength={4}
                required
                value={newPinValue}
                onChange={e => setNewPinValue(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="4 digits"
                className="w-36 mx-auto bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-center text-xl tracking-[0.5em] font-mono text-white focus:outline-none focus:border-emerald-500"
              />

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPinTenant(null)}
                  className="py-2.5 bg-neutral-800 text-neutral-400 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT TENANT MODAL */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative text-left max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setEditingTenant(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-sm font-bold"
            >
              ✕
            </button>

            <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-400" />
              {editingTenant.id ? 'Edit Tenant' : 'Add New Resident Tenant'}
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              Assigned referral code can be typed in or auto-generated.
            </p>

            <form onSubmit={handleSaveTenantManager} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Tenant Name *</label>
                <input 
                  type="text"
                  required
                  value={editingTenant.tenant_name || ''}
                  onChange={e => setEditingTenant({ ...editingTenant, tenant_name: e.target.value })}
                  placeholder="e.g. Shedrack"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Category / Trade</label>
                <input 
                  type="text"
                  value={editingTenant.category || ''}
                  onChange={e => setEditingTenant({ ...editingTenant, category: e.target.value })}
                  placeholder="e.g. Welding & Electricals"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Bio / Description</label>
                <textarea 
                  rows={3}
                  value={editingTenant.description || ''}
                  onChange={e => setEditingTenant({ ...editingTenant, description: e.target.value })}
                  placeholder="Shedrack does welding and electrical work and sells boxes and electrical items."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Phone</label>
                  <input 
                    type="text"
                    value={editingTenant.contact_info?.phone || ''}
                    onChange={e => setEditingTenant({ 
                      ...editingTenant, 
                      contact_info: { ...(editingTenant.contact_info || {}), phone: e.target.value } 
                    })}
                    placeholder="+234..."
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">WhatsApp</label>
                  <input 
                    type="text"
                    value={editingTenant.contact_info?.whatsapp || ''}
                    onChange={e => setEditingTenant({ 
                      ...editingTenant, 
                      contact_info: { ...(editingTenant.contact_info || {}), whatsapp: e.target.value } 
                    })}
                    placeholder="+234..."
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Referral Code</label>
                  <input 
                    type="text"
                    value={editingTenant.referral_code || ''}
                    onChange={e => setEditingTenant({ ...editingTenant, referral_code: e.target.value.toUpperCase() })}
                    placeholder="SHEDRACK01 (or auto)"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Commission Rate %</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={editingTenant.commission_rate ?? 1.0}
                    onChange={e => setEditingTenant({ ...editingTenant, commission_rate: parseFloat(e.target.value) || 1.0 })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Status</label>
                <select
                  value={editingTenant.status || 'active'}
                  onChange={e => setEditingTenant({ ...editingTenant, status: e.target.value as any })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="active">Active (Visible in HubTenant)</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2.5 text-neutral-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  Save Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GET LINK PANEL / MODAL FOR TENANT */}
      {linkModalTenant && (
        <div 
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => {
            setLinkModalTenant(null);
            setIsLinkCopied(false);
          }}
        >
          <div 
            className="bg-neutral-900 border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-left text-white animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => {
                setLinkModalTenant(null);
                setIsLinkCopied(false);
              }}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 flex items-center justify-center text-sm font-bold transition-colors"
              title="Close"
            >
              ✕
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Link2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  Direct Tenant Storefront Link
                </span>
                <h3 className="text-xl font-black text-white mt-1 leading-tight">{linkModalTenant.tenant_name}</h3>
              </div>
            </div>

            <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
              Customers opening this link will see the <strong className="text-white">&ldquo;Is this who you want to buy from?&rdquo;</strong> confirmation before entering {linkModalTenant.tenant_name}&apos;s space.
            </p>

            {/* Readable box: light text on dark panel, dark text on white box */}
            <div className="mb-5">
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                Shareable Link
              </label>
              <div className="bg-white text-neutral-900 font-mono text-xs sm:text-sm px-4 py-3 rounded-xl break-all select-all border border-neutral-300 font-bold shadow-inner leading-relaxed">
                {getTenantShareableLink(linkModalTenant.referral_code)}
              </div>
            </div>

            {/* Action buttons: Copy link & Share on WhatsApp */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const url = getTenantShareableLink(linkModalTenant.referral_code);
                  navigator.clipboard.writeText(url);
                  setIsLinkCopied(true);
                  setTimeout(() => setIsLinkCopied(false), 2500);
                }}
                className={`py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md ${
                  isLinkCopied 
                    ? 'bg-emerald-500 text-white shadow-emerald-500/25 ring-2 ring-emerald-400' 
                    : 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 hover:border-neutral-600'
                }`}
              >
                {isLinkCopied ? (
                  <>
                    <Check className="w-4 h-4 text-white" /> Copied ✓
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-neutral-300" /> Copy link
                  </>
                )}
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Hello, here is your space on Jotra Interiors: ${getTenantShareableLink(linkModalTenant.referral_code)}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 text-center"
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" /> Share on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MANAGER HUB PIN ENTRY MODAL */}
      {showManagerPinModal && (
        <div 
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowManagerPinModal(false)}
        >
          <div 
            className="bg-neutral-900 border border-emerald-500/40 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowManagerPinModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-sm font-bold transition-colors"
              title="Close"
            >
              ✕
            </button>

            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-white">Manager Hub</h3>
            <p className="text-xs text-neutral-400 mt-1 mb-5">
              Enter your private Manager PIN to unlock management controls, commissions and tenant settings.
            </p>

            {checkingManagerPin ? (
              <div className="py-8 text-neutral-400 text-xs font-bold animate-pulse">
                Verifying security configuration...
              </div>
            ) : storedManagerPinHash === null ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-2xl text-xs font-bold leading-relaxed">
                  Master must set the Manager PIN first.
                </div>
                <p className="text-[11px] text-neutral-400">
                  No Manager PIN has been configured yet. The Master Administrator must configure the initial PIN.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowManagerPinModal(false);
                    setMasterPinError('');
                    setMasterPinSuccess('');
                    setMasterPinInput('');
                    setNewManagerPinInput('');
                    setConfirmNewManagerPinInput('');
                    setShowMasterChangePinModal(true);
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" /> Master: Set Manager PIN
                </button>
              </div>
            ) : (
              <form onSubmit={handleManagerPinSubmit} className="space-y-4">
                {managerLockoutUntil && Date.now() < managerLockoutUntil ? (
                  <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl text-xs font-bold">
                    Manager Hub locked for safety ({managerRemainingLockoutSecs}s remaining).
                  </div>
                ) : (
                  <>
                    <input 
                      type="password"
                      maxLength={10}
                      autoFocus
                      required
                      value={managerPinInput}
                      onChange={e => {
                        setManagerPinInput(e.target.value);
                        setManagerPinError('');
                      }}
                      placeholder="••••"
                      className="w-40 mx-auto bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.4em] font-mono text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                    />

                    {managerPinError && (
                      <div className="p-2.5 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold">
                        {managerPinError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-4 h-4" /> Unlock Manager Hub
                    </button>
                  </>
                )}

                <div className="pt-2 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowManagerPinModal(false);
                      setMasterPinError('');
                      setMasterPinSuccess('');
                      setMasterPinInput('');
                      setNewManagerPinInput('');
                      setConfirmNewManagerPinInput('');
                      setShowMasterChangePinModal(true);
                    }}
                    className="text-[11px] font-bold text-neutral-400 hover:text-amber-400 transition-colors flex items-center justify-center gap-1 mx-auto"
                  >
                    <KeyRound className="w-3 h-3" /> Master: Change Manager PIN
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MASTER SET / CHANGE MANAGER PIN MODAL */}
      {showMasterChangePinModal && (
        <div 
          className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowMasterChangePinModal(false)}
        >
          <div 
            className="bg-neutral-900 border border-amber-500/40 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowMasterChangePinModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-sm font-bold transition-colors"
              title="Close"
            >
              ✕
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <KeyRound className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-white">Master PIN Control</h3>
            <p className="text-xs text-neutral-400 mt-1 mb-5">
              Set or update the Manager PIN. The PIN is stored hashed (SHA-256) and cannot be viewed in plain text.
            </p>

            <form onSubmit={handleMasterChangePinSubmit} className="space-y-3.5 text-left">
              {!isStaffLoggedIn && (
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Master PIN *
                  </label>
                  <input 
                    type="password"
                    maxLength={10}
                    required
                    value={masterPinInput}
                    onChange={e => setMasterPinInput(e.target.value)}
                    placeholder="Enter Master PIN"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono tracking-widest"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  New Manager PIN (min 4 digits) *
                </label>
                <input 
                  type="password"
                  maxLength={10}
                  required
                  value={newManagerPinInput}
                  onChange={e => setNewManagerPinInput(e.target.value)}
                  placeholder="e.g. 5829"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono tracking-widest"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  Confirm New Manager PIN *
                </label>
                <input 
                  type="password"
                  maxLength={10}
                  required
                  value={confirmNewManagerPinInput}
                  onChange={e => setConfirmNewManagerPinInput(e.target.value)}
                  placeholder="Confirm PIN"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono tracking-widest"
                />
              </div>

              {masterPinError && (
                <div className="p-2.5 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold text-center">
                  {masterPinError}
                </div>
              )}

              {masterPinSuccess && (
                <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold text-center">
                  {masterPinSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMasterChangePinModal(false)}
                  className="py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingManagerPin}
                  className="py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {isSavingManagerPin ? 'Saving...' : 'Save PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
