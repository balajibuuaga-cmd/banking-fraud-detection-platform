# FraudOps Banking Fraud Detection Platform

FraudOps is an enterprise-style banking fraud detection and investigation platform built with Spring Boot, React, PostgreSQL, Kafka, Docker, and Material UI.

## Architecture

- React dashboard connects to a secured Spring Boot API.
- Spring Security protects API routes with JWT authentication and role-based access control.
- PostgreSQL stores users, accounts, transactions, fraud alerts, fraud cases, fraud rules, and audit logs.
- Kafka supports event-driven fraud alert workflows.
- Docker Compose runs PostgreSQL, Kafka, Zookeeper, and the backend stack locally.
- GitHub Actions builds backend and frontend on pull requests and pushes.

## Features

- Fraud operations dashboard with KPI cards, alert trends, severity analytics, and live activity.
- Fraud alerts table with filtering, pagination, CSV export, bulk actions, and case creation.
- Investigation work queue and case details workflow.
- Customer 360 risk profile with accounts, transactions, risk summary, and PDF export.
- Fraud Rules Engine for admin-managed fraud detection rules.
- PaySim CSV dataset import pipeline.
- Audit Trail, Notification Center, System Health, Fraud Map, and AI Copilot-style assistant.
- Dark mode, responsive navigation, and Material UI DataGrid pages.

## Tech Stack

- Backend: Java, Spring Boot, Spring Security, Spring Data JPA
- Frontend: React, Vite, Material UI, MUI DataGrid, Recharts
- Database: PostgreSQL
- Messaging: Kafka and Zookeeper
- Auth: JWT
- Deployment: Docker, Docker Compose, GitHub Actions, AWS EC2, Vercel

## Demo Login

Admin:

```text
email: import@test.com
password: password123
```

If that user does not exist in a fresh database, register an admin through `/api/auth/register`.

## How To Run Locally

Start infrastructure and backend:

```bash
docker compose up --build
```

Start the frontend:

```bash
cd web-dashboard
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Docker Setup

The root `docker-compose.yml` starts:

- PostgreSQL on `5432`
- Kafka on `9092`
- Kafka host listener on `29092`
- Zookeeper on `2181`
- Spring Boot backend on `8080`

Backend environment variables:

```text
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
SPRING_KAFKA_BOOTSTRAP_SERVERS
FRONTEND_ALLOWED_ORIGINS
```

For production, the backend uses `application-prod.properties` and reads database/Kafka settings from environment variables.

## Dataset Import

Admins can import PaySim CSV data from the UI at:

```text
/import
```

Or with curl:

```bash
curl -X POST http://localhost:8080/api/import/paysim \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/PS_20174392719_1491204439457_log.csv"
```

The import workflow creates transactions and routes high-risk records through the fraud detection pipeline.

## Deployment

### Backend on AWS EC2

Use Ubuntu EC2 and install Docker:

```bash
sudo apt update
sudo apt install docker.io docker-compose-plugin -y
sudo usermod -aG docker ubuntu
```

Clone the repository and start the stack:

```bash
git clone YOUR_GITHUB_REPO_URL
cd banking-fraud-risk-analytics-platform
docker compose up --build -d
```

Open EC2 security group ports:

```text
22    SSH
8080  Spring Boot backend
5173  Optional frontend testing
```

Backend URL:

```text
http://EC2_PUBLIC_IP:8080
```

### Frontend on Vercel

Set the frontend production API URL:

```text
VITE_API_URL=http://EC2_PUBLIC_IP:8080/api
```

In Vercel:

```text
New Project -> Import GitHub repo
Root Directory: web-dashboard
Build Command: npm run build
Output Directory: dist
```

Set backend CORS:

```text
FRONTEND_ALLOWED_ORIGINS=http://localhost:5173,https://YOUR-VERCEL-APP.vercel.app
```

Then rebuild the EC2 backend:

```bash
git pull
docker compose down
docker compose up --build -d
```

## Screenshots

Add dashboard, alerts, investigations, customer 360, and dataset import screenshots here after deployment.

## Deployment URL

```text
Frontend: https://YOUR-VERCEL-APP.vercel.app
Backend:  http://EC2_PUBLIC_IP:8080
```

## CI/CD

GitHub Actions workflow:

```text
.github/workflows/build.yml
```

The workflow builds:

- Backend with Maven
- Frontend with Vite
