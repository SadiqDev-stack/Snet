# 🚀 SNet - Real-Time Chat Application

SNet is a full-featured real-time chat application built with modern web technologies. It supports one-on-one messaging, group chats, message editing, deletion, typing indication, replies, and more — designed for scalability, performance, and a smooth user experience.

---

## 📌 Features

* 💬 Real-time messaging (1-on-1 & group chat)
* 📝 Edit & delete messages
* 🔁 Reply to messages
* 👥 Group chat management
* ⚡ Redis-based caching for performance
* 🔐 Authentication & security handling
* 📦 Scalable backend architecture
* ⏱ Rate limiting to prevent abuse
* ☁️ Cloud media upload support
* 📊 Controlled chat history & limits

---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB
* **Caching:** Redis
* **Queue System:** uses nedb build new by dev for  serverless env
* **Real-time:** Socket.io
* **Cloud Storage:** Cloudinary

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/SadiqDev-stack/Snet.git
cd Snet
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Create `.env` file

Create a `.env` file in the root directory and add the following variables:

```env
# App Config
PORT=your_port_number

# Database
DB_URI=your_mongodb_connection_string

# Security
HASH_KEY=your_hash_secret_key
HASH_ROUNDS=your_hash_rounds
TOKEN_EXPIRE_TIME=token_expiry_time

# Rate Limiting
LIMITING_TIME=rate_limit_time_window
LIMITING_RATE=max_requests_per_window

# Mail Configuration
MAIL_APP_KEY=your_mail_app_password
SENDER_MAIL=your_email_address
CEO_EMAIL=admin_email_address

# Cache
CACHE_EXPIRE_TIME=cache_expiry_seconds

# Chat Limits
MAX_CHAT_HISTORY=max_messages_to_store
MAX_DELETE=max_delete_limit

# Cloud Storage (Cloudinary)
CLOUD_NAME=your_cloud_name
CLOUD_API_KEY=your_cloud_api_key
CLOUD_SECRET_KEY=your_cloud_secret_key

# Chat Settings
CHAT_SETTINGS_ALLOWED=["groupName", "groupDescription", "messageAllowed", "for", "groupPic"]
```

⚠️ **Important:** Never expose your real credentials publicly. Keep your `.env` file secure.

---

### 4. Start the server

make sure you have all the package like redis installed so you cant get errors
```bash
npm start
```

## 📂 Project Structure (Overview) MVC

```
/controllers
/models
/routes
/middleware
/utils
/services
/config
```

---

## 🔐 Security Notes

* Uses hashing for sensitive data
* Rate limiting prevents spam/abuse
* Token-based authentication system
* Environment variables protect secrets

---

## 📈 Future Improvements

* 📱 Mobile app integration
* 🤖 AI-powered chat features
* 📊 Admin dashboard & analytics
* 🔔 Push notifications
* 🧠 Smart message suggestions

---

## 🤝 Contribution

Contributions are welcome!
Feel free to fork the repo and submit a pull request.

---

## 📬 Contact

For inquiries or collaboration:

* Email: **[sadiqmuh1321@gmail.com](mailto:sadiqmuh1321@gmail.com)**

---

## ⭐ Final Note

This project reflects a strong backend architecture with real-world scalability in mind. If you're exploring real-time systems, caching strategies, and production-ready Node.js apps — this is a solid reference.

---

🔥 Keep building. This is the kind of project that actually gets attention.
