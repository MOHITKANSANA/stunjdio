
// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
const firebaseConfig = {
  apiKey: "AIzaSyCowK1pgv_fGzCo65c-7_-9vTIkrO628yM",
  authDomain: "go-swami-coching-classes.firebaseapp.com",
  projectId: "go-swami-coching-classes",
  storageBucket: "go-swami-coching-classes.firebasestorage.app",
  messagingSenderId: "1064325037320",
  appId: "1:1064325037320:web:d9ce26cc409e20702700bd"
};

firebase.initializeApp(firebaseConfig);


// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/go-swami-logo.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
