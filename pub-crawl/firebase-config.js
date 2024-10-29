import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCteOUI0aSZkznhdqwNGqAiAatlNFYWQ4s",
  authDomain: "pubcrawl-17ba3.firebaseapp.com",
  projectId: "pubcrawl-17ba3",
  storageBucket: "pubcrawl-17ba3.appspot.com",
  messagingSenderId: "176538288249",
  appId: "1:176538288249:web:8243b740275ca300fbd4a8",
  measurementId: "G-DDBQ1QVFW9",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export { app, auth, db };
