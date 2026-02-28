# NexusRide Payment System Documentation

## 1. Overview

The NexusRide Payment System has been re-architected to follow **Pattern A**, a robust financial transaction model where the **Payment Record** serves as the single source of truth for all service activations. This design ensures that no service (whether a Token or a Subscription) is ever provisioned without a confirmed, successful payment.

### 1.1 Key Architectural Principles

*   **Payment First**: Services are downstream dependencies of payments. No Token or Subscription is activated until a payment transitions to `SUCCESS`.
*   **Decoupled Logic**: The *Initiation* phase (creating a payment intent) is strictly separated from the *Confirmation* phase (finalizing the transaction and triggering side effects).
*   **Server-Side Control**: All critical logic—pricing, validation, and status transitions—resides on the backend. The frontend is treated as an untrusted client that only initiates requests and handles redirects.
*   **Atomic Transactions**: Service activation logic (e.g., creating a Token record, allocating a seat) is wrapped in the same database transaction as the payment status update. This guarantees **ACID** properties: either both happen, or neither happens.

### 1.2 Architecture Diagram

```mermaid
graph TD
    User[User] -->|1. Initiate Service| API[Backend API]
    API -->|2. Create Payment (INITIATED)| DB[(Database)]
    API -->|3. Return Payment URL| User
    User -->|4. Pay at Gateway| Gateway[Payment Gateway]
    Gateway -->|5. Callback/Redirect| API
    API -->|6. Verify & Confirm| DB
    DB -->|7. Update Payment Status| DB
    DB -->|8. Activate Service (Token/Sub)| DB
```

---

## 2. Database Changes (Part 1)

The database schema was updated to support this new architecture, primarily focusing on the `Payment` model to make it flexible enough to handle various payment types and methods.

### 2.1 Payment Model Upgrade (`app/models/payment.py`)

The `Payment` table is the core of this module.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key. |
| `user_id` | `UUID` | Foreign Key to `User`. The payer. |
| `amount` | `Decimal` | The amount to be charged. **Nullable: False**. |
| `currency` | `String` | Currency code, defaults to `BDT`. |
| `payment_method` | `Enum` | The selected channel (`BKASH`, `NAGAD`, `UPAY`). |
| `payment_type` | `Enum` | The category of purchase (`TOKEN`, `SUBSCRIPTION`). |
| `status` | `Enum` | Current state of the transaction. Default: `INITIATED`. |
| `reference_id` | `String` | ID of the target resource. <br>• For **Subscription**: The Subscription ID.<br>• For **Token**: Initially `NULL`, updated with Token ID after creation. |
| `reference_type` | `Enum` | Indicates what `reference_id` points to (`TOKEN`, `SUBSCRIPTION`). |
| `payment_metadata` | `JSON` | Stores temporary context needed for service activation (e.g., `route_id`, `trip_id` for tokens). Maps to DB column `metadata`. |
| `external_txn_id` | `String` | Transaction ID provided by the external gateway (e.g., Bkash TrxID). |
| `created_at` | `DateTime` | Timestamp of initiation. |
| `updated_at` | `DateTime` | Timestamp of last status change. |

### 2.2 Enums Introduced

Strict typing is enforced via Python Enums, stored as Strings in the database.

*   **`PaymentType`**:
    *   `TOKEN`: Single trip purchase.
    *   `SUBSCRIPTION`: Monthly pass.
*   **`PaymentMethod`**:
    *   `BKASH`
    *   `NAGAD`
    *   `UPAY`
*   **`PaymentStatus`**:
    *   `INITIATED`: Created, waiting for user action.
    *   `SUCCESS`: Confirmed received. Triggers service activation.
    *   `FAILED`: Gateway rejected or validation failed.
    *   `CANCELLED`: User aborted.
    *   `REFUNDED`: Admin reversed the transaction.

---

## 3. Payment APIs (Part 2)

The API layer (`app/api/payment.py`) exposes endpoints for the frontend and Transport Officers (TO).

### 3.1 Initiate Payment
*   **Endpoint**: `POST /payments/initiate`
*   **Purpose**: Creates a payment intent.
*   **Request Body**:
    ```json
    {
      "reference_type": "SUBSCRIPTION",
      "reference_id": "123",
      "payment_method": "BKASH"
    }
    ```
*   **Logic**:
    1.  Validates that `reference_type` matches the ID provided.
    2.  Calls `compute_amount()` to calculate price server-side.
    3.  Creates `Payment` record with status `INITIATED`.
*   **Response**: Payment object including a `payment_url` (mocked for now).

### 3.2 Confirm Payment
*   **Endpoint**: `POST /payments/{payment_id}/confirm`
*   **Purpose**: Finalizes the transaction.
*   **Request Body**:
    ```json
    {
      "status": "SUCCESS",
      "external_txn_id": "TrxID123456"
    }
    ```
*   **Logic**:
    1.  Verifies the payment belongs to the current user (or authorized role).
    2.  Checks that current status is `INITIATED` (Idempotency check).
    3.  Updates status and `external_txn_id`.
    4.  **Crucial Step**: If status is `SUCCESS`, it dynamically calls the appropriate activation function (`create_token_from_payment` or `activate_subscription_from_payment`).

### 3.3 My Payments
*   **Endpoint**: `GET /payments/me`
*   **Purpose**: User history.
*   **Filters**: `status`, `payment_type`, `payment_method`, `start_date`, `end_date`.
*   **Sorting**: Descending by `created_at`.

