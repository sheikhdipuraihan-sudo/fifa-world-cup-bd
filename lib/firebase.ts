import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBNWlNW98v3_PI_CzIy4Ou-cydcR4Lq7_IAIzaSyBNWlNW98v3_PI_CzIy4Ou-cydcR4Lq7_I",
  authDomain: "goalzone-live.firebaseapp.com",
  databaseURL: "https://goalzone-live-default-rtdb.firebaseio.com",
  projectId: "goalzone-live",
  storageBucket: "goalzone-live.firebasestorage.app",
  messagingSenderId: "342821520915",
  appId: "1:342821520915:web:8567b999f6511cd61021e6",
  measurementId: "G-HGVESZ8NRF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the database service
export const database = getDatabase(app);
