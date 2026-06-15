// config/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAArGl7Sq4ksqiT38HMCPSkKzmi_oAiX2k",
  authDomain: "basicsbox-38e4.firebaseapp.com",
  projectId: "basicsbox-38e4",
  storageBucket: "basicsbox-38e4.firebasestorage.app",
  messagingSenderId: "938357503974",
  appId: "1:938357503974:web:aa78ffac8bbd44a0554827",
  measurementId: "G-YG8NMX2YBK"
};

// Initialize Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize auth
const auth = getAuth(app);

// Export the CLASS itself, not an instance
export { auth, GoogleAuthProvider };  // GoogleAuthProvider is the class