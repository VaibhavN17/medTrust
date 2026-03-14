# MedTrust – Unified Donation Transparency System

> A full-stack platform where patients raise medical funds, NGOs verify campaigns, and donors track every rupee in real-time.

---

## 📁 Project Structure

```
medtrust/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js            ← MySQL connection pool
│   │   │   └── s3.js            ← AWS S3 file upload config
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── campaignController.js
│   │   │   ├── donationController.js
│   │   │   ├── expenseController.js
│   │   │   ├── ngoController.js
│   │   │   └── adminController.js
│   │   ├── middleware/
│   │   │   ├── auth.js          ← JWT verify + role guard
│   │   │   └── errorHandler.js  ← Global error handler
│   │   ├── routes/
│   │   │   └── index.js         ← All API routes
│   │   ├── utils/
│   │   │   └── mailer.js        ← Email notifications
│   │   └── server.js            ← Express entry point
│   ├── schema.sql               ← Complete MySQL schema
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                     ← Landing page
│   │   │   ├── layout.tsx                   ← Root layout
│   │   │   ├── globals.css                  ← Design system
│   │   │   ├── campaigns/
│   │   │   │   ├── page.tsx                 ← Campaign listing
│   │   │   │   ├── [id]/page.tsx            ← Campaign detail
│   │   │   │   └── new/page.tsx             ← Create campaign
│   │   │   ├── dashboard/
│   │   │   │   ├── patient/page.tsx         ← Patient dashboard
│   │   │   │   ├── donor/page.tsx           ← Donor dashboard
│   │   │   │   └── admin/page.tsx           ← Admin/NGO dashboard
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── components/
│   │   │   ├── layout/Navbar.tsx
│   │   │   └── campaign/
│   │   │       ├── CampaignCard.tsx
│   │   │       └── DonationModal.tsx
│   │   └── lib/
│   │       ├── api.ts           ← Axios instance
│   │       ├── store.ts         ← Zustand auth store
│   │       └── utils.ts         ← Helpers & formatters
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── .env.example
│
└── README.md
```

---

## ⚙️ Prerequisites

| Tool        | Version   |
|-------------|-----------|
| Node.js     | ≥ 18.x    |
| MySQL       | ≥ 8.0     |
| npm         | ≥ 9.x     |
| AWS Account | (for S3)  |
| Razorpay    | Test/Live keys |

---

## 🚀 Quick Start

### 1. Clone and install

```bash
git clone https://github.com/your-org/medtrust.git
cd medtrust

# Backend
cd backend
npm install
cp .env.example .env    # Fill in your values

# Frontend
cd ../frontend
npm install

cp .env.example .env.local    # Fill in your values
```

### 2. Set up MySQL

```bash
# Create database and tables (macOS/Linux/Git Bash)
mysql -u root -p < backend/schema.sql

# Windows PowerShell
Get-Content backend/schema.sql | mysql -u root -p
```

### 3. Configure environment variables

**`backend/.env`**
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=yourpassword
DB_NAME=medtrust

JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d

# local (recommended for dev) or s3
UPLOAD_PROVIDER=local
PUBLIC_API_URL=http://localhost:5000

AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=medtrust-docs

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@medtrust.in
SMTP_PASS=your_app_password
EMAIL_FROM="MedTrust <noreply@medtrust.in>"
```

If you are developing locally and do not have valid AWS keys, keep `UPLOAD_PROVIDER=local`.

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

### 4. Run development servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Visit: http://localhost:3000

---

## Docker Quick Start

### Run full stack with Docker Compose

```bash
# from project root
docker compose up -d --build
```

Services started:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MySQL: localhost:3306

### Stop services

```bash
docker compose down
```

### Stop and delete DB volume (fresh DB)

```bash
docker compose down -v
```

### Optional environment overrides for Docker

You can set these in your shell before running `docker compose up`:

- `MYSQL_ROOT_PASSWORD` (default: `root`)
- `MYSQL_DATABASE` (default: `medtrust`)
- `NEXT_PUBLIC_API_URL` (default: `http://localhost:5000/api`)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` (default: empty)

---

## 🔐 API Endpoints Reference

### Auth
| Method | Endpoint              | Auth | Description                  |
|--------|-----------------------|------|------------------------------|
| POST   | /auth/register        | ❌   | Register user                |
| POST   | /auth/login           | ❌   | Login + get JWT              |
| GET    | /auth/me              | ✅   | Get own profile              |
| PUT    | /auth/profile         | ✅   | Update name/avatar/phone     |
| PUT    | /auth/password        | ✅   | Change password              |

### Campaigns
| Method | Endpoint                              | Auth        | Description               |
|--------|---------------------------------------|-------------|---------------------------|
| GET    | /campaigns                            | ❌          | List (filter, search, sort)|
| GET    | /campaigns/:id                        | ❌          | Full campaign detail      |
| POST   | /campaigns                            | patient     | Create campaign           |
| PUT    | /campaigns/:id                        | patient/admin| Edit campaign            |
| GET    | /campaigns/mine                       | patient     | Own campaigns             |
| POST   | /campaigns/:id/documents              | patient     | Upload medical docs       |
| POST   | /campaigns/:id/updates                | patient/ngo | Post health update        |

### Donations
| Method | Endpoint                              | Auth    | Description               |
|--------|---------------------------------------|---------|---------------------------|
| POST   | /donations/order                      | donor   | Create Razorpay order     |
| POST   | /donations/verify                     | donor   | Verify payment signature  |
| GET    | /donations/mine                       | donor   | My donation history       |
| GET    | /campaigns/:id/donations              | ❌      | Campaign donor list       |

