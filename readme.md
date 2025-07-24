# HireBench

**Resume Screening Platform**

---

## 📖 Overview

**HireBench** is a full-stack web application designed to streamline and automate the resume screening process for recruiters and administrators. It provides powerful tools for managing users, job postings, and candidate resumes, helping organizations efficiently filter and track applications.

---

## 🚀 Features

- **User Roles & Dashboards**

  - **Admin**: Manage global users, job listings, resumes; ban users; clean orphan data.
  - **Recruiter**: Create, update, delete job postings; view and track candidate applications.
  - **Candidate**: (Coming soon) Submit resumes; view application status.

- **Resume CRUD Operations**

  - Semantic routing (e.g., `GET /api/resumes/:resumeId`, `POST /api/resumes`).
  - Placeholder URLs for development (e.g., `https://example.com/resume.pdf`).

- **Application Tracking**

  - Routes include semantic parameters (`:jobId`, `:userId`, `:applicationId`).
  - `appliedAt` timestamp for applications instead of `createdAt`.

- **Tech Stack**

  - **Backend**: Node.js, Express, MongoDB
  - **Frontend**: EJS (legacy) → React (in progress)
  - **Deployment**: TBD (Heroku / Vercel / AWS)

- **Future Plans**

  - Integrate ML-based resume scoring and filtering.
  - Add candidate self-service dashboard.
  - Enhance UI/UX and real-time notifications.

---

## 💻 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/UddhavNagar/hireBench.git
   cd hireBench
   ```

2. **Install dependencies**

   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. **Configure environment variables** Create a `.env` file in the root of the `backend` directory:

   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. **Run the application**

   ```bash
   # Backend
   cd backend
   npm run dev

   # Frontend
   cd ../frontend
   npm start
   ```

Application should now be running at `http://localhost:3000` (frontend) and `http://localhost:5000` (backend API).

---

## ⬆️ Upload README to GitHub

1. Save this content in a file named `README.md` inside your project root directory (`hireBench/`).

2. Open terminal or Git Bash, and run the following commands:

   ```bash
   git add README.md
   git commit -m "Add README file"
   git push origin main
   ```

> 📌 Make sure you're on the correct branch (usually `main` or `master`).

This will upload the README to your GitHub repository and display it automatically on your repo’s homepage.

---

## 🛠️ API Endpoints

### Auth

- `POST /api/auth/register` – Register a new user
- `POST /api/auth/login` – Login and receive JWT

### Admin (protected, `role=admin`)

- `GET /api/users` – List all users
- `PUT /api/users/:userId/ban` – Ban/Unban a user
- `DELETE /api/users/:userId` – Remove a user
- `GET /api/jobs` – List all jobs
- `DELETE /api/jobs/:jobId` – Remove job posting
- `DELETE /api/resumes/orphans` – Delete orphaned resumes

### Recruiter (protected, `role=recruiter`)

- `GET /api/jobs` – List own job postings
- `POST /api/jobs` – Create a new job
- `PUT /api/jobs/:jobId` – Update job details
- `DELETE /api/jobs/:jobId` – Delete job
- `GET /api/applications/job/:jobId` – View applications for a job

### Resumes

- `POST /api/resumes` – Upload/Create resume
- `GET /api/resumes/:resumeId` – Fetch resume metadata
- `PUT /api/resumes/:resumeId` – Update resume details
- `DELETE /api/resumes/:resumeId` – Delete resume

### Applications

- `POST /api/jobs/:jobId/apply` – Candidate applies to a job (uses `appliedAt`)
- `GET /api/applications/user/:userId` – View applications by candidate

---

## 🤝 Contributing

Contributions are welcome! Please fork the repo, create a feature branch, and open a pull request.

---

