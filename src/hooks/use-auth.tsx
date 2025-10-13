
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, UserCredential, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export const updateUserInFirestore = async (user: User, additionalData: Record<string, any> = {}) => {
    const userRef = doc(firestore, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    const userData: any = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLogin: serverTimestamp(),
        ...additionalData
    };
    
    const dataToWrite = Object.fromEntries(Object.entries(userData).filter(([_, v]) => v !== undefined));


    if (!docSnap.exists()) {
        await setDoc(userRef, {
            ...dataToWrite,
            fcmTokens: [], // Initialize fcmTokens field for new users
            createdAt: serverTimestamp(),
        });
    } else {
        await setDoc(userRef, dataToWrite, { merge: true });
    }
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string) => Promise<UserCredential>;
  signupWithDetails: (email: string, password: string, name: string, photoURL: string | null, details: Record<string, any>) => Promise<UserCredential>;
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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // We will update the user doc on login/signup instead of every auth change
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const handleAuthSuccess = async (userCredential: UserCredential, additionalData: Record<string, any> = {}) => {
      await updateUserInFirestore(userCredential.user, additionalData);
      setUser(userCredential.user);
      return userCredential;
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password).then((cred) => handleAuthSuccess(cred));
  };

  const signup = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password).then((cred) => handleAuthSuccess(cred));
  };

  const signupWithDetails = async (email: string, password: string, name: string, photoURL: string | null, details: Record<string, any>) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name, photoURL: photoURL || undefined });
    return handleAuthSuccess(userCredential, { ...details, displayName: name, photoURL: photoURL });
  };


  const googleLogin = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider).then((cred) => handleAuthSuccess(cred));
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };
  
  const setupRecaptcha = (elementId: string) => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      if (window.recaptchaVerifier) {
        // @ts-ignore
        window.recaptchaVerifier.clear();
      }
      // @ts-ignore
      window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
        'size': 'invisible',
        'callback': (response: any) => {},
      });
      // @ts-ignore
      return window.recaptchaVerifier;
    }
    return {} as RecaptchaVerifier;
  };

  const sendOtp = (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
    return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  };

  const verifyOtp = (confirmationResult: ConfirmationResult, otp: string) => {
    return confirmationResult.confirm(otp).then((cred) => handleAuthSuccess(cred));
  };


  const value = { user, loading, login, signup, signupWithDetails, googleLogin, logout, setupRecaptcha, sendOtp, verifyOtp };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
