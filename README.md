# 🔔 PushNotify - Chrome Push Notification System

A full-featured Node.js web app for sending Chrome push notifications from an admin panel to users.

## Features

- **Admin Panel**: Send notifications to ALL, INDIVIDUAL, or SELECTED users
- **User Dashboard**: Allow/Deny push notifications with a browser permission prompt
- **Service Worker**: Handles push events and shows Chrome notifications
- **Notification History**: Track delivery status (sent/failed) per user
- **Responsive UI**: Mobile-friendly with color scheme `#00adee` / `#f8f9fa`

---

## Quick Start

### 1. Install Dependencies
```bash
cd push-notifications
npm install
```

### 2. Setup Database
```bash
mysql -u root -p < database.sql
```

### 3. Generate VAPID Keys (ONE TIME)
```bash
node generate-vapid-keys.js
```
Copy the output keys into your `.env` file.

### 4. Configure `.env`
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=push_notifications_db

SESSION_SECRET=any_random_secret_string

VAPID_PUBLIC_KEY=<paste from step 3>
VAPID_PRIVATE_KEY=<paste from step 3>
VAPID_EMAIL=mailto:admin@yourdomain.com
```

### 5. Start the App
```bash
npm start
# or for development:
npm run dev
```

Visit: http://localhost:3000

---

## Demo Credentials

| Role  | Email                | Password  |
|-------|----------------------|-----------|
| Admin | admin@example.com    | Admin@123 |
| User  | alice@example.com    | User@123  |
| User  | bob@example.com      | User@123  |

---

## Project Structure

```
push-notifications/
├── server.js                  # Express app entry point
├── .env                       # Environment variables
├── database.sql               # DB schema + seed data
├── generate-vapid-keys.js     # One-time VAPID key generator
├── config/
│   └── database.js            # MySQL connection pool
├── middleware/
│   └── auth.js                # Auth middleware (requireLogin, requireAdmin)
├── models/
│   ├── User.js                # User DB operations
│   ├── Subscription.js        # Push subscription DB operations
│   └── Notification.js        # Notification DB operations
├── routes/
│   ├── auth.js                # Login / Logout
│   ├── admin.js               # Admin dashboard, users, send, history
│   └── user.js                # User dashboard, subscribe/unsubscribe
├── views/
│   ├── auth/login.ejs
│   ├── admin/
│   │   ├── dashboard.ejs
│   │   ├── users.ejs
│   │   ├── send-notification.ejs
│   │   └── notifications.ejs
│   ├── user/dashboard.ejs
│   ├── partials/ (sidebar, topbar, flash)
│   └── 404.ejs
└── public/
    ├── sw.js                  # Service Worker (handles push events)
    ├── css/style.css
    ├── js/admin.js
    └── images/icon.png        # Add your own notification icon here
```

---

## How Push Notifications Work

1. User logs in → Browser shows **Allow/Block** permission banner
2. User clicks **Allow** → Browser creates a push subscription → saved to DB
3. Admin sends a notification → server calls `webpush.sendNotification()`
4. Browser receives push → **Service Worker** shows Chrome notification
5. User clicks notification → opens the target URL

---

## Adding a Notification Icon

Place a **192×192 PNG** icon at:
```
public/images/icon.png
```

---

## Notes

- VAPID keys must be generated **once** and stay the same (changing them invalidates all subscriptions)
- Push notifications require **HTTPS** in production (localhost works for development)
- Users who block notifications need to re-allow from browser settings manually
