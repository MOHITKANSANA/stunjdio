
// Import the Firebase app and messaging services
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCowK1pgv_fGzCo65c-7_-9vTIkrO628yM",
  authDomain: "go-swami-coching-classes.firebaseapp.com",
  projectId: "go-swami-coching-classes",
  storageBucket: "go-swami-coching-classes.firebasestorage.app",
  messagingSenderId: "1064325037320",
  appId: "1:1064325037320:web:d9ce26cc409e20702700bd"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// This is the magic part that handles background notifications
onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize the notification here
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification.',
    icon: '/go-swami-logo.png', // Your custom icon
    badge: '/go-swami-logo.png',
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
