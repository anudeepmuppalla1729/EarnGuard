\# EarnGuard: System Architecture \& Technical Specification



\---



\## 1. High-Level System Overview



EarnGuard operates on a decoupled, event-driven architecture designed for high availability and financial integrity. To ensure mobile responsiveness and handle the high-concurrency bursts associated with localized weather events, the system strictly separates the presentation layer, the orchestration layer, and the computational ML layer.



The architecture utilizes a \*\*Backend-for-Frontend (BFF)\*\* pattern combined with an \*\*Asynchronous Task Queue\*\* to isolate long-running or unreliable external operations from the user experience.



> \*\*The Prime Directive:\*\* The React Native client communicates exclusively with the API Gateway. The client must never bypass the gateway to interact directly with the ML engine, the database, or the mock data servers. This ensures a single point of entry for authentication, logging, and rate limiting.



\---



\## 2. Infrastructure Components \& Tech Stack



The system is distributed across six operational nodes to ensure fault tolerance and domain isolation.



\### 2.1 The Client Layer (React Native)

A lightweight presentation layer focused on user interaction and real-time alerts.

\* \*\*Framework:\*\* React Native (Expo Managed Workflow).

\* \*\*State Management:\*\* \*\*Zustand\*\* for global UI state; \*\*TanStack Query\*\* for server state management and request deduplication.

\* \*\*Real-Time Alerts:\*\* Firebase Cloud Messaging (FCM) SDK for background/foreground notifications.

\* \*\*Production Pattern:\*\* The client relies on "Optimistic Updates" via TanStack Query to maintain a snappy UI while awaiting gateway confirmation.



\### 2.2 The API Gateway \& Orchestrator (Node.js / Express)

The central nervous system. It manages business logic, session security, and service orchestration.

\* \*\*Core Tech:\*\* Node.js (LTS), Express, Axios.

\* \*\*Responsibility:\*\* Authenticates requests (JWT), interacts with PostgreSQL for relational data, and aggregates data from the ML and Mock servers to provide UI-ready JSON.



\### 2.3 The Asynchronous Task Engine (Redis + BullMQ)

The engine driving the zero-touch parametric claims loop.

\* \*\*Core Tech:\*\* Redis (In-memory datastore), BullMQ.

\* \*\*Responsibility:\*\* Manages background cron jobs and ingestion workers. It ensures that disruption checks are retried with exponential backoff if a service (like the ML engine) is temporarily unavailable.



\### 2.4 The Inference Engine (Python / FastAPI)

An isolated internal service dedicated to high-performance model execution.

\* \*\*Core Tech:\*\* Python 3.11+, FastAPI, scikit-learn, XGBoost.

\* \*\*Security:\*\* Operates within a private network tier; inaccessible via public IP.

\* \*\*Responsibility:\*\* Performs stateless risk scoring and premium multiplier calculations.



\### 2.5 The External Data Simulator (Node.js / Express)

A secondary server used to simulate real-world environmental and platform conditions.

\* \*\*Responsibility:\*\* Exposes REST endpoints for simulated Weather (IMD), Platform Logs (Zepto/Blinkit), and News Sentiment.

\* \*\*Role:\*\* Essential for local development and deterministic testing of the claims trigger logic.



\### 2.6 The Database Layer (PostgreSQL \& MongoDB)

A polyglot persistence strategy to balance financial integrity with high-velocity logging.

\* \*\*PostgreSQL:\*\* Handles the \*\*Wallet Ledger\*\*, \*\*Policy States\*\*, and \*\*Auth Identity\*\* (ACID compliance).

\* \*\*MongoDB:\*\* Stores \*\*ML Inference Audits\*\*, \*\*FCM Notification Logs\*\*, and \*\*Worker Profiles\*\* (Hydrated from mocks).



\---



\## 3. Core Architectural Flows



\### Flow A: City-Wise Premium Calculation (Synchronous)

1\.  \*\*Request:\*\* React Native sends `POST /api/v1/coverage/quote` (workerId, zoneId, cityId).

2\.  \*\*Cache Verification:\*\* Node.js checks Redis for an existing city-level risk multiplier.

3\.  \*\*Inference Call:\*\* If no cache exists, Node.js calls the Python ML Server.

4\.  \*\*Computation:\*\* Python executes base premium models and returns the `cityRiskMultiplier`.

5\.  \*\*Assembly:\*\* Node.js calculates the final premium, saves the quote as a `DRAFT` policy in PostgreSQL, and returns the JSON.



\### Flow B: Event-Driven Parametric Claims (Asynchronous)

1\.  \*\*Ingestion:\*\* A BullMQ repeatable job fires every 5 minutes.

2\.  \*\*Aggregation:\*\* The worker fetches current weather and platform logs for all active zones via the Mock Server.

3\.  \*\*Risk Evaluation:\*\* Aggregated data is sent to the Python ML Server (`/v1/models/detect-disruption`).

4\.  \*\*Threshold Check:\*\* If `riskScore > threshold`:

&#x20;   \* \*\*Financial Transaction:\*\* The worker executes a PostgreSQL transaction inserting a `Claim` record and updating the \*\*Wallet Ledger\*\*.

&#x20;   \* \*\*Outbox Event:\*\* A notification event is added to the PostgreSQL `outbox\_events` table.

5\.  \*\*Notification:\*\* A background worker picks up the outbox event and triggers the FCM push to the relevant `zoneId` topic.



\---



\## 4. Primary Data Schema (PostgreSQL Core)



To ensure financial integrity, the schema utilizes a \*\*Double-Entry Ledger\*\* pattern.



| Table | Primary Fields | Responsibility |

| :--- | :--- | :--- |

| \*\*Workers\*\* | `id`, `email`, `zone\_id`, `platform` | Identity \& Regional mapping |

| \*\*Policies\*\* | `id`, `worker\_id`, `status` (DRAFT/ACTIVE), `premium` | Coverage lifecycle |

| \*\*Wallet\_Ledger\*\* | `id`, `worker\_id`, `amount`, `type` (PAYOUT/PREMIUM) | \*\*Immutable\*\* financial history |

| \*\*Claims\*\* | `id`, `policy\_id`, `payout\_amount`, `disruption\_type` | Record of triggered coverage |

| \*\*Outbox\_Events\*\* | `id`, `payload` (JSONB), `status` (PENDING/PROCESSED) | Cross-DB consistency (Postgres to Mongo/FCM) |



\---



\## 5. Architectural Trade-offs \& Rationale



\### 5.1 Redis \& BullMQ vs. Standard Cron

Standard `setTimeout` or local cron packages are memory-volatile. If the Node.js process restarts, active jobs are lost. BullMQ ensures persistence and allows us to scale ingestion workers independently of the API Gateway.



\### 5.2 City-Level Premium vs. Zone-Level

Calculating premiums per zone introduces unnecessary compute overhead and "price jitter" for users in neighboring streets. City-level pricing provides a stable actuarial baseline, while zone-level detection ensures the parametric trigger remains hyper-local and accurate.



\### 5.3 FCM vs. WebSockets

Delivery partners frequently background their apps to use GPS or delivery software. WebSockets die in the background. FCM leverages OS-level push notifications to guarantee delivery of payout alerts even when the app is not active, without the battery drain of a persistent TCP connection.



\### 5.4 The Ledger Pattern vs. Balance Column

Updating a single `balance` column is prone to race conditions and audit failures. The immutable ledger (`Wallet\_Ledger`) ensures that every Rupee can be traced back to a specific `claim\_id` or `policy\_id`, which is a non-negotiable standard for production financial systems.

