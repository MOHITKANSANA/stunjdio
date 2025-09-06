
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onIdTokenChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, UserCredential, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import { useRouter } from 'next/navigation';


// Helper function to create/update user in Firestore
const updateUserInFirestore = async (user: User) => {
    const userRef = doc(firestore, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    const userData: any = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLogin: serverTimestamp(),
    };

    if (!docSnap.exists()) {
        await setDoc(userRef, {
            ...userData,
            createdAt: serverTimestamp(),
        });
    } else {
        await setDoc(userRef, userData, { merge: true });
    }
};


interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string) => Promise<UserCredential>;
  googleLogin: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  setupRecaptcha: (elementId: string) => RecaptchaVerifier;
  sendOtp: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyOtp: (confirmationResult: ConfirmationResult, otp: string) => Promise<UserCredential>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await updateUserInFirestore(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const handleAuthSuccess = async (userCredential: UserCredential) => {
      await updateUserInFirestore(userCredential.user);
      // Manually set user state to trigger re-render with latest data
      setUser(userCredential.user);
      return userCredential;
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password).then(handleAuthSuccess);
  };

  const signup = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password).then(handleAuthSuccess);
  };

  const googleLogin = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider).then(handleAuthSuccess);
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/');
  };
  
  const setupRecaptcha = (elementId: string) => {
    // Ensure this only runs on the client
    if (typeof window !== 'undefined') {
      // @ts-ignore
      if (window.recaptchaVerifier) {
        // @ts-ignore
        window.recaptchaVerifier.clear();
      }
      // @ts-ignore
      window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
      // @ts-ignore
      return window.recaptchaVerifier;
    }
    // This part should ideally not be reached in a browser environment.
    // We return a dummy object to satisfy TypeScript, but it won't work server-side.
    return {} as RecaptchaVerifier;
  };

  const sendOtp = (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
    return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  };

  const verifyOtp = (confirmationResult: ConfirmationResult, otp: string) => {
    return confirmationResult.confirm(otp).then(handleAuthSuccess);
  };


  const value = { user, loading, login, signup, googleLogin, logout, setupRecaptcha, sendOtp, verifyOtp };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
