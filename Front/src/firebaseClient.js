import { initializeApp, getApps } from '../node_modules/firebase/app';
import { getAuth } from '../node_modules/firebase/auth';
import { getAnalytics } from '../node_modules/firebase/analytics';

const firebaseClientConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseClientConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);

if (typeof window !== 'undefined') {
  const analytics = getAnalytics(app);
}
