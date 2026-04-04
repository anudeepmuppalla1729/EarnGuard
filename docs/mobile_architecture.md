# EarnGuard Mobile Architecture

This document outlines the frontend architecture and state management of the EarnGuard mobile application.

---

## Tech Stack

The mobile application is built with **React Native (Expo)** using **TypeScript**.

### Key Technologies

| Technology | Purpose |
|------------|---------|
| **Zustand** | Global state management with shared stores. |
| **Axios** | HTTP client with global interceptors. |
| **React Navigation** | Stack and Tab based navigation. |
| **Lucide Icons** | Vector icons for premium UI look. |
| **Expo Secure Store** | Safe storage of JWT access tokens and user credentials. |

---

## State Management (Zustand)

EarnGuard adopts a store-based architecture for managing state across multiple screens.

### 1. `authStore.ts`
- **Responsibility**: Manages user lifecycle (Login, Signup, JWT persistence).
- **Functionality**:
    - `signIn()`: Authenticates worker and stores token.
    - `signUp()`: Registers worker and maps them to a platform worker ID via the backend.
    - `signOut()`: Clears all stores and secure storage.

### 2. `policyStore.ts`
- **Responsibility**: Policy lifecycle management.
- **Functionality**:
    - `fetchQuotes()`: Fetches live ML-calculated quotes for a city.
    - `activatePolicy()`: Triggers the payment-to-activation flow.
    - `activePolicy`: The single source of truth for the worker's current coverage.

### 3. `walletStore.ts` & `claimStore.ts`
- **Responsibility**: Real-time balance and payout status.
- **Functionality**:
    - Syncs with the backend to show historical payouts from automated disruptions.

---

## Communication Architecture (Axios)

The application communicates with the main backend via a centralized **`api/client.ts`**.

### Interceptors
The client uses an **interceptor-based security model**:
- **Request Interceptor**: Automatically attaches the `Authorization: Bearer <TOKEN>` header from Secure Store to every outgoing request.
- **Response Interceptor**: Handles 401 Unauthorized errors by automatically logging out the user if the token has expired.

---

## UI/UX Design Philosophy

EarnGuard uses a **Premium Bento-Grid interface** with rich micro-interactions.

### Key Screens

| Screen | Design Goal |
|--------|-------------|
| **Dashboard** | High-level summary of active protection and immediate notification of recent claims. |
| **Policy Selection** | Tier-based card carousel showing clear ML pricing breakdowns. |
| **Bank Selection** | Mock-integrated payment flow with real-time debit simulation. |
| **Profile** | Clean summary of workers' platform identities and verification status. |

> [!TIP]
> The mobile app is designed to be "passive". Once a policy is activated, the worker should not need to interact with the app; the system automatically senses disruptions and pushes claim notifications to the dashboard.
