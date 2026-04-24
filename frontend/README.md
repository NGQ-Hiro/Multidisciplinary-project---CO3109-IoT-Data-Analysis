# BACKEND API FOR FRONTEND USAGE

# Backend

Node.js backend for the Smart Agriculture IoT system.

This document explains:

- how the backend is organized
- what each folder is responsible for
- all implemented endpoints
- expected request formats and key behaviors
- runtime and environment setup

## 1. Tech Stack

- Runtime: Node.js (CommonJS)
- Framework: Express
- Database: PostgreSQL (Timescale-style schema)
- Driver: pg
- CORS: cors
- Environment: dotenv

## 2. Run and Setup

### 2.1 Install and run backend

```bash
npm install
npm run dev
```

Available scripts:

- `npm run dev` -> `node --watch src/server.js`
- `npm start` -> `node src/server.js`
- `npm test` -> placeholder script

### 2.2 Run database with Docker Compose

```bash
docker compose up -d
```

Stop database:

```bash
docker compose down
```

Schema source:

- `src/database/schema.sql`

Seed data source:

- `src/database/seed.sql`

### 2.3 Environment variables

Example values:

```env
NODE_ENV=development
PORT=3000
ALLOWED_ORIGIN=http://localhost:5173

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DATABASE=smart_agriculture

USER_ADA=your_adafruit_username
PASS_ADA=your_adafruit_password
KEY_ADA=your_adafruit_aio_key
```

Notes:

- Database config currently reads `POSTGRES_*` keys.
- Adafruit actuator publishing uses `KEY_ADA` first, then fallback basic auth via `USER_ADA` and `PASS_ADA`.

## 3. Folder Structure and Purpose

Core flow is Route -> Controller -> Service.

```text
backend/
	src/
		app.js                # Express app composition
		server.js             # HTTP server bootstrap
		config/               # Infrastructure config (Postgres)
		routes/               # Route definitions and middleware wiring
		controllers/          # Request/response orchestration
		services/             # Business logic + DB operations + integrations
		middleware/           # Validation, auth helpers, logger, error handler
		database/             # SQL schema and seed files
		utils/                # Shared constants and helper utilities
```

### Important service files

- `src/services/telemetry.service.js`
  - telemetry ingest and normalization
  - save to `telemetry_events`
  - query latest rows directly from `telemetry_events`
  - threshold evaluation and alert creation
  - auto actuator decision and trigger
- `src/services/actuator.service.js`
  - list actuators
  - switch actuator status/mode
  - handle manual override protection
  - write actuator logs
  - publish actuator command result metadata
- `src/services/adafruit.service.js`
  - publish actuator command to Adafruit endpoint
  - feed mapping: `pump -> motor`, `fan -> fan`, `led -> led`
  - command mapping: `ON -> "1"`, `OFF -> "0"`

## 4. Endpoint Catalog

Base paths:

- Health: `/health`
- API v1: `/api/v1`

### 4.1 System and Health

| Method | Endpoint        | Purpose                                              |
| ------ | --------------- | ---------------------------------------------------- |
| GET    | `/`             | Backend running message                              |
| GET    | `/health/live`  | Liveness check                                       |
| GET    | `/health/ready` | Readiness check (includes postgres dependency state) |
| GET    | `/api/v1`       | API v1 availability message                          |

### 4.2 Auth

| Method | Endpoint             | Purpose                        |
| ------ | -------------------- | ------------------------------ |
| POST   | `/api/v1/auth/login` | Login and return token payload |

Request body (typical):

```json
{
  "username": "admin",
  "password": "admin",
  "role": "admin"
}
```

### 4.3 Telemetry

| Method | Endpoint                             | Purpose                                        |
| ------ | ------------------------------------ | ---------------------------------------------- |
| POST   | `/api/v1/telemetry/adafruit-webhook` | Main telemetry ingest endpoint                 |
| GET    | `/api/v1/telemetry/latest`           | Latest telemetry values                        |
| GET    | `/api/v1/telemetry/history`          | Historical telemetry with optional aggregation |

Webhook routing note:

- Unified endpoint: `/api/v1/telemetry/adafruit-webhook`
- Legacy alias `/api/v1/adafruit-webhook` is removed.

Validation for ingest:

- required body fields: `feed_key`, `value`
- `value` must be numeric

History query params:

- `metric` optional
- `user_id` optional
- `start` optional ISO datetime
- `end` optional ISO datetime
- `aggregate` optional: `none`, `minute`, `hour`, `day`, `month`, `year`

### 4.4 Alerts

| Method | Endpoint                       | Purpose                |
| ------ | ------------------------------ | ---------------------- |
| GET    | `/api/v1/alerts`               | List alerts + summary  |
| POST   | `/api/v1/alerts/read/:alertId` | Mark alert as resolved |

