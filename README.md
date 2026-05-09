# Project Assignment System

A role-based web application backed by MySQL. Admins create projects, manually assign tasks to members, members submit work, and admins score submissions.

---

## Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Database | MySQL 8+                          |
| Backend  | Node.js + Express                 |
| Auth     | bcrypt + express-session          |
| Frontend | HTML + CSS + Vanilla JS           |

---

## Folder Structure

```
project-assignment-system/
├── package.json
├── README.md
├── db/
│   ├── schema.sql        ← 5 tables
│   ├── triggers.sql      ← (triggers removed — handled in app)
│   ├── views.sql         ← 3 views
│   └── seed.sql          ← admin + 200 company members
├── server/
│   ├── index.js          ← Express entry point
│   ├── db.js             ← MySQL connection pool
│   ├── routes/
│   │   ├── auth.js       ← login / logout / me
│   │   ├── admin.js      ← projects, tasks, scoring
│   │   └── user.js       ← projects, tasks, submit
│   └── middleware/
│       └── auth.js       ← role-check middleware
└── client/
    ├── shared.css
    ├── login.html
    ├── admin/
    │   ├── projects.html
    │   └── project-detail.html
    └── user/
        ├── dashboard.html
        └── task.html
```

---

## Setup

### 1. Database — run in MySQL Workbench in order

```
db/schema.sql
db/views.sql
db/seed.sql
```

> Note: No triggers are used. Task status updates are handled in the backend.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure DB password

Open `server/db.js` and set your MySQL root password:

```js
password: process.env.DB_PASSWORD || 'YOUR_MYSQL_PASSWORD_HERE',
```

### 4. Start the server

```bash
npm start        # production
npm run dev      # auto-reload with nodemon
```

Open **http://localhost:3000**

---

## Seed Accounts

| Role  | Email                  | Password  |
|-------|------------------------|-----------|
| Admin | alice@example.com      | admin123  |

### 200 Company Members (password: admin123)

| Specialisation | Count | Example Email |
|---------------|-------|---------------|
| frontend      | 25    | aarav.sharma@company.com |
| backend       | 25    | amit.pandey@company.com |
| design        | 20    | aishwarya.iyer@company.com |
| devops        | 20    | rajan.pillai@company.com |
| ml            | 20    | sachin.bhat@company.com |
| qa            | 20    | mona.tiwari@company.com |
| android       | 20    | faiz.patil@company.com |
| ios           | 15    | zeenat.babu@company.com |
| data          | 15    | omveer.rajan@company.com |
| security      | 10    | darshan.patel@company.com |

---

## How It Works

1. **Admin logs in** → creates a project with a required specialisation
2. **Admin opens project** → assigns tasks manually to members via dropdown
3. **Members log in** → see their assigned projects and tasks
4. **Member opens task** → submits work (textarea)
5. **Task status** automatically changes to `submitted`
6. **Admin scores** the submission (0–100)
7. **Task status** changes to `scored`

> No auto-assignment triggers. Everything is manual and controlled by the admin.

---

## API Reference

### Auth
| Method | Route           | Description          |
|--------|-----------------|----------------------|
| POST   | /api/auth/login | Login, returns role  |
| POST   | /api/auth/logout| Clear session        |
| GET    | /api/auth/me    | Current session info |

### Admin
| Method | Route                            | Description                        |
|--------|----------------------------------|------------------------------------|
| GET    | /api/admin/projects              | All own projects                   |
| POST   | /api/admin/projects              | Create project                     |
| GET    | /api/admin/projects/:id          | Project detail with members/tasks  |
| POST   | /api/admin/tasks                 | Assign task to member              |
| PATCH  | /api/admin/submissions/:id/score | Score a submission                 |

### User
| Method | Route                      | Description       |
|--------|----------------------------|-------------------|
| GET    | /api/user/projects         | Assigned projects |
| GET    | /api/user/tasks/:id        | Task detail       |
| POST   | /api/user/tasks/:id/submit | Submit work       |

---

## Specialisations

When creating a project, use one of these exact values in the **Required Specialisation** field:

`frontend` · `backend` · `design` · `devops` · `ml` · `qa` · `android` · `ios` · `data` · `security`

The task assignment dropdown will show all members with that specialisation.
