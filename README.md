# Hackathon Registration & Team Formation Portal

A full-stack, responsive web application for managing collegiate hackathon registrations and team formations. Built as a college DBMS project, it demonstrates structural database normalization, triggers, stored procedures, transactions, indexing, and joins using a MySQL database with an Express backend and React Vite frontend.

---

## 💻 Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Axios, React Router, Framer Motion, Lucide React
- **Backend**: Node.js, Express.js
- **Database**: MySQL (using connection pooling and transactions)
- **Auth**: JWT Authentication, bcryptjs password hashing

---

## 🛠️ Installation & Setup Guide

### 1. Database Setup (MySQL)
1. Ensure MySQL server (e.g., via XAMPP, WAMP, or standalone installer) is running on your machine.
2. Log into the MySQL command line or a GUI tool (like phpMyAdmin or DBeaver).
3. Open a terminal and run the SQL scripts in order, or copy-paste their content:
   - **Step A**: Run the table and view definitions script:
     ```bash
     mysql -u root -p < database/schema.sql
     ```
   - **Step B**: Run the triggers setup script:
     ```bash
     mysql -u root -p < database/triggers.sql
     ```
   - **Step C**: Run the stored procedures setup script:
     ```bash
     mysql -u root -p < database/procedures.sql
     ```
   - **Step D**: Seed mock test data:
     ```bash
     mysql -u root -p < database/seed.sql
     ```

### 2. Express Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Confirm the environment configuration in the `.env` file matches your local MySQL server credentials:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=hackathon_portal
   JWT_SECRET=supersecretjwttokenkey123!@#
   ```
3. Run the backend development server:
   ```bash
   node server.js
   ```
   *(Ensure it outputs "MySQL Database connected successfully!")*

### 3. React Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:5173`.

---

## 👤 Test User Credentials

- **Admin Account**:
  - **Email**: `admin@hackportal.com`
  - **Password**: `password123`
- **Student Accounts**:
  - **Emails**: `aditya@gmail.com`, `rohan@gmail.com`, `sneha@gmail.com`, `vikram@gmail.com`
  - **Password**: `password123`

---

## 📖 API Documentation Summary

### Auth Endpoints
- `POST /api/auth/register`: Create a new student account (hashes passwords with bcrypt).
- `POST /api/auth/login`: Authenticate and return JWT token.
- `GET /api/auth/me`: Get active user profile payload.

### Profile Endpoints
- `GET /api/profiles/:userId?`: Fetch student details, bio, links, skills, and interests.
- `PUT /api/profiles`: Update student details, skills, and interests inside a transaction.

### Hackathon Endpoints
- `GET /api/hackathons`: Fetch all hackathons.
- `GET /api/hackathons/active`: Fetch published hackathons with future deadlines (uses `Active_Hackathon_View`).
- `POST /api/hackathons`: Create hackathon (Admin only).

### Team & Formation Endpoints
- `POST /api/teams`: Create a team (calls `RegisterTeam` stored procedure).
- `GET /api/teams/:id`: Fetch team details and list members (uses `Team_Summary_View`).
- `GET /api/teams/search/match`: Matches open teams filtered by skills and interest domains (uses complex joins, `GROUP BY` and `HAVING`).
- `DELETE /api/teams/:id/leave`: Leave or dissolve team (leader leaves = dissolve).
- `PUT /api/teams/:id/members/:userId/role`: Assign roles (Leader only).
- `DELETE /api/teams/:id/members/:userId`: Kick member (Leader only).

### Invitation Endpoints
- `POST /api/invitations`: Send a team invite (Leader only).
- `GET /api/invitations/pending`: List pending invitations for user.
- `PUT /api/invitations/:id/accept`: Accept invitation (calls `AcceptInvitation` stored procedure).
- `PUT /api/invitations/:id/reject`: Decline invitation.

### Registration Endpoints
- `POST /api/registrations`: Submit registration (calls `SubmitRegistration` stored procedure).
- `GET /api/registrations`: List all registration applications (Admin only, uses `Registration_Summary_View`).
- `PUT /api/registrations/:id/status`: Approve or reject registration (Admin only).

---

## 🏗️ Folder Structure

```
/hackathon-registration/
├── database/                   # Seed & Creation SQL Scripts
│   ├── schema.sql              # Tables, Views & Indexes
│   ├── triggers.sql            # Automating Notifications & Counts
│   ├── procedures.sql          # Transaction-Safe Procedures
│   └── seed.sql                # Seed Data
├── backend/                    # Express.js REST API Server
│   ├── config/db.js            # DB Connection Pool
│   ├── middleware/auth.js      # JWT & RBAC Middleware
│   ├── controllers/            # Controller Modules
│   └── server.js               # Express Router Config
└── frontend/                   # React.js (Vite) Frontend
    ├── src/
    │   ├── context/            # AuthContext & Axios Client
    │   ├── components/         # Navbar, Sidebar, StatCard
    │   ├── pages/              # Views (Student/Admin dashboards, match engine)
    │   ├── index.css           # Glassmorphism Styles & Colors
    │   └── App.jsx             # Router Switch config
    ├── tailwind.config.js
    └── vite.config.js
```