### Expenses (Transparency)
| Method | Endpoint                              | Auth        | Description               |
|--------|---------------------------------------|-------------|---------------------------|
| GET    | /campaigns/:id/expenses               | ❌          | List expenses + receipts  |
| POST   | /campaigns/:id/expenses               | patient/admin| Upload expense receipt  |

### NGO / Verification
| Method | Endpoint                              | Auth      | Description               |
|--------|---------------------------------------|-----------|---------------------------|
| GET    | /ngo/pending                          | ngo/admin | Pending campaigns queue   |
| POST   | /ngo/verify/:id                       | ngo/admin | Approve campaign          |
| POST   | /ngo/reject/:id                       | ngo/admin | Reject campaign           |
| POST   | /ngo/flag/:campaign_id                | ngo/admin | Flag for fraud            |

### Admin
| Method | Endpoint                              | Auth  | Description               |
|--------|---------------------------------------|-------|---------------------------|
| GET    | /admin/stats                          | admin | Platform statistics       |
| GET    | /admin/users                          | admin | All users                 |
| PUT    | /admin/users/:id/toggle               | admin | Enable/disable user       |
| GET    | /admin/campaigns                      | admin | All campaigns (any status)|
| GET    | /admin/fraud-flags                    | admin | Open fraud reports        |
| PUT    | /admin/fraud-flags/:id                | admin | Update fraud flag status  |

---

## 🗄️ Database Schema Overview

```
users              → All user accounts (patient/donor/ngo/admin)
  └── ngo_profiles → NGO organization details

campaigns          → Fundraising campaigns
  ├── documents    → Medical proof files (S3 URLs)
  ├── campaign_updates → Patient health updates
  └── ngo_verifications → NGO review records

donations          → Payment records (Razorpay)
expenses           → Expense receipts for transparency
fraud_flags        → Reported suspicious campaigns
notifications      → In-app notification log
```

---

## 💳 Razorpay Payment Flow

```
1. User clicks "Donate"
2. POST /donations/order  → Backend creates Razorpay order
3. Frontend opens Razorpay checkout popup
4. User completes payment
5. Razorpay calls handler with {order_id, payment_id, signature}
6. POST /donations/verify → Backend verifies HMAC signature
7. If valid: mark donation 'captured', update campaign total
8. Email receipt sent to donor
```

**Test Cards:**
- Card: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits

---

## ☁️ AWS S3 Setup

1. Create an S3 bucket in `ap-south-1` (Mumbai)
2. Enable versioning (recommended)
3. Set bucket policy to block all public access
4. Create IAM user with `AmazonS3FullAccess`
5. Generate Access Key ID + Secret

Files are stored as:
- `avatars/{uuid}.jpg`
- `covers/{uuid}.jpg`
- `documents/{uuid}.pdf`
- `receipts/{uuid}.pdf`
- `conf/{uuid}.pdf` (NGO hospital confirmations)

---

## 🎨 Frontend Pages

| Route                     | Description                        |
|---------------------------|------------------------------------|
| `/`                       | Landing page with hero, stats, CTA |
| `/campaigns`              | Browse + filter campaigns           |
| `/campaigns/[id]`         | Full campaign detail + donate       |
| `/campaigns/new`          | 4-step campaign creation wizard     |
| `/login`                  | Sign in                            |
| `/register`               | Create account (role selection)    |
| `/dashboard/patient`      | Patient: campaigns, expense upload  |
| `/dashboard/donor`        | Donor: donation history, receipts   |
| `/dashboard/admin`        | Admin/NGO: verify, stats, fraud    |

---

## 🔒 Security Features

- **JWT Authentication** — RS256 tokens, 7-day expiry
- **Role-based guards** — Every sensitive route protected
- **HMAC Payment Verification** — Razorpay signature validation
- **Rate Limiting** — 20 auth requests/15 min; 200 API/min
- **Helmet.js** — Security headers
- **File Validation** — Only PDF/JPG/PNG/WEBP allowed
- **Input Validation** — express-validator on all inputs
- **S3 Private ACL** — Files not publicly accessible via URL

---

## 📧 Email Notifications

Triggered automatically for:
- New user welcome
- Campaign approved/rejected
- Donation receipt

Uses Nodemailer with any SMTP provider (Gmail, SendGrid, Mailgun).

---

## 🚀 Production Deployment

### Backend (e.g. Railway / Render / EC2)
```bash
NODE_ENV=production npm start
```

### Frontend (Vercel — recommended)
```bash
cd frontend
vercel deploy --prod
```

Set all `NEXT_PUBLIC_*` env vars in Vercel dashboard.

### Database (PlanetScale / RDS)
- Point `DB_*` vars to your production MySQL host
- Run `schema.sql` once

---

## 🗺️ Development Roadmap

- [x] Phase 1 — Auth (JWT, roles)
- [x] Phase 2 — Campaigns (create, upload, list)
- [x] Phase 3 — Donations (Razorpay integration)
- [x] Phase 4 — Expense transparency (receipts, donor view)
- [x] Phase 5 — Admin/NGO verification panel
- [ ] Phase 6 — AI fraud detection (ML model)
- [ ] Phase 7 — Blockchain donation records (Ethereum)
- [ ] Phase 8 — Mobile app (React Native)

---

## 📄 License

MIT — free to use for personal and commercial projects.