### 4.5 Configurations

| Method | Endpoint                 | Purpose                      |
| ------ | ------------------------ | ---------------------------- |
| GET    | `/api/v1/configurations` | Get threshold configurations |
| PUT    | `/api/v1/configurations` | Create/update thresholds     |

Validation for save:

- required: `metric_name`, `ideal_min`, `ideal_max`, `critical_min`, `critical_max`
- all threshold values must be numeric

### 4.6 Actuators

| Method | Endpoint                       | Purpose                 |
| ------ | ------------------------------ | ----------------------- |
| GET    | `/api/v1/actuators`            | List actuator devices   |
| POST   | `/api/v1/actuators/:id/toggle` | Manual actuator control |
| GET    | `/api/v1/actuators/logs`       | Actuator action logs    |

Toggle body:

```json
{
  "action": "ON",
  "duration_min": 10
}
```

Validation:

- `action` must be `ON` or `OFF`
- `duration_min` must be numeric when provided

### 4.7 Recommendations

| Method | Endpoint                          | Purpose                   |
| ------ | --------------------------------- | ------------------------- |
| GET    | `/api/v1/recommendations/latest`  | Get latest recommendation |
| POST   | `/api/v1/recommendations/refresh` | Regenerate recommendation |

### 4.8 Export

| Method | Endpoint             | Purpose                 |
| ------ | -------------------- | ----------------------- |
| GET    | `/api/v1/export/csv` | Export telemetry to CSV |

## 5. Detailed API Reference

This section explains what each endpoint does, what data it needs, and what backend logic runs behind it.

### 5.1 `POST /api/v1/telemetry/adafruit-webhook`

Purpose:

- ingest telemetry coming from Adafruit webhook or from a load balancer forwarding Adafruit payloads
- normalize metric/value data
- store telemetry into `telemetry_events`
- keep telemetry in `telemetry_events` only; latest values are read directly from that table
- create alerts if threshold is violated
- auto-trigger actuator action when rule conditions match

Required body:

- `feed_key` - required, identifies the metric feed
- `value` - required, must be numeric

Optional body:

- `device_code` - device code used to link telemetry to a device
- `device_id` - explicit device ID if available
- `created_at` - timestamp of the reading
- `user_id` - owner/user reference used for alert attribution
- `metric` / `feedKey` / `key` - alternate metric identifiers accepted by service normalization

Example payload:

```json
{
  "feed_key": "temp-test1",
  "value": 32.5,
  "device_code": "edge-01",
  "created_at": "2026-04-23T10:30:00Z"
}
```

What backend does:

1. Validates that `feed_key` exists and `value` is numeric.
2. Normalizes the metric to code `0`, `1`, or `2`.
3. Resolves the target device using `device_id`, `device_code`, or fallback `edge-01`.
4. Inserts a row into `telemetry_events`.
5. Stores telemetry only in `telemetry_events`; the latest reading is derived from that table.
6. Compares the value against configuration thresholds.
7. Inserts an alert when needed.
8. Applies auto control logic and can trigger an actuator internally.

### 5.2 `GET /api/v1/telemetry/latest`

Purpose:

- fetch the latest telemetry values for one metric or all metrics

Query params:

- `metric` - optional, metric filter (`0`, `1`, `2`, or aliases like `temperature`, `humidity`, `light`)
- `user_id` or `userId` - optional, filters results by device owner

Example:

```bash
GET /api/v1/telemetry/latest?metric=0&user_id=1
```

What backend does:

1. Normalizes the metric filter.
2. Queries the latest row per device + metric.
3. Returns formatted latest values with `device_code` and timestamp.

### 5.3 `GET /api/v1/telemetry/history`

Purpose:

- return historical telemetry with optional aggregation

Query params:

- `metric` - optional metric filter
- `user_id` - optional owner filter
- `start` - optional ISO datetime
- `end` - optional ISO datetime
- `aggregate` - optional bucket size: `none`, `minute`, `hour`, `day`, `month`, `year`
- `granularity` - alias accepted by controller/service for aggregation

Example:

```bash
GET /api/v1/telemetry/history?metric=0&aggregate=hour&start=2026-04-21T00:00:00Z&end=2026-04-23T23:59:59Z
```

What backend does:

1. Validates the date range and aggregate value.
2. Uses the default range of the last 3 days when `start`/`end` are not provided.
3. Filters telemetry by metric and device ownership (when `user_id` is provided).
4. Returns raw rows directly from `telemetry_events` when `aggregate=none`.
5. Returns time-bucketed averages when aggregation is enabled.

Returned history fields:

- `metric_name`
- `metric`
- `label`
- `timestamp`
- `value`
- `device_id`
- `aggregate` (only when aggregation is enabled)

### 5.4 `GET /api/v1/alerts`

Purpose:

