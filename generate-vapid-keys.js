// Run this ONCE to generate VAPID keys: node generate-vapid-keys.js
// Then copy the keys into your .env file

const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();

console.log('=== VAPID Keys Generated ===');
console.log('Copy these into your .env file:\n');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
