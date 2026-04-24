# Smart Agricultural IoT Data Analysis Platform

A comprehensive IoT ecosystem designed for smart agriculture, featuring real-time environmental monitoring, historical data analysis, automated device control, and AI-driven recommendations.

## 🚀 Overview

This project provides a full-stack solution for monitoring and managing greenhouse or agricultural environments. It integrates sensor telemetry (Temperature, Humidity, Light Intensity) with automated actuator responses (Fans, Pumps, LEDs) to maintain optimal growth conditions.

### Key Components
*   **Backend:** Node.js & Express API with TimescaleDB for high-performance time-series data management.
*   **Frontend:** React & TypeScript dashboard featuring real-time charts and intuitive controls.
*   **IoT Integration:** Seamless connectivity with Adafruit IO for hardware interaction.
*   **Intelligent Automation:** Automatic actuator triggers based on configurable environmental thresholds.

---

## 🛠 Technology Stack

### Backend
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** PostgreSQL with **TimescaleDB** extension (for telemetry hypertables).
*   **Authentication:** Base64-encoded token-based auth (extensible to JWT).
*   **Validation:** Custom middleware for request and telemetry data integrity.

### Frontend
*   **Framework:** React 18 (TypeScript)
*   **Build Tool:** Vite
*   **Styling:** Vanilla CSS with CSS Modules (MongoDB-inspired design system).
*   **Data Visualization:** Recharts for telemetry history.
*   **Icons:** Lucide-React.

---

## 🌟 Core Features

### 1. Real-Time Dashboard
*   **Live KPI Cards:** Instant view of the latest readings for Temperature, Humidity, and Light.
*   **Triple-Chart Monitoring:** Three distinct, aligned charts for simultaneous tracking of all metrics.
*   **Unified Filters:** Filter all charts by aggregation level (raw, minute, hour, day) and custom date ranges.

### 2. Device Operations & Automation
*   **Threshold Management:** Admins can configure "Ideal" and "Critical" ranges for every metric.
*   **Actuator Control:** Direct manual toggle of hardware (Pumps, Fans, LEDs) with optional timed overrides.
*   **Auto Mode:** Actuators trigger automatically when readings cross defined thresholds.
*   **Audit Logs:** Complete history of every device action and its trigger source.

### 3. Alerting & Insights
*   **Anomaly Detection:** System automatically generates alerts when metrics enter warning or critical zones.
*   **Smart Recommendations:** AI-driven insights suggesting specific actions (e.g., "Increase ventilation") based on current alerts.
*   **Alert Resolution:** Integrated workflow to acknowledge and resolve system notifications.

### 4. Data Portability
*   **CSV Export:** Secure export of historical telemetry data, including timestamps, metric names, and values, directly from the dashboard.

---

## 📁 Project Structure

### Backend (`backend/src/`)
*   `app.js`: Express application setup and middleware configuration.
*   `controllers/`: Request handlers for telemetry, actuators, alerts, and configurations.
*   `services/`: Core business logic, including Adafruit integration and telemetry persistence.
*   `database/`: SQL schemas, seed data, and TimescaleDB hypertable setup.
*   `middleware/`: Authentication, error handling, and input validation.
*   `utils/`: Shared constants and helper functions.

### Frontend (`frontend/src/`)
*   `features/`: Modularized feature logic (Dashboard, Alerts, Device Operations, Auth).
*   `components/`: Reusable UI primitives (Buttons, Cards).
*   `layouts/`: App-wide structural components (Header, Footer, Layout).
*   `services/`: Axios-based API client wrappers.
*   `styles/`: Global theme variables and typography.

---

## ⚙️ Getting Started

The platform is designed to be fully containerized. Using Docker is the **recommended and easiest way** to get the entire ecosystem running in a consistent environment.

### 🐳 Full Docker Setup (Recommended)

This method launches the Database (TimescaleDB), Backend API, and Frontend Dashboard simultaneously.

#### 1. Prerequisites
*   [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/) installed.
*   An [Adafruit IO](https://io.adafruit.com/) account (required for actuator control).

#### 2. Configure Environment Variables
Create a `.env` file in the **root directory** of the project. This file is used by Docker Compose to configure all services.

```env
# Adafruit IO Credentials
USER_ADA=your_adafruit_username
KEY_ADA=your_adafruit_aio_key

# Database (Optional - defaults shown)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DATABASE=smart_agriculture
```

#### 3. Launch the Platform
From the root directory, run:
```bash
docker compose up --build -d
```
*   `--build`: Ensures the latest code changes are built into the images.
*   `-d`: Runs the containers in detached (background) mode.

#### 4. Verify & Access
The platform will automatically initialize the database schema and seed data.
*   **Frontend Dashboard:** [http://localhost:8080](http://localhost:8080)
*   **Backend API:** [http://localhost:4000](http://localhost:4000)
*   **Database (Postgres):** `localhost:5432`

To check logs: `docker compose logs -f`
To stop the platform: `docker compose down`

---

### 🛠️ Manual Setup (Development)

If you need to run components individually for active development:

#### Backend
1.  Navigate to `/backend`: `cd backend`
2.  Install dependencies: `npm install`
3.  Ensure a PostgreSQL/TimescaleDB instance is running (e.g., `docker compose up -d db` from the root).
4.  Configure `.env` in the `/backend` folder.
5.  Start the dev server: `npm run dev`

#### Frontend
1.  Navigate to `/frontend`: `cd frontend`
2.  Install dependencies: `npm install`
3.  Set the API URL: Create a `.env` with `VITE_API_URL=http://localhost:4000/api/v1`
4.  Run the Vite dev server: `npm run dev`