- list alert history and current alert summary

Query params currently read by controller:

- `status` - optional, `open` or `resolved`

What backend does:

1. Reads alerts from `alerts` table.
2. Returns a `data` array plus `summary` object.
3. Summary includes latest values and count of open alerts.

Note:

- The service layer can also filter by severity and metric, but the current controller only forwards `status`.

### 5.5 `POST /api/v1/alerts/read/:alertId`

Purpose:

- mark an alert as resolved

Path param:

- `alertId` - required

Optional body:

- `user_id` or `userId` - resolver identity, defaults to `1`

What backend does:

1. Updates `alerts.is_resolved` to `true`.
2. Sets `resolved_by` and `resolved_at`.
3. Returns the updated alert row.

### 5.6 `GET /api/v1/configurations`

Purpose:

- fetch all threshold configurations

What backend does:

1. Reads rows from `configurations`.
2. Returns metric thresholds as stored in DB.

### 5.7 `PUT /api/v1/configurations`

Purpose:

- create or update metric thresholds

Required body:

- `metric_name` - required, metric code or alias
- `ideal_min` - required numeric
- `ideal_max` - required numeric
- `critical_min` - required numeric
- `critical_max` - required numeric

Optional body:

- `user_id` - used as `created_by` / `updated_by` fallback
- `created_by`, `updated_by` - explicit user references
- `device_id` - optional device-specific config

Example payload:

```json
{
  "metric_name": 0,
  "ideal_min": 20,
  "ideal_max": 30,
  "critical_min": 10,
  "critical_max": 36,
  "user_id": 1
}
```

What backend does:

1. Normalizes metric name to `0`, `1`, or `2`.
2. Validates that thresholds are numeric and logically ordered.
3. Inserts a new configuration row or updates an existing one.

### 5.8 `GET /api/v1/actuators`

Purpose:

- list all actuator devices

What backend does:

1. Reads actuator rows from `devices` where `actuator_type` is not null.
2. Returns device code, name, type, status, mode, and manual override expiry.

### 5.9 `POST /api/v1/actuators/:id/toggle`

Purpose:

- manually turn an actuator on or off

Path param:

- `id` - actuator device code or actuator type

Required body:

- `action` - must be `ON` or `OFF`

Optional body:

- `duration_min` - numeric manual override duration in minutes
- `user_id` or `userId` - user performing the action
- `actor` - default manual source label

Example payload:

```json
{
  "action": "ON",
  "duration_min": 10,
  "user_id": 1,
  "actor": "manual"
}
```

What backend does:

1. Validates the action and duration.
2. Updates `devices.status`, `devices.operating_mode`, and `manual_override_until`.
3. Writes an `actuator_logs` row with `trigger_source = manual`.
4. Publishes command to Adafruit feed using `1` for ON or `0` for OFF.
5. Returns publish status in the response payload.

### 5.10 `GET /api/v1/actuators/logs`

Purpose:

- fetch actuator action history

What backend does:

1. Reads from `actuator_logs` joined with `devices`.
2. Returns action time, trigger source, resulting status, and notes.

### 5.11 `GET /api/v1/recommendations/latest`

Purpose:

- get the latest recommendation row

What backend does:

1. Reads latest row from `recommendations`.
2. If no row exists, generates a new one from current open alert state.

Note:

- This service currently has a schema alignment issue with the SQL file and should be treated as a follow-up area.

### 5.12 `POST /api/v1/recommendations/refresh`

Purpose:

- regenerate recommendation content from the latest open alert state

What backend does:

1. Reads unresolved alerts.
2. Builds a recommendation message.
3. Inserts a new recommendation row.

### 5.13 `GET /api/v1/export/csv`

Purpose:

- export telemetry data as CSV

Query params accepted by service:

- `metric`
- `start`
- `end`
- `granularity`

What backend does:

1. Reads telemetry history.
2. Formats rows into CSV lines.
3. Sends CSV with attachment headers.

## 6. Data Flow Summary

### 6.1 Telemetry ingest flow

1. Request hits webhook endpoint.
2. Validation middleware checks payload.
3. Controller forwards to telemetry service.
4. Service normalizes metric and payload shape.
5. Service inserts into `telemetry_events`.
6. Service writes to `telemetry_events`; latest readings are derived from the same table.
7. Service evaluates thresholds and creates alerts if needed.
8. Service may trigger auto actuator action.

### 6.2 Manual actuator flow

1. Request hits toggle endpoint.
2. Validation middleware checks action payload.
3. Service updates actuator state and mode in DB.
4. Service writes action to `actuator_logs`.
5. Service publishes command to Adafruit (`1` or `0`) using mapped feed.

### 6.3 Automatic actuator flow

Auto mapping currently implemented:

