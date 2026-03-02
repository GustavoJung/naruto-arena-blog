import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.replace(/^["']|["']$/g, ""),
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.replace(/^["']|["']$/g, ""),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.replace(/^["']|["']$/g, ""),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.replace(/^["']|["']$/g, ""),
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.replace(/^["']|["']$/g, ""),
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.replace(/^["']|["']$/g, ""),
};

// Debug: Check if config is loaded (only on client)
if (typeof window !== "undefined") {
    const missingKeys = Object.entries(firebaseConfig)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

    if (missingKeys.length > 0) {
        console.error("Firebase config is missing keys:", missingKeys);
    }
}

// Initialize Firebase only if we have a valid config
const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined";

let app: any;
let auth: any;
let db: any;

if (isConfigValid) {
    try {
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
} else if (typeof window !== "undefined") {
    console.warn("⚠️ Firebase: Configuração não encontrada. Verifique suas variáveis de ambiente ou o arquivo .env.local.");
    console.warn("Se você estiver em produção (ex: Vercel/GitHub Pages), certifique-se de adicionar as chaves nas configurações do projeto.");
}

// Export null/mock if not initialized to prevent some crashes, 
// though consumers using them directly might still throw.
export { app, auth, db };
