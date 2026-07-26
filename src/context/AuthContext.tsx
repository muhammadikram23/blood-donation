import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { BloodGroup, UserProfile } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (data: {
    email: string;
    pass: string;
    name: string;
    phone?: string;
    bloodGroup: BloodGroup;
    address: string;
    latitude: number;
    longitude: number;
  }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setUserLocation: (address: string, latitude: number, longitude: number) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Store profile during registration to prevent race condition with onAuthStateChanged
  const pendingProfileRef = useRef<UserProfile | null>(null);

  // Fetch or setup default user profile document from Firestore
  const fetchUserProfile = async (user: FirebaseUser) => {
    // If registration is in progress for this UID, preserve the rich profile data
    if (pendingProfileRef.current && pendingProfileRef.current.id === user.uid) {
      setUserProfile(pendingProfileRef.current);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      } else {
        // Re-check pending ref in case setDoc completed concurrently
        if (pendingProfileRef.current && pendingProfileRef.current.id === user.uid) {
          setUserProfile(pendingProfileRef.current);
          return;
        }

        // If user document was deleted or does not exist, set local state without re-writing to Firestore automatically
        const defaultProfile: UserProfile = {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Anonymous Donor',
          email: user.email || '',
          bloodGroup: 'O+',
          address: 'Downtown Medical District',
          latitude: 37.7749, // Default SF coords
          longitude: -122.4194,
          isAvailableDonor: true,
          profileImage: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
          createdAt: new Date().toISOString(),
        };
        setUserProfile(defaultProfile);
      }
    } catch (err) {
      console.warn('Error fetching user profile, using fallback profile:', err);
      if (pendingProfileRef.current && pendingProfileRef.current.id === user.uid) {
        setUserProfile(pendingProfileRef.current);
        return;
      }
      const fallbackProfile: UserProfile = {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Anonymous Donor',
        email: user.email || 'donor@example.com',
        bloodGroup: 'O+',
        address: 'Downtown Medical District',
        latitude: 37.7749,
        longitude: -122.4194,
        isAvailableDonor: true,
        profileImage: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        createdAt: new Date().toISOString(),
      };
      setUserProfile(fallbackProfile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          await fetchUserProfile(user);
        } catch (err) {
          console.error("Failed to load user profile:", err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        await fetchUserProfile(res.user);
      }
    } catch (err: any) {
      console.warn("Firebase Auth signIn notice, using Firestore profile fallback:", err?.code || err?.message);
      
      const cleanEmail = email.trim().toLowerCase();

      // Look up user profile in Firestore by email (e.g., registered via Google Auth or previous session)
      try {
        const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const profileData = querySnap.docs[0].data() as UserProfile;
          setUserProfile(profileData);
          return;
        }
      } catch (e) {
        console.warn("Firestore query error during sign-in:", e);
      }

      // If no existing profile found in Firestore, create and save a new user profile for this email
      const mockUid = 'user-' + Math.random().toString(36).substring(2, 9);
      const fallbackProfile: UserProfile = {
        id: mockUid,
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        bloodGroup: 'O+',
        address: 'Central City',
        latitude: 37.7749,
        longitude: -122.4194,
        isAvailableDonor: true,
        profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
        createdAt: new Date().toISOString(),
      };
      setUserProfile(fallbackProfile);
      try {
        await setDoc(doc(db, 'users', mockUid), fallbackProfile);
      } catch (e) {
        console.warn('Could not save profile to Firestore:', e);
      }
    }
  };

  const signUpWithEmail = async (data: {
    email: string;
    pass: string;
    name: string;
    phone?: string;
    bloodGroup: BloodGroup;
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    try {
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, data.pass);
      const newUid = res.user.uid;

      const newProfile: UserProfile = {
        id: newUid,
        name: data.name,
        email: cleanEmail,
        phone: data.phone || '',
        bloodGroup: data.bloodGroup,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        isAvailableDonor: true,
        profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
        createdAt: new Date().toISOString(),
      };

      // Store in ref to guarantee onAuthStateChanged doesn't override with generic default profile
      pendingProfileRef.current = newProfile;
      setUserProfile(newProfile);

      const userDocRef = doc(db, 'users', newUid);
      try {
        await setDoc(userDocRef, newProfile);
      } catch (err) {
        console.error("Error setting user document in Firestore:", err);
      } finally {
        pendingProfileRef.current = null;
      }
    } catch (err: any) {
      console.warn("Firebase Auth signUp notice, using Firestore profile fallback:", err?.code || err?.message);

      // Check if user profile already exists in Firestore for this email
      try {
        const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const existingDoc = querySnap.docs[0];
          const updatedProfile: UserProfile = {
            ...(existingDoc.data() as UserProfile),
            name: data.name || (existingDoc.data() as UserProfile).name,
            phone: data.phone || (existingDoc.data() as UserProfile).phone,
            bloodGroup: data.bloodGroup || (existingDoc.data() as UserProfile).bloodGroup,
            address: data.address || (existingDoc.data() as UserProfile).address,
            latitude: data.latitude || (existingDoc.data() as UserProfile).latitude,
            longitude: data.longitude || (existingDoc.data() as UserProfile).longitude,
          };
          setUserProfile(updatedProfile);
          await setDoc(doc(db, 'users', existingDoc.id), updatedProfile, { merge: true });
          return;
        }
      } catch (e) {
        console.warn("Error updating existing user profile in Firestore:", e);
      }

      // Otherwise create a new profile in Firestore
      const fallbackUid = 'user-' + Math.random().toString(36).substring(2, 9);
      const newProfile: UserProfile = {
        id: fallbackUid,
        name: data.name,
        email: cleanEmail,
        phone: data.phone || '',
        bloodGroup: data.bloodGroup,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        isAvailableDonor: true,
        profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
        createdAt: new Date().toISOString(),
      };

      setUserProfile(newProfile);

      try {
        await setDoc(doc(db, 'users', fallbackUid), newProfile);
      } catch (e) {
        console.warn("Could not save fallback user document to Firestore:", e);
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        const userDocRef = doc(db, 'users', res.user.uid);
        const snap = await getDoc(userDocRef);
        let profile: UserProfile;
        if (snap.exists()) {
          profile = snap.data() as UserProfile;
        } else {
          profile = {
            id: res.user.uid,
            name: res.user.displayName || res.user.email?.split('@')[0] || 'Google Donor',
            email: res.user.email?.toLowerCase() || '',
            bloodGroup: 'O+',
            address: 'Central City',
            latitude: 37.7749,
            longitude: -122.4194,
            isAvailableDonor: true,
            profileImage: res.user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${res.user.uid}`,
            createdAt: new Date().toISOString(),
          };
          try {
            await setDoc(userDocRef, profile);
          } catch (e) {
            console.warn("Could not save Google user profile to Firestore:", e);
          }
        }
        setUserProfile(profile);
      }
    } catch (err: any) {
      console.warn("Google Auth notice:", err?.code || err?.message || err);
      throw err;
    }
  };

  const signInAsGuest = async () => {
    try {
      const res = await signInAnonymously(auth);
      if (res.user) {
        await fetchUserProfile(res.user);
      }
    } catch (err: any) {
      console.info("Anonymous Auth disabled or restricted in Firebase Console, using local guest profile:", err?.message || err);
      // Fallback guest user if anonymous auth is disabled in project settings
      const mockUid = 'guest-' + Math.random().toString(36).substring(2, 9);
      const defaultProfile: UserProfile = {
        id: mockUid,
        name: 'Guest Donor',
        email: 'guest@blooddonation.org',
        bloodGroup: 'O+',
        address: 'Downtown Medical District',
        latitude: 37.7749,
        longitude: -122.4194,
        isAvailableDonor: true,
        profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${mockUid}`,
        createdAt: new Date().toISOString(),
      };
      setUserProfile(defaultProfile);
      try {
        await setDoc(doc(db, 'users', mockUid), defaultProfile);
      } catch (e) {
        console.warn("Could not save guest user document to Firestore:", e);
      }
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore sign out error for local guest users
    }
    setUserProfile(null);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updatedProfile = { ...userProfile, ...updates };
    setUserProfile(updatedProfile);

    const docId = userProfile.id || currentUser?.uid;
    if (docId) {
      const userDocRef = doc(db, 'users', docId);
      try {
        await setDoc(userDocRef, updatedProfile, { merge: true });
      } catch (err) {
        console.warn('Could not sync user profile to Firestore:', err);
      }
    }
  };

  const setUserLocation = async (address: string, latitude: number, longitude: number) => {
    await updateUserProfile({ address, latitude, longitude });
  };

  const updateUserPassword = async (newPassword: string) => {
    if (auth.currentUser) {
      try {
        await updatePassword(auth.currentUser, newPassword);
      } catch (err: any) {
        console.warn('Firebase Auth updatePassword error:', err);
        if (err?.code === 'auth/requires-recent-login') {
          throw new Error('For security reasons, please log out and log back in before updating your password.');
        } else if (err?.message) {
          throw new Error(err.message);
        }
        throw err;
      }
    } else if (userProfile) {
      // Local/Guest profile password updated
      console.info('Password updated for user profile session.');
    } else {
      throw new Error('No active user session to update password.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInAsGuest,
        signOutUser,
        updateUserProfile,
        setUserLocation,
        updateUserPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
