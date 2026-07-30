# CareerNodes - Quality Assurance & Testing Strategy

This document details the comprehensive Quality Assurance (QA) strategy, test coverage framework, and test case specifications engineered for **CareerNodes**.

---

## 1. Scope

### 1.1 In-Scope
* **Functional & Validation Rules:**
  * Valid user registration process and successful JSON Web Token (JWT) generation.
  * Duplicate email prevention and database collision handling.
  * Cryptographic password hashing verification using `bcryptjs` prior to database persistence.
  * Request payload validation (malformed email regex, missing required attributes, and string constraints).
* **Authentication & Security Middleware:**
  * Successful authentication returning a signed JWT token.
  * Controlled login failure handling for invalid passwords or non-existent user accounts.
  * Route guard protection: Access restriction on protected endpoints (e.g., `/api/user/profile`) for unauthenticated, invalid, or expired JWT requests.

### 1.2 Out-of-Scope
* **Third-Party Service Infrastructure:** External uptime and performance of third-party SMTP/Email verification providers and OpenRouter API endpoints.
* **Cross-Browser UI Presentation:** Visual CSS layout rendering across legacy web browsers and non-standard screen viewports.

---

## 2. Test Approach & Methodologies

To ensure full system reliability, security, and scalability, the testing strategy for **CareerNodes** utilizes four primary testing methodologies:

### 2.1 Functional Testing (Black-Box)
* **Objective:** Validate that every endpoint and feature behaves strictly according to technical specifications without relying on internal implementation details.
* **Execution:**
  * **Input/Output Validation:** Executing unit and API tests against endpoints (e.g., `POST /api/auth/register`, `POST /api/user/dsa/update`) to confirm expected HTTP response codes and payload structures.
  * **State Verification:** Confirming that state transitions—such as incrementing problem counts or recalculating streak metrics—are correctly updated across application models.

### 2.2 Integration Testing
* **Objective:** Verify seamless communication across independent architectural layers: *React Client -> Express REST APIs -> Security Middleware -> MongoDB (Mongoose ORM)*.
* **Execution:**
  * Testing complete end-to-end data workflows, such as acquiring a JWT upon login, passing it in the `Authorization` header to access protected endpoints like `GET /api/user/profile`, and ensuring authentic user data is retrieved from MongoDB.
  * Validating third-party AI orchestration pipelines by verifying payloads passed through the OpenRouter API interface and ensuring structured JSON responses are properly logged into the user's `mockInterviewLogs`.

### 2.3 Performance & Stress Testing
* **Objective:** Evaluate system behavior, resource utilization, and API latency under high concurrency conditions.
* **Execution:**
  * Executing load scripts via **k6** and **Postman/Newman** within a Linux/UNIX environment to simulate concurrent virtual user access on authentication and AI prompt generation endpoints.
  * Monitoring database connection pool stability, memory limits, and request throughput to guarantee p95 latencies remain under 350ms.

### 2.4 Regression Testing
* **Objective:** Ensure new feature rollouts, bug fixes, or schema modifications do not introduce breaking changes to existing system components.
* **Execution:**
  * Maintaining an automated test suite executed via terminal scripts whenever backend controller logic or database schemas are modified, guaranteeing zero unintended side effects.

---

## 3. Test Environment & Tools

The testing stack is selected to facilitate automated regression workflows, unit testing, API documentation, and stress testing within a Linux/UNIX environment:

### 3.1 Operating & Runtime Environment
* **OS Environment:** Linux/UNIX (Ubuntu / Bash) for CLI-driven automated test runs, terminal scripting, and process metric monitoring.
* **Runtime Stack:** Node.js (v18+) and npm ecosystem.

### 3.2 Unit & Integration Testing Frameworks
* **Jest:** Primary JavaScript testing framework for executing automated unit tests, logic assertion checks, and state validation.
* **Supertest:** HTTP assertion library paired with Jest to execute integration tests directly against Express REST API controllers.

### 3.3 API Testing, Automation & Documentation
* **Postman:** API client used to build request collections, validate HTTP status codes, and write automated JS response assertions.
* **Newman CLI:** Command-line collection runner used to execute automated Postman API test suites inside a Linux/UNIX terminal.
* **Swagger UI / OpenAPI:** Visual API specification framework used for contract verification, endpoint interactive testing, and schema documentation.

### 3.4 Performance, Load & Stress Testing
* **Apache JMeter / k6:** Performance testing tools used to simulate concurrent virtual user traffic, benchmark endpoint latency, and stress-test MongoDB connection pool thresholds under load.

---

## 4. Entry and Exit Criteria

