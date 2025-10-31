// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCigw6VqiIr0LjcZDrv4KdIfHaqJilf_EY",
  authDomain: "convo-chat-78ecd.firebaseapp.com",
  projectId: "convo-chat-78ecd",
  storageBucket: "convo-chat-78ecd.appspot.com",
  messagingSenderId: "248962846044",
  appId: "1:248962846044:web:4272a1ebb22cc6c7264599",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
