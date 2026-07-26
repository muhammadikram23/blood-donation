import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HomeFeed } from './components/HomeFeed';
import { DonorSearch } from './components/DonorSearch';
import { UserProfileView } from './components/UserProfileModal';
import { CreateRequestModal } from './components/CreateRequestModal';
import { RequestDetailModal } from './components/RequestDetailModal';
import { NotificationCenter } from './components/NotificationCenter';
import { AuthModal } from './components/AuthModal';
import { EligibilityAdvisorModal } from './components/EligibilityAdvisorModal';
import { BloodRequest, AppNotification, BloodGroup, UserProfile } from './types';
import { db, testFirestoreConnection, handleFirestoreError, OperationType } from './firebase';
import { canDonateBlood, calculateDistanceKm } from './utils/bloodCompatibility';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  getDocs
} from 'firebase/firestore';

function MainApp() {
  const { currentUser, userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'feed' | 'donors' | 'notifications' | 'profile'>('feed');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);
  
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Initialize connection test and seed default demo data if collection is empty
  useEffect(() => {
    testFirestoreConnection();

    // Check if initial blood requests & registered donors exist; if empty, seed initial sample data
    const seedInitialData = async () => {
      try {
        const snap = await getDocs(collection(db, 'bloodRequests'));
        if (snap.empty) {
          const sampleRequests: Omit<BloodRequest, 'id'>[] = [
            {
              userId: 'system_sample_1',
              requesterName: 'Dr. Arthur Pendelton',
              patientName: 'Emma Watson',
              bloodGroup: 'O-',
              unitsNeeded: 2,
              hospital: 'City General Hospital Emergency Care',
              address: '100 Medical Plaza, Central District',
              city: 'Central',
              latitude: 37.7749,
              longitude: -122.4194,
              urgency: 'Critical',
              description: 'Urgent surgery scheduled. Universal O- donor urgently needed.',
              requiredBefore: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
              emergencyContact: '+1 (555) 019-8822',
              status: 'Open',
              createdAt: new Date().toISOString(),
            },
            {
              userId: 'system_sample_2',
              requesterName: 'Marcus Vance',
              patientName: 'Robert Vance',
              bloodGroup: 'A+',
              unitsNeeded: 3,
              hospital: 'Memorial Trauma Center',
              address: '450 East Parkway, East Wing',
              city: 'East District',
              latitude: 37.7833,
              longitude: -122.4167,
              urgency: 'Urgent',
              description: 'Platelet and blood transfusion required post-trauma.',
              requiredBefore: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              emergencyContact: '+1 (555) 012-9933',
              status: 'Open',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            },
            {
              userId: 'system_sample_3',
              requesterName: 'Elena Rostova',
              patientName: 'David Rostova',
              bloodGroup: 'B+',
              unitsNeeded: 1,
              hospital: 'St. Jude Children Hospital',
              address: '820 Saint Jude Ave',
              city: 'Northside',
              latitude: 37.7690,
              longitude: -122.4467,
              urgency: 'Normal',
              description: 'Routine dialysis & blood unit requirement.',
              requiredBefore: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
              emergencyContact: '+1 (555) 018-3344',
              status: 'Open',
              createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            }
          ];

          for (const req of sampleRequests) {
            await addDoc(collection(db, 'bloodRequests'), req);
          }
        }

        // Seed initial registered donors ONLY if the directory is completely empty
        const usersSnap = await getDocs(collection(db, 'users'));
        if (usersSnap.empty) {
          const sampleDonors: UserProfile[] = [
            {
              id: 'sample_donor_1',
              name: 'Sarah Jenkins',
              email: 'sarah.jenkins@gmail.com',
              phone: '+1 (555) 234-5678',
              bloodGroup: 'O-',
              address: '100 Medical Plaza, Central District',
              latitude: 37.7752,
              longitude: -122.4180,
              isAvailableDonor: true,
              profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahJenkins',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'sample_donor_2',
              name: 'Dr. Michael Chen',
              email: 'mchen.md@hospital.org',
              phone: '+1 (555) 876-5432',
              bloodGroup: 'A+',
              address: 'Downtown Medical Plaza, Central City',
              latitude: 37.7740,
              longitude: -122.4200,
              isAvailableDonor: true,
              profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MichaelChen',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'sample_donor_3',
              name: 'Priya Sharma',
              email: 'priya.sharma99@gmail.com',
              phone: '+1 (555) 345-6789',
              bloodGroup: 'B+',
              address: 'Memorial Parkway, Central City',
              latitude: 37.7780,
              longitude: -122.4120,
              isAvailableDonor: true,
              profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaSharma',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'sample_donor_4',
              name: 'David Miller',
              email: 'david.m.donor@gmail.com',
              phone: '+1 (555) 987-6543',
              bloodGroup: 'O+',
              address: 'St. Jude District, Central City',
              latitude: 37.7720,
              longitude: -122.4280,
              isAvailableDonor: true,
              profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DavidMiller',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'sample_donor_5',
              name: 'Alex Rivera',
              email: 'alex.rivera.donor@outlook.com',
              phone: '+1 (555) 456-7890',
              bloodGroup: 'AB+',
              address: 'Far Suburb District (18.5 km away)',
              latitude: 37.9100,
              longitude: -122.1500,
              isAvailableDonor: true,
              profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexRivera',
              createdAt: new Date().toISOString(),
            }
          ];

          for (const d of sampleDonors) {
            await setDoc(doc(db, 'users', d.id), d);
          }
        }
      } catch (err) {
        console.warn('Initial seed check skipped:', err);
      }
    };

    seedInitialData();
  }, []);

  // Listen to unread notifications for badge counter
  useEffect(() => {
    if (!currentUser) {
      setUnreadNotifCount(0);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      let unread = 0;
      snap.forEach((d) => {
        if (!d.data().isRead) unread++;
      });
      setUnreadNotifCount(unread);
    });

    return () => unsub();
  }, [currentUser]);

  // Handle Creating New Blood Request
  const handleCreateRequest = async (
    requestData: Omit<BloodRequest, 'id' | 'createdAt' | 'status'>
  ) => {
    try {
      const newReq = {
        ...requestData,
        status: 'Open' as const,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'bloodRequests'), newReq);

      // Notify all registered users in database with compatible blood group who are under 20 KM
      const usersSnap = await getDocs(collection(db, 'users'));

      for (const userDoc of usersSnap.docs) {
        const u = userDoc.data() as UserProfile;
        const donorId = u.id || userDoc.id;

        // 1. Exclude self ONLY if this donor document is the exact same user profile ID as the requester
        const currentPostingId = userProfile?.id || currentUser?.uid;
        const isExactSelfDoc = currentPostingId && (donorId === currentPostingId || userDoc.id === currentPostingId);

        if (isExactSelfDoc) continue;

        // 2. Active donor check (unless explicitly marked false)
        if (u.isAvailableDonor === false || (u.isAvailableDonor as any) === 'false') continue;

        // 3. Blood Group Compatibility Check (Donor blood group must match recipient need)
        const isCompatible = canDonateBlood(u.bloodGroup || 'O+', newReq.bloodGroup || 'O+');
        if (!isCompatible) continue;

        // 4. Distance Check: Must be under 20 KM from the request location
        const distanceKm = calculateDistanceKm(
          u.latitude,
          u.longitude,
          newReq.latitude,
          newReq.longitude,
          u.address,
          newReq.address
        );

        if (distanceKm > 20.0) continue; // Skip if > 20.0 KM away

        // Send in-app notification alert to the donor
        try {
          await addDoc(collection(db, 'notifications'), {
            userId: donorId,
            title: `🚨 Urgent Blood Alert (${distanceKm} km away)`,
            message: `${newReq.patientName} urgently needs Group ${newReq.bloodGroup} blood at ${newReq.hospital} (${distanceKm} km away). Tap to respond.`,
            type: 'nearby_request',
            requestId: docRef.id,
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Failed to send in-app notification to donor:', donorId, e);
        }
      }

    } catch (err) {
      console.error('Error publishing request:', err);
      handleFirestoreError(err, OperationType.CREATE, 'bloodRequests');
    }
  };

  // Express interest handler
  const handleExpressInterest = async (request: BloodRequest) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      await addDoc(collection(db, 'interestedDonations'), {
        requestId: request.id,
        donorId: currentUser.uid,
        donorName: userProfile?.name || currentUser.displayName || 'Anonymous Donor',
        donorBloodGroup: userProfile?.bloodGroup || 'O+',
        donorPhone: userProfile?.phone || '',
        donorAddress: userProfile?.address || '',
        donorLatitude: userProfile?.latitude || 0,
        donorLongitude: userProfile?.longitude || 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      // Notify requester
      await addDoc(collection(db, 'notifications'), {
        userId: request.userId,
        title: 'New Interested Donor! ❤️',
        message: `${userProfile?.name || 'A volunteer'} (Group ${userProfile?.bloodGroup || 'O+'}) is available to donate blood for ${request.patientName}.`,
        type: 'interest_received',
        requestId: request.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to express interest:', err);
      handleFirestoreError(err, OperationType.CREATE, 'interestedDonations');
    }
  };

  // Update request status (Fulfilled / Closed)
  const handleUpdateRequestStatus = async (requestId: string, status: BloodRequest['status']) => {
    try {
      const ref = doc(db, 'bloodRequests', requestId);
      await updateDoc(ref, { status });
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err) {
      console.error('Failed to update request status:', err);
      handleFirestoreError(err, OperationType.UPDATE, `bloodRequests/${requestId}`);
    }
  };

  const handleSelectRequestById = async (requestId: string) => {
    try {
      const snap = await getDocs(collection(db, 'bloodRequests'));
      snap.forEach((d) => {
        if (d.id === requestId) {
          setSelectedRequest({ id: d.id, ...d.data() } as BloodRequest);
          setIsDetailModalOpen(true);
        }
      });
    } catch (err) {
      console.error('Failed to select request by ID:', err);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans flex flex-col">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'notifications') {
            setIsNotifModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenCreateModal={() => (currentUser ? setIsCreateModalOpen(true) : setIsAuthModalOpen(true))}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenAdvisorModal={() => setIsAdvisorModalOpen(true)}
        unreadCount={unreadNotifCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'feed' && (
          <HomeFeed
            onOpenCreateModal={() => (currentUser ? setIsCreateModalOpen(true) : setIsAuthModalOpen(true))}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onOpenAdvisorModal={() => setIsAdvisorModalOpen(true)}
            onSelectRequest={(req) => {
              setSelectedRequest(req);
              setIsDetailModalOpen(true);
            }}
          />
        )}

        {activeTab === 'donors' && <DonorSearch />}

        {activeTab === 'profile' && (
          <UserProfileView
            onSelectRequest={(req) => {
              setSelectedRequest(req);
              setIsDetailModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Modals */}
      <CreateRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmitRequest={handleCreateRequest}
      />

      <RequestDetailModal
        request={selectedRequest}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRequest(null);
        }}
        onExpressInterest={handleExpressInterest}
        onUpdateRequestStatus={handleUpdateRequestStatus}
      />

      <NotificationCenter
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        onSelectRequestById={handleSelectRequestById}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <EligibilityAdvisorModal
        isOpen={isAdvisorModalOpen}
        onClose={() => setIsAdvisorModalOpen(false)}
        userBloodGroup={userProfile?.bloodGroup || 'O+'}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
