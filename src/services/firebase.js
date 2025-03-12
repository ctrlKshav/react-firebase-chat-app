import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';
import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    collection,
    addDoc,
    serverTimestamp,
    onSnapshot,
    query,
    orderBy
} from 'firebase/firestore';
import localforage from 'localforage';


// Initialize local storage for offline messages
localforage.config({
    name: "chat-app",
    storeName: "offlineMessages",
});

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with persistence enabled
const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});



async function loginWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        const auth = getAuth();

        const { user } = await signInWithPopup(auth, provider);

        return { uid: user.uid, displayName: user.displayName };
    } catch (error) {
        if (error.code !== 'auth/cancelled-popup-request') {
            console.error(error);
        }
        return null;
    }
}

async function sendMessage(roomId, user, text) {

    try {
    
    if (!text.trim()) return;

    const messageData = {
      text: text,
      timestamp: serverTimestamp(),
      uid: user.uid,
      displayName: user.displayName,

    };
  
    if (navigator.onLine) {
      // Online: Send message to Firestore
      await addDoc(collection(db, "chat-rooms", roomId, 'messages'), messageData);
    } else {
      // Offline: Save message in IndexedDB
      localforage.setItem(Date.now().toString(), {
        ...messageData,
                roomId: roomId, // Store the roomId
                localTimestamp: Date.now() 
      });
    }

    } catch (error) {
        console.error(error);
    }
}

function getMessages(roomId, callback) {
    return onSnapshot(
        query(
            collection(db, 'chat-rooms', roomId, 'messages'),
            orderBy('timestamp', 'asc')
        ),
        (querySnapshot) => {
            const messages = querySnapshot.docs.map((x) => ({
                id: x.id,
                ...x.data(),
            }));

            callback(messages);
        }
    );
}


  

export { loginWithGoogle, sendMessage, getMessages };

// ...existing code...

// Sync Offline Messages when Online
window.addEventListener("online", async () => {
    const keys = await localforage.keys();
    for (let key of keys) {
        const msg = await localforage.getItem(key);
        if (msg && msg.roomId) {
            try {
                const { roomId, localTimestamp, ...messageData } = msg;
                // Use the correct collection path
                await addDoc(collection(db, "chat-rooms", roomId, "messages"), {
                    ...messageData,
                    timestamp: serverTimestamp() // Update with server timestamp
                });
                await localforage.removeItem(key);
            } catch (error) {
                console.error("Error syncing offline message:", error);
            }
        }
    }
});