To maintain quality standards and avoid false test results, the execution pipeline follows defined Entry and Exit criteria:

### 4.1 Entry Criteria (Pre-requisites before running tests)
* **Codebase Readiness:** Backend source code compiles cleanly with zero syntax errors or unhandled dependency exceptions.
* **Environment Configuration:** Valid `.env` variables (such as `JWT_SECRET`, `PORT`, and `OPENROUTER_API_KEY`) are properly loaded in the runtime environment.
* **Database State:** MongoDB instance is running, accessible, and populated with controlled test datasets (seeded user profiles and DSA topics).
* **Test Infrastructure:** Testing utilities (Jest, Supertest, Newman CLI, JMeter/k6) are installed and initialized.

### 4.2 Exit Criteria (Conditions for test sign-off & release)
* **Execution Completion:** 100% of defined test cases (Positive, Negative, and Boundary) have been executed.
* **Pass Rate:** 100% pass rate on critical security, authentication, and core API workflows; minimum 90% overall test suite pass rate.
* **Defect Clearance:** Zero critical (Blocker/P1) or high-severity unhandled exceptions remaining open in the issue tracker.
* **Performance Benchmark:** API p95 latency remains under 350ms under expected traffic load without database connection pool exhaustion or memory leaks.

---

## 5. Risk Assessment & Mitigation

| Risk Area | Potential Threat / Failure | Impact Level | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Third-Party AI Integration** | OpenRouter API rate limiting, network latency, or service outage during mock interview evaluation. | High | Implement strict API request timeouts, wrap AI calls in `try-catch` blocks returning graceful fallback errors, and utilize mocked AI responses during regression test runs. |
| **Database Scalability** | MongoDB connection pool exhaustion under high concurrent load on user metrics endpoints. | Medium | Benchmark connection limits using JMeter/k6 stress scripts, configure Mongoose connection pooling options, and index frequently queried user fields (`email`, `targetCompany`). |
| **Payload Integrity & Security** | Oversized or malicious technical submission inputs crashing Node.js process memory. | High | Enforce strict Express body-parser payload caps (`10mb`), apply regex input sanitization, and execute negative tests with oversized payloads. |

---

## 6. Detailed Test Case Matrix

The following test cases utilize a structured QA format to validate core platform features across Positive, Negative, Boundary, and Integration testing parameters.

| Test Case ID | Feature / Module | Test Title / Summary | Test Type | Pre-conditions | Test Steps | Test Data | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_AUTH_001** | User Auth | Verify successful user login and JWT generation | Functional (Positive) | User `test@student.com` exists in the MongoDB database with hashed password. | 1. Send `POST` to `/api/auth/login`.<br>2. Pass valid JSON payload.<br>3. Verify HTTP response. | `{"email": "test@student.com", "password": "ValidPass123!"}` | API returns `HTTP 200 OK`. Response body contains valid JWT token and user profile object. | API returned `HTTP 200 OK` with token. | **PASS** |
| **TC_AUTH_007** | User Auth | Reject registration with an existing email address | Negative / Boundary | User `existing.user@student.com` already exists in MongoDB. | 1. Send `POST` to `/api/auth/register`.<br>2. Pass payload containing duplicate email.<br>3. Verify HTTP response code. | `{"name": "Test User", "email": "existing.user@student.com", "password": "Password123!"}` | API returns `HTTP 400 Bad Request` or `409 Conflict` with error message "Email already in use". | API returned `HTTP 400` with message "Email already in use". | **PASS** |
| **TC_DSA_002** | DSA Tracker | Prevent decrementing problem `solvedCount` below zero | Boundary (Negative) | User is authenticated. `Graphs` topic exists with `solvedCount: 0`. | 1. Attach Bearer Token to header.<br>2. Send `POST` to `/api/user/dsa/update`.<br>3. Pass 'decrement' action payload. | `{"topicName": "Graphs", "action": "decrement"}` | API returns `HTTP 400 Bad Request` or clamping logic keeps count at `0`. Database is NOT updated to `-1`. | API clamped count at `0` and returned `HTTP 200 OK`. | **PASS** |
| **TC_AI_003** | AI Orchestration | Evaluate mock interview with unstructured/empty answer | Integration (Negative) | User is authenticated. OpenRouter API is reachable. | 1. Attach Bearer Token.<br>2. Send `POST` to `/api/ai/mock-interview`.<br>3. Submit valid question but empty answer. | `{"question": "Explain Big-O", "userAnswer": ""}` | Express validation middleware catches empty string and returns `HTTP 400 Bad Request` before hitting the AI API. | Validation blocked request, returned `HTTP 400`. | **PASS** |
