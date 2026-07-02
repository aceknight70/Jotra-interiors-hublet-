export type TicketStatus = 'pending' | 'in-progress' | 'resolved' | 'replaced' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface RepairTicket {
  id: string;
  productName: string;
  category: string;
  issue: string;
  customerName: string;
  customerPhone: string;
  complaintDate: string;
  status: TicketStatus;
  assignedTo: string;
  priority: TicketPriority;
  images: string[];
  resolutionNotes: string;
  resolutionDate: string | null;
  createdAt: string;
  stockId?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  pin?: string;
  status: 'active' | 'inactive';
}

export interface GalleryPhoto {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  uploadDate: number;
  uploadedBy: string;
  status: 'active' | 'archived' | 'draft';
}

export interface Product {
  id: string;
  name: string;
  category: string;
  spec: string;
  price: string;
  description: string;
  availability: string;
  imageUrl: string;
  quantity?: number;
  warehouse?: string;
  staffNotes?: string;
  roomScene?: string;
  isAccessory?: boolean;
  createdAt: any;
  lastUpdated?: any;
}

