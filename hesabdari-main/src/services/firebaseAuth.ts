import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
GOOGLE_SCOPES.forEach((scope) => provider.addScope(scope));

let cachedAccessToken: string | null = null;

export const initFirebaseAuthListener = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedAccessToken = null;
    }
    callback(user);
  });
};

export const signInWithGooglePopup = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('دریافت توکن دسترسی گوگل انجام نشد.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

export const loginWithGoogle = async (): Promise<User> => {
  const { user } = await signInWithGooglePopup();
  return user;
};

export const getGoogleAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  // If no cached token in memory, attempt popup
  const { accessToken } = await signInWithGooglePopup();
  return accessToken;
};

export const logoutFirebase = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const signOutFromGoogle = logoutFirebase;
export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};