- metric 0 (temperature) -> `fan`
- metric 1 (humidity) -> `pump`
- metric 2 (light) -> `led`

Auto decision currently implemented:

- if `value > ideal_max` then `ON`
- else `OFF`

Manual override protection:

- if actuator is in `MANUAL` mode and `manual_override_until` is still active, auto action is skipped and logged.

### 6.4 Webhook Configuration (Unified)

- Only one telemetry webhook endpoint is exposed in API v1: `POST /api/v1/telemetry/adafruit-webhook`.
- Configure load balancer / Adafruit webhook integrations to use this endpoint.

## 7. Error Handling and Response Behavior

- Global 404 handler returns route-not-found payload.
- Global error handler is mounted last in app.
- Async handlers are wrapped by `asyncHandler` middleware.
- Many endpoints return `{ data: ... }`; some status/error responses include `message` and `success` fields.

## 8. Current Limitations and Follow-ups

- Auth middleware exists but is not currently applied on v1 routes.
- Login token format and `authenticate` decoding logic should be aligned.
- Recommendation service schema expectations should be aligned with current SQL schema.
- End-to-end test suite is not yet configured.
- Telemetry is now stored in a single Timescale table (`telemetry_events`); latest values are read with `DISTINCT ON` instead of a separate cache table.

## 9. Telemetry Timescale Table (Minimal)

The `telemetry_events` hypertable keeps only required fields:

- `id`
- `device_id`
- `metric_name`
- `value`
- `recorded_at`

Note:

- The redundant `source` column is removed from schema and write/query paths.

# FRONTEND

This frontend should be documented as the user-facing layer over the backend API. The app can stay organized as a small set of pages, but each page should map directly to the backend contract described above.

## 1. Suggested Frontend Pages

### 1.1 Authentication

- Login page
- Uses `POST /api/v1/auth/login`
- Submits username, password, and role

### 1.2 Overview Dashboard

- Main dashboard page with KPI cards and trend charts
- Includes history charts with filter range support (metric, user, start/end, aggregation, refresh (auto or manual))
- Uses `GET /api/v1/telemetry/latest` for latest KPI values
- Uses `GET /api/v1/telemetry/history` for history, filter range, and time-series chart views
- Uses `GET /api/v1/export/csv` for export actions

### 1.3 Alerts

- Alert list page and resolution flow
- Uses `GET /api/v1/alerts`
- Uses `POST /api/v1/alerts/read/:alertId` to mark an alert as resolved

### 1.4 Configurations And Actuators

- Combined operations page for threshold configuration and actuator control
- Threshold configuration section
- Uses `GET /api/v1/configurations`
- Uses `PUT /api/v1/configurations` to create or update thresholds
- Actuator control section for pumps, fans, and LEDs
- Uses `GET /api/v1/actuators`
- Uses `POST /api/v1/actuators/:id/toggle` for manual control
- Uses `GET /api/v1/actuators/logs` for actuator history

### 1.5 Recommendations

- Recommendation page for the latest suggested action
- Uses `GET /api/v1/recommendations/latest`
- Uses `POST /api/v1/recommendations/refresh` when a new recommendation is needed

## 2. Frontend To Backend Mapping

### 2.1 Shared request shapes

- Telemetry ingest expects `feed_key` and `value`, with optional `device_code`, `device_id`, `created_at`, and `user_id`
- Actuator toggle expects `action` and optional `duration_min`, `user_id`, and `actor`
- Configuration save expects `metric_name`, `ideal_min`, `ideal_max`, `critical_min`, and `critical_max`

### 2.2 Shared query parameters

- Telemetry history supports `metric`, `user_id`, `start`, `end`, `aggregate`, and `granularity`
- Latest telemetry supports `metric` and `user_id` or `userId`
- Alerts currently support `status` (`open` or `resolved`)
- CSV export supports `metric`, `start`, `end`, and `granularity`

### 2.3 Response expectations

- Most endpoints return JSON with a `data` field, and some include `summary`, `message`, `success`, or `error`
- Frontend views should treat telemetry, alerts, configurations, actuators, and recommendations as read-through API data, not locally cached source of truth

### 2.4 Endpoint behavior notes

- Telemetry ingest is available at both `POST /api/v1/telemetry/adafruit-webhook` and alias `POST /api/v1/adafruit-webhook`
- `GET /api/v1/alerts` returns both `data` and `summary`
- `GET /api/v1/export/csv` returns file content (`text/csv`), not JSON

## 3. Frontend Responsibilities

- Render the backend data in page-specific views
- Forward user actions to the matching API endpoint
- Show loading, empty, and error states for every backend call
- Keep all business rules such as threshold logic, alert creation, and auto actuator decisions on the backend

## 4. Current Frontend Scope

- The current app shell is still the default Vite starter, so this section defines the target documentation and page map rather than an implemented production UI