### 3.4 List Payments (TO Only)
*   **Endpoint**: `GET /payments`
*   **Purpose**: Administrative ledger.
*   **Security**: Requires `TO` role.
*   **Filters**: All user filters + `user_id`, `min_amount`, `max_amount`.
*   **Pagination**: Supported via `offset` and `limit`.

---

## 4. Token Flow (Part 3A)

The token purchase flow was completely refactored to eliminate the risk of "unpaid tokens."

### 4.1 The "Free Token" Problem (Solved)
Previously, calling `/token/buy` would immediately create a valid Token. If the user didn't pay, we had to clean up data.
**Now**, `/token/buy` does **NOT** create a Token. It creates a **Payment**.

### 4.2 New Workflow
1.  **User Request**: User calls `POST /token/buy` with trip details (`route_id`, `stop_id`, `date`).
2.  **Validation**: Backend checks Trip existence and Seat availability.
3.  **Payment Creation**:
    *   Price is calculated (e.g., 50 BDT).
    *   **Metadata Storage**: The trip details are serialized and stored in `payment.payment_metadata`.
    *   `reference_id` is left `NULL`.
    *   Payment is saved as `INITIATED`.
4.  **Confirmation & Activation**:
    *   User pays.
    *   `confirm_payment` is called with `SUCCESS`.
    *   **Activation Function** (`create_token_from_payment`):
        *   Deserializes metadata.
        *   **Re-validates** seat availability (to prevent race conditions).
        *   Creates `Token` and `SeatAllocation` records.
        *   Updates `payment.reference_id` = `token.id`.
        *   Commits transaction.

### 4.3 Code Highlight: `create_token_from_payment`
Located in `app/api/payment.py`. It serves as a factory that converts a paid Payment into a valid Token.

---

## 5. Subscription Flow (Part 3B)

Subscription activation enforces the rule: **No Pay, No Active Status.**

### 5.1 Workflow
1.  **Application**: User applies for a subscription.
    *   Record created with status `PENDING`.
2.  **Payment Initiation**:
    *   User initiates payment pointing to the Subscription ID.
    *   `reference_type` = `SUBSCRIPTION`.
    *   `reference_id` = `subscription.id`.
3.  **Confirmation & Activation**:
    *   User pays.
    *   `confirm_payment` is called with `SUCCESS`.
    *   **Activation Function** (`activate_subscription_from_payment`):
        *   Fetches the Subscription.
        *   Verifies status is `PENDING`.
        *   Updates status to `ACTIVE`.
        *   Commits transaction.

### 5.2 State Transitions
*   `PENDING` → `ACTIVE` (Valid)
*   `INACTIVE` → `ACTIVE` (Invalid - requires new application)
*   `ACTIVE` → `ACTIVE` (Idempotent - no op)

---

## 6. Pricing Rules

Pricing logic is centralized in the `compute_amount` helper function in `app/api/payment.py`.

| Type | Price (BDT) | Notes |
| :--- | :--- | :--- |
| **Token** | `50.00` | Fixed rate per trip. Future: Dynamic based on distance. |
| **Subscription** | `1500.00` | Monthly flat rate. |

---

## 7. Security & Data Integrity

### 7.1 Access Control
*   **User Isolation**: Users can never see or modify payments belonging to others.
*   **Role Enforcement**: Administrative endpoints are strictly protected by `require_transport_officer` dependency.

### 7.2 Integrity Checks
*   **No Orphan Services**: It is impossible to have an `ACTIVE` Token or Subscription that isn't linked to a `SUCCESS` payment (unless manually seeded).
*   **Double Spend Protection**: The confirmation logic explicitly checks that the payment is in the `INITIATED` state before processing. Re-submitting a confirmation for an already `SUCCESS` payment will simply return the existing record.

---

## 8. Idempotency Handling

Handling network retries and duplicate requests is critical for payments.

1.  **Token Creation Idempotency**:
    *   Check: `if payment.reference_id is not None:`
    *   Action: Return immediately. The token was already created.
2.  **Subscription Activation Idempotency**:
    *   Check: `if subscription.status == "ACTIVE":`
    *   Action: Return immediately.
3.  **Payment Confirmation Idempotency**:
    *   Check: `if payment.status != PaymentStatus.INITIATED:`
    *   Action: Raise error (or return status) to prevent re-processing.

---

## 9. Transaction Management

We use **SQLAlchemy Sessions** to ensure atomicity.

### The "All or Nothing" Rule
In the `confirm_payment` function:
```python
try:
    payment.status = SUCCESS
    if type == TOKEN:
        create_token() # Adds Token to session
    elif type == SUBSCRIPTION:
        activate_subscription() # Adds Subscription update to session
    
    session.commit() # Atomic commit of Payment + Token/Sub
except Exception:
    session.rollback() # Reverts Payment status AND Token creation
    payment.status = FAILED
    session.commit()
```
This ensures we never end up in an inconsistent state (e.g., Payment is SUCCESS but Token wasn't created due to a DB error).

---

## 10. Future Extensions

The current system lays the groundwork for advanced features:

*   **Real Gateway Integration**: The `payment_url` is currently a mock. Integration involves replacing this with calls to Bkash/Nagad APIs and handling their Webhooks.
*   **Refunds**: Implementing the `REFUNDED` status to trigger `Token` cancellation or `Subscription` deactivation.
*   **Dynamic Pricing**: Updating `compute_amount` to query a `Fare` table.
*   **Invoicing**: Generating PDF receipts using the rich data in `Payment` and `PaymentMetadata`.
