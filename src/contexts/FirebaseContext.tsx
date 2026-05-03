import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  role?: 'user' | 'admin' | 'vendor' | 'delivery';
  createdAt: any;
}

interface FirebaseContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubAdmin: () => void = () => {};
    let unsubProfile: () => void = () => {};
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const isBootstrapAdmin = currentUser.email === 'tharunbandi111@gmail.com' || currentUser.email === 'localbharathkhammam@gmail.com';
        
        try {
          const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
          setIsAdmin(adminDoc.exists() || isBootstrapAdmin);
        } catch (e) {
          setIsAdmin(isBootstrapAdmin);
        }
        
        unsubAdmin = onSnapshot(doc(db, 'admins', currentUser.uid), (docSnippet) => {
          setIsAdmin(docSnippet.exists() || isBootstrapAdmin);
        }, () => {
          setIsAdmin(isBootstrapAdmin);
        });

        // Listen to user profile
        unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (docSnippet) => {
          if (docSnippet.exists()) {
            setUserProfile(docSnippet.data() as UserProfile);
          } else {
            // Create profile if not exists
            const newProfile: any = {
              id: currentUser.uid,
              email: currentUser.email || '',
              name: currentUser.displayName || '',
              role: isBootstrapAdmin ? 'admin' : 'user',
              createdAt: serverTimestamp()
            };
            setUserProfile(newProfile);
            setDoc(doc(db, 'users', currentUser.uid), newProfile).catch(console.error);
          }
        });
      } else {
        setIsAdmin(false);
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

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, userProfile, isAdmin, loading, login, logout }}>
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
