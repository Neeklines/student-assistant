# 🤝 Contributing Guide – SmartSub

Welcome! This document explains **how we work with GitHub, code, and each other** in this project.

It is written step-by-step so even if you’ve never used Git/GitHub in a team — you’ll be fine 👍

---

# 🧭 TL;DR (Read This First)

* ❌ **Do NOT push directly to `master`**
* ✅ Always create a **new branch**
* 🔄 Keep your branch **up-to-date**
* ✅ Open a **Pull Request (PR)**
* ✅ Get **at least 1 approval**
* ✅ Pass **CI checks (lint + tests)**

---

# 🧠 Tech Overview (Developer Perspective)

This is NOT a repeat of README — this is what matters when coding.

## 🔗 Backend (FastAPI)

* All API routes are prefixed with: `/api`

Examples:

```
/api/auth/login
/api/health/
```

👉 If your endpoint does NOT start with `/api`, it's wrong.

---

## ⚛️ Frontend (React)

* Communicates with backend via HTTP
* Uses relative API calls like: `/api/...`

⚠️ In development:

* Proxy handles backend connection

⚠️ In production:

* Served under one domain (`neeklines.xyz`)
* `/api/*` → backend
* everything else → frontend

---

## 🗄️ Database

* **Dev:** SQLite
* **Prod:** MySQL

👉 Never hardcode DB-specific behavior unless necessary.

---

## 📁 Important Concepts

* Frontend = `frontend/`
* Backend = `backend/`
* API = contract between them → don’t break it casually

---

# 🔒 Branch Protection Rules (GitHub)

Default branch of this repo is `master`. Because of this, **special rules apply** to ensure not bracking easily our prod.

### 🔹 Require Pull Request before merging

All changes to default branch MUST go through a PR, which means NO direct pushes to `master`

### 🔹 Require approvals: 1

At least **one person must approve** your PR.

Keep in mind that: 
- You cannot approve your own final changes.
- If you push new commits → previous approvals are removed and reviewer must re-check your changes.

### 🔹 Require conversation resolution

All comments must be resolved before merging.

### 🔹 Require status checks to pass before merging

CI must pass before merge.

This includes:

* ✅ **Black (formatting)**
* ✅ **Flake8 (linting)**
* ✅ **Pytest (tests)**

---

### 🔹 Require branches to be up to date before merging

Your branch must be based on latest `master`.

---

# 🧹 Unenforced Rules (Team Discipline)

These are NOT enforced by GitHub — but we follow them.

---

## 🌿 Branch Hygiene

### Naming convention:

```
feature/short-description
fix/bug-name
chore/something
```

Examples:

```
feature/add-login
fix/api-error
chore/something
```

---

### Rules:

* One feature = one branch
* Don’t mix unrelated changes
* Delete local branch after merge (remote branch is deleted automatically after merge)

---

## 🧩 Issues

* Every bigger task should have an **Issue**
* PR should reference it:

```
Closes #12
```

---

## 🧼 Clean Code Rules

* No debug prints / console.logs
* No commented dead code
* Keep commits readable

---

# 🐍 Python Rules (Dependencies, Formatting, Tests)

This project enforces Python quality via CI.

---

## 📦 Dependencies (pip-tools)

We DO NOT edit `requirements.txt` manually.

### Files:

* `requirements.in` → you edit
* `requirements.txt` → generated

---

### ➕ Add dependency

```
requirements.in
```

Then:

```bash
pip-compile
```

---

### 📦 Install

```bash
pip install -r requirements.txt
```

---

### 🔄 Update all

```bash
pip-compile --upgrade
```

---

## 🎨 Formatting (Black)

* Code must be formatted with **black**

```bash
black .
```

---

## 🔍 Linting (Flake8)

* Code must pass lint checks

```bash
flake8
```

---

## 🧪 Testing (Pytest)

* Tests must pass before PR

```bash
pytest
```

---

## 🚨 Important

If CI fails:

* ❌ Your PR will NOT be merged
* ✅ Fix issues locally before pushing

---

# 🔄 Git Workflow


## 🟢 First Time (Getting Started)

### 1️⃣ Clone repo

```bash
git clone https://github.com/Neeklines/uni-web-app-pro.git
cd uni-web-app-pro
```

---

### 2️⃣ Create branch

```bash
git checkout -b feature/my-feature
```

---

### 3️⃣ Work & commit

```bash
git add .
git commit -m "Add: short description"
```

---

### 4️⃣ Push

```bash
git push origin feature/my-feature
```

---

### 5️⃣ Open PR

* Go to GitHub
* Create Pull Request
* Wait for review

---

## 🔄 Continuing Work (VERY IMPORTANT)

---

### 🔽 Update repo (fetch latest changes)

```bash
git fetch origin
```

---

### 🔄 Update `master`

```bash
git checkout master
git pull origin master
```

---

### 🔄 Update your branch

```bash
git checkout feature/my-feature
git rebase master
```

Then:

```bash
git push --force
```

---

## ⚠️ Rules About Rebase & Merge

### ✅ Rebase

* Used ONLY to update your branch with latest `master`

### ❌ Merge (locally)

* DO NOT use `git merge` for updating branches

### ✅ Merge (GitHub)

* Merge happens ONLY via Pull Request

---

# 🛠️ Development Environment Setup

Follow these steps to run the project locally.

---

## ⚛️ Frontend (React + Vite + Bun)

```bash
cd frontend
bun install
bun run dev
```

Frontend will run at:

```
http://localhost:5173
```

---

## 🔗 Backend (FastAPI)

```bash
cd backend
python -m venv venv
```

### Activate virtual environment

**Linux/macOS**

```bash
source venv/bin/activate
```

**Windows**

```bash
venv\Scripts\activate
```

---

### Install dependencies

```bash
pip install -r requirements.txt
```

---

### Run server

```bash
uvicorn app.main:app --reload
```

Backend will run at:

```
http://localhost:8000
```

---

## 🔌 Notes

* Frontend communicates with backend via `/api/*`
* Make sure both frontend and backend are running at the same time
* If something doesn’t work → check ports and `.env` configuration

---

# 💬 Final Notes

* Ask questions if unsure — don’t guess
* Small PRs > big PRs
* Keep things simple and consistent

---

This guide will evolve as the project grows 🚀
