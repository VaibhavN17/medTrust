# MedTrust ML Service - Fraud Detection

FastAPI-based microservice for AI-powered fraud detection in medical fundraising campaigns.

## 🚀 Quick Start

### Local Development

#### 1. Create Virtual Environment
```bash
cd ml-service
python -m venv venv

# Activate venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

#### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env if needed (defaults work for development)
```

#### 4. Run Development Server
```bash
uvicorn main:app --reload --port 8000
```

Visit: http://localhost:8000/docs (Swagger UI)

---

## 🐳 Docker Setup

### Build Image
```bash
docker build -t medtrust-ml-service .
```

### Run Container
```bash
docker run -p 8000:8000 \
  -e ENV=development \
  -e CORS_ORIGINS=http://localhost:5000 \
  medtrust-ml-service
```

---

## 📡 API Endpoints

### 1. Analyze Campaign
Detect fraud indicators in campaign text, amount, and description.

**POST** `/analyze-campaign`

```json
{
  "title": "Emergency heart surgery needed",
  "description": "My father needs open heart surgery urgently. We have medical reports from Apollo Hospital confirming the need for bypass surgery. Expected cost is around ₹5 lakhs.",
  "requested_amount": 500000,
  "medical_condition": "heart_disease"
}
```

**Response:**
```json
{
  "campaign_id": null,
  "fraud_risk_score": 0.15,
  "flagged": false,
  "factors": {
    "text_score": 0.15,
    "amount_score": 0.0,
    "length_score": 0.1,
    "red_flags": ["urgency"]
  },
  "description": "..."
}
```

---

### 2. Verify Document
Authenticate medical documents (PDF/Image).

**POST** `/verify-document`

```bash
curl -X POST "http://localhost:8000/verify-document" \
  -F "file=@medical_report.pdf" \
  -F "document_type=medical_report" \
  -F "campaign_id=1"
```

**Response:**
```json
{
  "campaign_id": 1,
  "file_name": "medical_report.pdf",
  "is_authentic": true,
  "confidence": 0.92,
  "warnings": [],
  "document_type": "pdf"
}
```

---

### 3. Detect Duplicate Accounts
Identify multiple accounts from same person.

**POST** `/detect-duplicates`

```json
{
  "users": [
    {
      "id": 1,
      "email": "john@gmail.com",
      "phone": "9876543210",
      "ip_address": "192.168.1.1",
      "created_at": "2024-01-01T10:00:00"
    },
    {
      "id": 2,
      "email": "john.doe@gmail.com",
      "phone": "9876543210",
      "ip_address": "192.168.1.1",
      "created_at": "2024-01-01T10:05:00"
    }
  ]
}
```

**Response:**
```json
{
  "has_duplicates": true,
  "suspicious_clusters": [
    {
      "pattern": "Multiple accounts from IP 192.168.1.1",
      "user_count": 2,
      "risk_score": 0.9,
      "user_ids": [1, 2]
    }
  ],
  "total_duplicates": 2
}
```

---

### 4. Detect Donation Patterns
Identify suspicious donation behavior.

**POST** `/detect-donation-patterns`

```json
{
  "campaign_id": 1,
  "donations": [
    {
      "id": 1,
      "campaign_id": 1,
      "donor_id": 10,
      "amount": 50000,
      "timestamp": "2024-01-15T10:00:00"
    },
    {
      "id": 2,
      "campaign_id": 1,
      "donor_id": 11,
      "amount": 5000000,
      "timestamp": "2024-01-15T10:30:00"
    }
  ]
}
```

**Response:**
```json
{
  "campaign_id": 1,
  "is_suspicious": true,
  "anomalies": [
    {
      "type": "amount_outlier",
      "donation_id": 2,
      "amount": 5000000,
      "z_score": 2.8
    }
  ],
  "donation_count": 2
}
```

---

## 🔌 Integration with Backend

Update `backend/src/controllers/fraudController.js`:

```javascript
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function analyzeCampaign(campaignData) {
  const response = await axios.post(`${ML_SERVICE_URL}/analyze-campaign`, {
    title: campaignData.title,
    description: campaignData.description,
    requested_amount: campaignData.requested_amount,
    medical_condition: campaignData.medical_condition,
    campaign_id: campaignData.id
  });
  
  return response.data;
}
```

Add to `backend/.env`:
```env
ML_SERVICE_URL=http://localhost:8000  # Local dev
# ML_SERVICE_URL=http://ml-service:8000  # Docker Compose
```

---

## 📊 Fraud Detection Logic

### Campaign Analysis Weights
- **Text Patterns (30%)** — Red flags in marketing language
- **Amount Verification (35%)** — Outlier detection vs. medical reality
- **Description Quality (25%)** — Length and detail assessment

### Risk Score Interpretation
| Score | Status | Action |
|-------|--------|--------|
| 0.0 - 0.3 | Low | Auto-approve |
| 0.3 - 0.7 | Medium | Manual review (optional) |
| 0.7 - 1.0 | High | Flag for review |

---

## 🛠️ Development

### Project Structure
```
ml-service/
├── main.py              # FastAPI app
├── utils/
│   └── fraud_detector.py   # Detection logic
├── models/              # Placeholder for future ML models
├── requirements.txt     # Python dependencies
├── Dockerfile          # Container setup
└── .env.example        # Environment template
```

### Adding New Detection Features

1. Add detection method to `utils/fraud_detector.py`
2. Create new endpoint in `main.py`
3. Add Pydantic model for request validation
4. Test via FastAPI Swagger UI (http://localhost:8000/docs)

---

## 📈 Performance

- Campaign Analysis: ~50ms
- Document Verification: ~200-500ms (depends on file size)
- Duplicate Detection: O(n) where n = user count
- Donation Pattern Analysis: O(m log m) where m = donation count

---

## 🔐 Security

- Input validation using Pydantic
- File size limits (max 10MB for documents)
- CORS protection
- Rate limiting (recommended to add)
- No sensitive data logged

---

## 🚀 Production Deployment

### Railway / Render

1. Push code to GitHub
2. Connect repo to Railway/Render
3. Set environment variables
4. Deploy

### AWS Lambda

Use container image for Lambda with API Gateway trigger.

### Docker Swarm / Kubernetes

```yaml
# docker-compose override for production
services:
  ml-service:
    image: medtrust-ml:latest
    environment:
      ENV: production
      CORS_ORIGINS: https://app.medtrust.in
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 2G
```

---

## 📝 License

MIT - Same as main MedTrust project
