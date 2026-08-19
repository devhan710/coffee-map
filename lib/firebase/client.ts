"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

function readConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !appId) return null;

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

export function isFirebaseConfigured() {
  return readConfig() !== null;
}

export function getFirebaseApp(): FirebaseApp | null {
  const existing = getApps()[0];
  if (existing) return existing;

  const config = readConfig();
  if (!config) return null;

  return initializeApp(config);
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : null;
}

export function googleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

function canUsePopup() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return false;
  if (/KAKAOTALK|Instagram|FBAN|FBAV|NAVER|Line\//i.test(ua)) return false;
  return true;
}

function popupFailed(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  return (
    code === "auth/popup-blocked" ||
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request" ||
    code === "auth/operation-not-supported-in-this-environment"
  );
}

export async function signInWithGoogle(auth: Auth) {
  const provider = googleProvider();
  if (canUsePopup()) {
    try {
      await signInWithPopup(auth, provider);
      return;
    } catch (error) {
      if (!popupFailed(error)) throw error;
    }
  }

  await signInWithRedirect(auth, provider);
}

export async function completeGoogleRedirect(auth: Auth) {
  return getRedirectResult(auth);
}
