
# FUTURE_FS_02 – Client Lead Management System (Mini CRM)

A full‑stack Mini CRM built for the **Future Interns Full Stack Web Development** internship.  
It manages client leads from contact forms with secure admin access, lead status tracking, and per‑lead notes with follow‑up dates.

## 🚀 Live Demo

*Add your live deployment URL here (e.g., Render + Netlify/Vercel)*

---

## 📦 Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication (bcryptjs)
- REST API

### Frontend
- React 18
- React Router DOM
- Axios
- CSS (custom responsive styling)

---

## ✨ Features

- **Secure admin login** (JWT, protected routes)
- **Lead listing** with:
  - Filter by status (new / contacted / converted)
  - Search by name or email
  - Sort by name, email, status, or creation date
  - Pagination (10 leads per page)
- **Lead status update** (dropdown, persists instantly)
- **Delete lead** (also removes all associated notes)
- **Notes management** per lead:
  - Add a note (with optional follow‑up date)
  - Delete a note
  - View all notes in a modal
- **Auto‑seeding** of demo admin user and sample leads on first run

---

## 🗂️ Project Structure
FUTURE_FS_02/
├── backend/
│ ├── models/
│ │ ├── Lead.js
│ │ ├── Note.js
│ │ └── User.js
│ ├── routes/
│ │ ├── auth.js
│ │ ├── leads.js
│ │ └── notes.js
│ ├── middleware/
│ │ └── auth.js
│ ├── .env
│ ├── server.js
│ └── package.json
├── frontend/
│ ├── public/
│ │ └── index.html
│ ├── src/
│ │ ├── components/
│ │ │ ├── Login.js
│ │ │ ├── LeadTable.js
│ │ │ ├── NotesModal.js
│ │ │ └── Navbar.js
│ │ ├── App.js
│ │ ├── App.css
│ │ ├── index.js
│ │ ├── index.css
│ │ └── api.js
│ ├── .env
│ ├── package.json
│ └── README.md (optional)
└── README.md (this file)

text

---

## 🔧 Setup Instructions (Local Development)

### Prerequisites
- Node.js (v16 or later)
- MongoDB (local installation or MongoDB Atlas cloud account)
- Git (optional)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd FUTURE_FS_02
2. Backend Setup
bash
cd backend
npm install
Create a .env file inside backend/:

env
PORT=5000
MONGO_URI=mongodb://localhost:27017/crm_db   # or your MongoDB Atlas URI
JWT_SECRET=your_super_strong_secret_key
ADMIN_EMAIL=admin@crm.com
ADMIN_PASSWORD=admin123
Start the backend server:

bash
npm run dev
You should see:

text
✅ MongoDB connected
✅ Seeded admin user: admin@crm.com / admin123
✅ Seeded 3 sample leads
🚀 Server running on port 5000
3. Frontend Setup
Open a new terminal and navigate to the frontend folder:

bash
cd frontend
npm install
Create a .env file inside frontend/:

env
REACT_APP_API_URL=http://localhost:5000/api
Start the frontend development server:

bash
npm start
The app will open at http://localhost:3000.

4. Login
Email: admin@crm.com

Password: admin123

📡 API Endpoints (Backend)
All endpoints are prefixed with /api.
Protected routes require a JWT token in the header: x-auth-token: <your-token>

Method	Endpoint	Description	Access
POST	/auth/login	Admin login	Public
GET	/auth/verify	Verify token & get user	Private
GET	/leads	List all leads (filter/sort/paginate)	Private
GET	/leads/stats	Lead status counts	Private
GET	/leads/:id	Get one lead + its notes	Private
POST	/leads	Create a new lead	Private
PUT	/leads/:id	Update lead details	Private
PUT	/leads/:id/status	Update lead status	Private
DELETE	/leads/:id	Delete lead (and notes)	Private
GET	/leads/:id/notes	Get notes for a lead	Private
POST	/leads/:id/notes	Add a note to a lead	Private
PUT	/notes/:id	Update a note	Private
DELETE	/notes/:id	Delete a note	Private
GET	/notes/upcoming	Get notes with future follow‑up	Private
🧪 Testing the API (Postman example)
Login:

http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@crm.com",
  "password": "admin123"
}
Response includes a token. Copy it, then for any protected request add header:

text
x-auth-token: <your-token>
Fetch leads:

http
GET http://localhost:5000/api/leads?status=new&sortBy=createdAt&order=desc
📸 Screenshots
Add screenshots here:

Login page

Lead table with filters

Status change dropdown

Notes modal with add/delete

✅ Submission Checklist (per Internship Guidelines)
Admin login works and routes are protected

Lead status can be changed and persists after refresh

Notes can be added and deleted

No hardcoded credentials in the code (demo credentials are seeded by backend)

GitHub repository named FUTURE_FS_02

README contains demo credentials, setup instructions, API docs

🧑‍💻 Author
Your filimon gebretsadik – https://www.linkedin.com/in/fillimon-gebre
Internship: Future Interns – Full Stack Web Development

📄 License
This project is for internship submission purposes only.

🙏 Acknowledgements
Future Interns for the task guidelines

MongoDB, Express, React, Node.js communities

text

---

This README covers **both** backend and frontend, includes all required sections (demo credentials, setup, API docs), and follows the internship submission guidelines. You can now place it in the root of your `FUTURE_FS_02` repository.