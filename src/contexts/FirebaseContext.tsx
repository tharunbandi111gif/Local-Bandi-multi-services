import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut, signInWithPhoneNumber, ConfirmationResult, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp, updateDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

import { Address } from '../types';

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  gender?: string;
  role?: 'user' | 'admin' | 'branchAdmin' | 'vendor' | 'delivery';
  vendorId?: string;
  deliveryPartnerId?: string;
  branchId?: string | null;
  branchName?: string;
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
  signInAnon: () => Promise<void>;
  logout: () => Promise<void>;
  deactivateAccount: () => Promise<void>;
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
            if ((data as any).isDeactivated === true) {
              // Sign out immediately and clear credentials!
              signOut(auth);
              localStorage.removeItem('admin_session_active');
              localStorage.removeItem('lokal_branch_id');
              localStorage.removeItem('user_role');
              localStorage.removeItem('user_addresses');
              localStorage.setItem('deactivated_login_attempt', 'true');
              setUserProfile(null);
              return;
            }
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
            
            // Non-blocking auto location capture on first-time sign-up
            const autoCaptureAndSaveLocation = async (uid: string, profileObj: any) => {
              let capturedAddress = 'Khammam Center, Khammam, Telangana, 507001';
              let matchedBranchId = 'khammam_main';
              let matchedBranchName = 'Khammam Main Branch';
              let lat = 17.2473;
              let lng = 80.1514;

              try {
                if (navigator.geolocation) {
                  const position = await new Promise<any>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { 
                      enableHighAccuracy: true, 
                      timeout: 5000, 
                      maximumAge: 0 
                    });
                  });
                  const { latitude, longitude } = position.coords;
                  lat = latitude;
                  lng = longitude;
                  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
                  const data = await response.json();
                  if (data && data.display_name) {
                    capturedAddress = data.display_name;
                  }
                }
              } catch (err) {
                console.warn("Auto geocode on signup failed/denied. Using fallback location.", err);
              }

              try {
                const branchesSnap = await getDocs(collection(db, 'branches'));
                const branchesList = branchesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                
                if (branchesList.length > 0) {
                  const lowerLoc = capturedAddress.toLowerCase();
                  const pincodeMatch = capturedAddress.match(/\d{6}/);
                  const pincode = pincodeMatch ? pincodeMatch[0] : null;

                  const scored = branchesList.map((b: any) => {
                    let score = 0;
                    const bName = (b.name || '').toLowerCase();
                    const bLoc = (b.location || '').toLowerCase();
                    const bCity = (b.city || '').toLowerCase();
                    const bDist = (b.district || '').toLowerCase();

                    if (pincode && b.pincodes?.includes(pincode)) score += 100;
                    if (lowerLoc === bLoc || lowerLoc === bName) score += 80;
                    else if (lowerLoc.includes(bLoc) || lowerLoc.includes(bName)) score += 50;
                    if (bCity && lowerLoc.includes(bCity)) score += 30;
                    if (bDist && lowerLoc.includes(bDist)) score += 20;
                    if (bLoc.includes(lowerLoc) || bName.includes(lowerLoc)) score += 40;

                    return { branch: b, score };
                  });

                  const bestMatch = scored
                    .filter(s => s.score > 0)
                    .sort((a, b) => b.score - a.score)[0]?.branch;

                  if (bestMatch) {
                    matchedBranchId = bestMatch.id;
                    matchedBranchName = bestMatch.name;
                  }
                }
              } catch (err) {
                console.warn("Branch lookup failed during auto-capture signup. Using Khammam defaults.", err);
              }

              try {
                const finalData = {
                  ...profileObj,
                  fullAddress: capturedAddress,
                  latitude: lat,
                  longitude: lng,
                  branchId: matchedBranchId,
                  branchName: matchedBranchName,
                  addresses: [{
                    id: 'default',
                    label: 'Home',
                    address: capturedAddress,
                    isDefault: true,
                    latitude: lat,
                    longitude: lng
                  }]
                };
                await setDoc(doc(db, 'users', uid), finalData);
                localStorage.setItem('lokal_user_location', capturedAddress);
                localStorage.setItem('lokal_user_lat', String(lat));
                localStorage.setItem('lokal_user_lng', String(lng));
                localStorage.setItem('lokal_branch_id', matchedBranchId);
              } catch (err) {
                console.error("Failed to save auto-captured location profile on signup", err);
              }
            };

            autoCaptureAndSaveLocation(currentUser.uid, newProfile).catch(console.error);
          }
        }, (error) => {
          console.warn("User profile sync error:", error);
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
      throw error;
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

  const signInAnon = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Anonymous login failed", error);
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

  const deactivateAccount = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    try {
      await updateDoc(doc(db, 'users', uid), {
        isDeactivated: true,
        deactivatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Firestore deactivation update failed:", err);
    }
    
    localStorage.removeItem('admin_session_active');
    localStorage.removeItem('lokal_branch_id');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_addresses');
    
    await signOut(auth);
  };

  return (
    <FirebaseContext.Provider value={{ user, userProfile, isAdmin, isSuperAdmin, isBranchAdmin, branchId, loading, login, phoneLogin, signInWithToken, signInAnon, logout, deactivateAccount, isLoggingOut }}>
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
