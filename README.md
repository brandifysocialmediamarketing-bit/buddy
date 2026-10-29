# 💬 BUDDY – Private 1-to-1 Chat Web App

> **BUDDY** couples aur best friends ke liye banaya gaya ek modern, intimate aur ultra-clean 1-to-1 private messaging web application hai. Iska interface Instagram DM jaisa fast aur simple hai, par design bilkul original aur distraction-free hai!

---

## 🌟 Main Features (Sabhi Features)

### 1. 🔐 Clean Authentication (Login / Signup)
* **BUDDY Logo & Glassmorphism Design**
* **Instant Demo Login**: `demo@buddy.app` / `demo123`
* **Sign In / Sign Up toggle**
* **Show/Hide password toggle**
* **Forgot Password** reset link simulation

### 2. 💌 Conversations & Chat List
* **Search bar** friends ya chats search karne ke liye
* **Pinned Chats support (📌)**: Apne special partner ya best friend ko sabse upar pin kar sakte ho
* **Online/Offline status indicator**
* **Unread message badge counter**
* **New Chat modal**: naye contacts ke sath chat shuru karne ke liye

### 3. 💬 1-to-1 Private Chat Screen (Instagram DM Style)
* **Top Bar**:
  - Contact Avatar & Name (customizable nickname)
  - Active status ("Active now", "Active 5m ago")
  - 📞 **Audio Call** (interactive ringing & connected timer call modal)
  - 📹 **Video Call** simulation
  - ℹ️ **Details / Info button**
* **Message Area**:
  - Sent & Received message bubbles
  - Message timestamps aur double tick status (`✓` sent, `✓✓` seen)
  - 📸 **Photo** aur 🎥 **Video** sharing support
  - 🎙️ **Voice Notes**: Waveform animation aur play/pause audio simulation
  - ❤️ **Double-Tap / Double-Click Heart Reaction**: Instagram DM style animated flying heart burst!
  - 😀 **Floating Reaction Bar**: Har message par hover/tap karke `❤️`, `😂`, `🥺`, `🔥`, `👍`, `😍` react kar sakte ho!
* **Smart Composer**:
  - 😊 **Interactive Emoji Picker**: Curated categories (Love, Smileys, Hands, Vibe)
  - 🎙️ **Mic Button**: Voice recording bar with live soundwaves & timer
  - ❤️ **Quick Heart Button**: Text box khali hone par single tap se love heart bhejne ka shortcut
  - 📎 **Photo & Video attachment button**

### 4. 🎨 Sweet Touches for Couples & Friends
* **Custom Nickname**: Chat partner ka sweet name set karo (e.g. "My Love ❤️", "Bestie 🌟") jo chat header aur list dono me update ho jata hai
* **Pinned Chat**: 1-click pin/unpin switch
* **Chat Accent Color Themes**:
  - ⚡ Classic Indigo
  - 💖 Romantic Rose (Couple Pink)
  - 🟣 Violet Dream
  - 🌊 Ocean Breeze
  - 🌅 Sunset Amber
  - 🌿 Emerald Mint

### 5. 👤 Profile & App Settings
* **Avatar color gradient presets**
* **Bio & Mood status** (Available, Missing you ❤️, Sleeping 😴, Busy 💼)
* ☀️ / 🌙 **Dark Mode & Light Mode** toggle

---

## 🚀 How to Run BUDDY (Kaise Chalayein)

Aapko coding aane ki bilkul jarurat nahi hai!

### Option 1: Browser me direct chalayein (Fastest)
1. `D:\BUDDY` folder kholein.
2. `index.html` file par double click karein.
3. BUDDY aapke browser me khul jayega!

### Option 2: Local Server par chalayein
Web server pehle se hi background me running hai:
👉 **[http://localhost:3456](http://localhost:3456)**

Demo Login details:
* **Email:** `demo@buddy.app`
* **Password:** `demo123`
*(Ya fir koi bhi email/password daal kar login ya signup kar sakte ho!)*

---

## ☁️ Supabase Connect Karne Ka Tarika (Future Ready)

BUDDY ka frontend architecture puri tarah se **Supabase Ready** banaya gaya hai. Jab aapko real database connect karna ho:

1. [supabase.com](https://supabase.com) par free account banayein aur "BUDDY" naam ka project banayein.
2. Supabase dashboard me **SQL Editor** me jayein aur `supabase-schema.sql` file ka poora code paste karke **Run** dabayein.
3. `js/supabase-config.js` file kholein:
   - Apni `SUPABASE_URL` aur `SUPABASE_ANON_KEY` daalein.
   - `USE_SUPABASE = true` set karein.
4. Bas! Real-time messaging aur database cloud par chalu ho jayega.

---

## 📁 File Structure

```
D:\BUDDY\
├── index.html              # Main HTML user interface
├── README.md               # Documentation & Guide (Yeh file)
├── supabase-schema.sql     # Ready-to-run PostgreSQL database schema
├── css\
│   └── style.css           # Premium responsive styling & animations
└── js\
    ├── theme.js            # Light/Dark mode & theme manager
    ├── supabase-config.js  # Supabase client & API connector
    ├── auth.js             # Login, Signup, Forgot password logic
    ├── chat.js             # Core chat, calls, voice, reactions & modals
    └── app.js              # Application bootstrapper
```

---
*Created with ❤️ for BUDDY*
