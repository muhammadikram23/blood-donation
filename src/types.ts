export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type UrgencyLevel = 'Critical' | 'Urgent' | 'Normal';

export type RequestStatus = 'Open' | 'Donor Confirmed' | 'Fulfilled' | 'Closed';

export type DonationStatus = 'pending' | 'accepted' | 'declined';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bloodGroup: BloodGroup;
  address: string;
  city?: string;
  latitude: number;
  longitude: number;
  isAvailableDonor: boolean;
  profileImage?: string;
  createdAt: string;
  lastDonationDate?: string;
}

export interface BloodRequest {
  id: string;
  userId: string;
  requesterName: string;
  patientName: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  hospital: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  urgency: UrgencyLevel;
  description?: string;
  requiredBefore: string;
  emergencyContact: string;
  status: RequestStatus;
  acceptedDonorId?: string;
  acceptedDonorName?: string;
  acceptedDonorPhone?: string;
  createdAt: string;
  interestedCount?: number;
}

export interface InterestedDonation {
  id: string;
  requestId: string;
  donorId: string;
  donorName: string;
  donorBloodGroup: BloodGroup;
  donorPhone: string;
  donorAddress?: string;
  donorLatitude?: number;
  donorLongitude?: number;
  status: DonationStatus;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'interest_received' | 'interest_accepted' | 'interest_declined' | 'nearby_request' | 'status_change';
  requestId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  recipientBloodGroup: BloodGroup;
  donorId: string;
  distanceKm: number;
  requestId: string;
  patientName: string;
  hospital: string;
  bloodGroupNeeded: BloodGroup;
  urgency: UrgencyLevel;
  subject: string;
  body: string;
  sentAt: string;
  status: 'Sent';
}

export interface EmailNotificationResult {
  notifiedCount: number;
  logs: EmailLog[];
}

export interface FilterState {
  searchQuery: string;
  bloodGroupFilter: BloodGroup | 'ALL';
  compatibleOnly: boolean;
  maxDistanceKm: number; // 0 means any
  urgencyFilter: UrgencyLevel | 'ALL';
  statusFilter: RequestStatus | 'ALL';
}
