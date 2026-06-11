import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut, signInWithPhoneNumber, ConfirmationResult, signInWithCustomToken } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

import { Address } from '../types';

interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  gender?: string;
  role?: 'user' | 'admin' | 'branchAdmin' | 'vendor' | 'delivery';
  vendorId?: string;
  deliveryPartnerId?: string;
  branchId?: string | null;
  isApproved?: boolean;
  hasPaidMB?: boolean;
  mbPlanId?: string;
  mbPlanExpires?: any;
  mbViewsLeft?: number;
  addresses?: Address[];
  fullAddress?: string;
  photo?: string;
  createdAt: any;
}

interface FirebaseContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isBranchAdmin: boolean;
  branchId: string | null;
  loading: boolean;
  login: () => Promise<void>;
  phoneLogin: (phoneNumber: string, appVerifier: any) => Promise<ConfirmationResult>;
  signInWithToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoggingOut: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isBranchAdmin, setIsBranchAdmin] = useState(false);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let unsubAdmin: () => void = () => {};
    let unsubProfile: () => void = () => {};
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const isBootstrapAdmin = currentUser.email === 'tharunbandi111@gmail.com' || 
                                 currentUser.email === 'tarunbandi111@gmail.com' ||
                                 currentUser.phoneNumber === '+918790729816' ||
                                 currentUser.phoneNumber === '+917416574197';
        
        try {
          const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
          setIsAdmin(adminDoc.exists() || isBootstrapAdmin);
          setIsSuperAdmin(isBootstrapAdmin); // Currently ONLY bootstrap admins are Super Admins
        } catch (e) {
          setIsAdmin(isBootstrapAdmin);
          setIsSuperAdmin(isBootstrapAdmin);
        }
        
        unsubAdmin = onSnapshot(doc(db, 'admins', currentUser.uid), (docSnippet) => {
          setIsAdmin(docSnippet.exists() || isBootstrapAdmin);
          setIsSuperAdmin(isBootstrapAdmin);
        }, () => {
          setIsAdmin(isBootstrapAdmin);
          setIsSuperAdmin(isBootstrapAdmin);
        });

        // Listen to user profile
        unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (docSnippet) => {
          if (docSnippet.exists()) {
            const data = docSnippet.data() as UserProfile;
            setUserProfile(data);
            setIsBranchAdmin(data.role === 'branchAdmin' || (data as any).isBranchAdmin === true);
            setBranchId(data.branchId || null);
          } else {
            // Create profile if not exists
            const newProfile: any = {
              id: currentUser.uid,
              email: currentUser.email || '',
              phone: currentUser.phoneNumber || '',
              name: currentUser.displayName || '',
              role: isBootstrapAdmin ? 'admin' : 'user',
              createdAt: serverTimestamp()
            };
            setUserProfile(newProfile);
            setIsBranchAdmin(false);
            setBranchId(null);
            setDoc(doc(db, 'users', currentUser.uid), newProfile).catch(console.error);
          }
        });
      } else {
        setIsAdmin(false);
        setIsBranchAdmin(false);
        setBranchId(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      unsubAdmin();
      unsubProfile();
    };
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const phoneLogin = async (phoneNumber: string, appVerifier: any) => {
    try {
      return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    } catch (error) {
      console.error("Phone login failed", error);
      throw error;
    }
  };

  const signInWithToken = async (token: string) => {
    try {
      await signInWithCustomToken(auth, token);
    } catch (error) {
      console.error("Custom token login failed", error);
      throw error;
    }
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      localStorage.removeItem('admin_session_active');
      localStorage.removeItem('lokal_branch_id');
      localStorage.removeItem('user_role');
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, userProfile, isAdmin, isSuperAdmin, isBranchAdmin, branchId, loading, login, phoneLogin, signInWithToken, logout, isLoggingOut }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
