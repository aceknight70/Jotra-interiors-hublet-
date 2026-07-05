import { RepairTicket, StaffMember } from './types';

const DEMO_TICKETS: RepairTicket[] = [
  { id: 'R-001', productName: 'Ultra Tornado Steel Door', category: 'doors', issue: 'Lock misalignment and rust on hinges.', customerName: 'Mr. Okonkwo', customerPhone: '0801112222', complaintDate: '2025-07-01', status: 'pending', assignedTo: '', priority: 'urgent', images: [], resolutionNotes: '', resolutionDate: null, createdAt: '2025-07-01T08:00:00Z', stockId: 'UT-2025-001' },
  { id: 'R-002', productName: '3D PVC Ceiling Panel', category: 'ceilings', issue: 'Warping and discoloration after installation.', customerName: 'Mrs. Obi', customerPhone: '0803334444', complaintDate: '2025-06-28', status: 'in-progress', assignedTo: 'Chioma Okafor', priority: 'medium', images: [], resolutionNotes: '', resolutionDate: null, createdAt: '2025-06-28T10:30:00Z' },
  { id: 'R-003', productName: 'Turkish 3-Seater Sofa', category: 'furniture', issue: 'Fabric tear on the left armrest.', customerName: 'Mr. Adeyemi', customerPhone: '0805556666', complaintDate: '2025-06-25', status: 'resolved', assignedTo: 'Emeka Nwosu', priority: 'low', images: [], resolutionNotes: 'Replaced the armrest fabric. Customer satisfied.', resolutionDate: '2025-07-01', createdAt: '2025-06-25T14:15:00Z' }
];

const DEMO_STAFF: StaffMember[] = [
  { id: 'S-001', name: 'Chioma Okafor', role: 'Technician', email: 'chioma@jotra.com', pin: '1234', status: 'active' },
  { id: 'S-002', name: 'Emeka Nwosu', role: 'Senior Repair Specialist', email: 'emeka@jotra.com', pin: '1234', status: 'active' },
  { id: 'S-003', name: 'Amina Bello', role: 'Customer Service', email: 'amina@jotra.com', pin: '1234', status: 'active' },
  { id: 'S-004', name: 'Admin', role: 'Administrator', email: 'admin@jotra.com', pin: '0000', status: 'active' },
];

export const initStore = () => {
  if (!localStorage.getItem('jt_repairs')) {
    localStorage.setItem('jt_repairs', JSON.stringify(DEMO_TICKETS));
  }
  if (!localStorage.getItem('jt_staff')) {
    localStorage.setItem('jt_staff', JSON.stringify(DEMO_STAFF));
  }
};

export const getTickets = (): RepairTicket[] => JSON.parse(localStorage.getItem('jt_repairs') || '[]');
export const saveTickets = (tickets: RepairTicket[]) => localStorage.setItem('jt_repairs', JSON.stringify(tickets));

export const getStaff = (): StaffMember[] => {
  const staff = JSON.parse(localStorage.getItem('jt_staff') || '[]');
  return staff.map((s: any) => ({
    ...s,
    pin: s.pin || (s.email === 'admin@jotra.com' ? '0000' : '1234')
  }));
};
export const saveStaff = (staff: StaffMember[]) => localStorage.setItem('jt_staff', JSON.stringify(staff));
