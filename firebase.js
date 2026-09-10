import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAXGQKpJ02LBiGSVdTlrQZXjBsnHrXLAHI",
  authDomain: "scanbeli.firebaseapp.com",
  projectId: "scanbeli",
  storageBucket: "scanbeli.firebasestorage.app",
  messagingSenderId: "791591627311",
  appId: "1:791591627311:web:86effe90b808fe9590f4da"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export async function initAnonymousAuth() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  const result = await signInAnonymously(auth);
  return result.user;
}
