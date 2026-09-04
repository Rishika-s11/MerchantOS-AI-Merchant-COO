# MerchantOS — AI Merchant COO

An AI-powered merchant operations platform designed to monitor business activity, detect operational anomalies, explain their impact, and recommend actionable responses.

MerchantOS acts as an **AI Merchant COO**, helping merchants move from simply viewing dashboards to understanding **what went wrong, why it happened, what impact it may have, and what action should be taken**.

---

## Overview

MerchantOS provides a centralized command center for monitoring payments, revenue, customers, settlements, and operational activity.

The system continuously analyzes merchant data to identify unusual patterns such as:

* Declining payment success rates
* Revenue drops
* Settlement anomalies
* Unusual transaction behaviour
* Customer-level anomalies
* Operational issues

When an issue is detected, MerchantOS generates an alert and provides an investigation view containing supporting metrics, estimated business impact, confidence, and a recommended next step.

Actions are controlled through an approval-based workflow, and important events are recorded in an audit trail.

---

## Key Features

### 1. Merchant Command Center

* GMV and payment performance overview
* Successful payment metrics
* Payment success rate
* Refund and settlement information
* Revenue and performance trends
* AI-generated attention items
* Recent recommendations and actions

### 2. AI Alerts & Anomaly Detection

* Detects unusual changes in merchant performance
* Categorizes alerts by severity
* Provides detection time and supporting evidence
* Estimates potential business impact
* Supports investigation, dismissal, and resolution

### 3. AI Investigation

For every major issue, MerchantOS provides:

* What changed
* When it changed
* Supporting metrics
* Possible cause
* Estimated impact
* Confidence level
* Recommended next action

The system presents concise, evidence-based explanations rather than exposing internal model reasoning.

### 4. AI Command Center

Merchants can interact with the system using natural-language queries such as:

* "Why did revenue fall this week?"
* "Find today's anomalies."
* "Compare this week with last week."
* "Check my settlements."

Responses are connected to merchant data and available operational actions rather than functioning as a generic chatbot.

### 5. Transaction Monitoring

* Searchable transaction table
* Transaction ID and date
* Amount and payment method
* Transaction status
* Customer information
* Anomaly indicators
* Transaction detail view
* Related alerts and payment timeline

### 6. Customer Intelligence

* Customer transaction history
* Total spending
* Refund information
* Last payment
* Behaviour trends
* Customer-level risk and anomaly indicators
* AI-generated operational insights

### 7. AI Business Insights

Insights are organized into:

* Payments
* Customers
* Settlements
* Operations

Each insight includes:

* Finding
* Supporting evidence
* Business impact
* Confidence
* Recommended next step

### 8. Actions Center

MerchantOS provides a controlled workflow for AI-recommended actions.

Each proposed action contains:

* Trigger
* Proposed action
* Scope
* Expected result
* Safety limits
* Approval status

Actions require merchant approval unless explicitly configured as safe.

### 9. Audit Trail

The system maintains an audit-friendly record of:

* Timestamp
* Event
* AI decision
* Supporting evidence
* User approval
* Execution result
* Successful or failed actions

### 10. Test & Demo Scenarios

The platform supports reproducible merchant scenarios such as:

* Normal business activity
* Payment degradation
* Settlement anomaly
* Revenue drop

This makes the complete detection-to-action workflow easy to demonstrate and test.

---

## Core Workflow

```text
Merchant Data
     ↓
Monitoring & Analysis
     ↓
Anomaly Detection
     ↓
Alert Generated
     ↓
AI Investigation
     ↓
Evidence & Impact Analysis
     ↓
Recommended Action
     ↓
Merchant Approval
     ↓
Action Execution
     ↓
Audit Trail
```

---

## Problem Solved

Traditional merchant dashboards primarily show **what happened** through charts and metrics.

MerchantOS focuses on the next operational questions:

**What changed?**
**Why did it change?**
**How much does it matter?**
**What should I do next?**

Instead of requiring merchants to manually analyze multiple dashboards and transaction data, MerchantOS brings monitoring, investigation, recommendations, and controlled actions into a single operational interface.

---

## Technology Stack

### Frontend

* React.js
* TypeScript
* Vite
* Tailwind CSS
* Recharts

### Backend / Application

* Node.js
* REST APIs
* JavaScript / TypeScript

### AI & Data Processing

* AI-powered analysis
* Anomaly detection
* Merchant transaction and operational data
* Rule-based and data-driven insights

### Development Tools

* Git & GitHub
* npm
* VS Code

---

## Project Structure

```text
MerchantOS/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── data/
│   ├── services/
│   └── ...
│
├── public/
├── package.json
├── vite.config.*
├── tsconfig.json
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Git

### Installation

Clone the repository:

```bash
git clone <repository-url>
```

Navigate to the project directory:

```bash
cd MerchantOS
```

Install dependencies:

```bash
npm install
```

### Run Locally

Start the development server:

```bash
npm run dev
```

The application will be available on the local development URL shown in the terminal.

---

## Demo Flow

A typical MerchantOS demonstration follows this workflow:

1. Open the MerchantOS dashboard.
2. Load or generate merchant data.
3. The system identifies an abnormal pattern.
4. An alert is generated.
5. Open the corresponding AI investigation.
6. Review the evidence and business impact.
7. Review the AI recommendation.
8. Approve the proposed action.
9. View the execution result.
10. Verify the complete event in the audit trail.

---

## Safety & Control

MerchantOS is designed around controlled AI operations.

The AI does not directly perform unrestricted business actions. Recommended actions are presented with their scope and expected result, and merchant approval is required for controlled operations.

The interface also clearly indicates **Test Mode**, action status, and approval state during demonstrations.

---

## Example Scenarios

### Payment Degradation

```text
Payment Success Rate
96.2% → 88.4%

        ↓

AI detects abnormal decline

        ↓

Alert:
UPI Payment Degradation Detected

        ↓

Investigation:
Performance declined during a specific period

        ↓

AI Recommendation:
Review the affected payment flow / initiate
a bounded operational response
```

### Revenue Drop

```text
Revenue decline detected
        ↓
Compare historical performance
        ↓
Identify supporting transaction patterns
        ↓
Estimate business impact
        ↓
Generate recommended action
        ↓
Merchant approval
```

---

## Design Principles

MerchantOS follows these principles:

* **Evidence over assumptions** — recommendations are supported by observable metrics.
* **Actionable insights** — the system focuses on what the merchant should do next.
* **Human approval** — controlled actions remain under merchant supervision.
* **Auditability** — important decisions and actions are recorded.
* **Reproducible demos** — predefined scenarios make anomaly workflows easy to test.
* **Enterprise-focused UI** — information is presented clearly without unnecessary visual complexity.

---

## Future Enhancements

Potential improvements include:

* Integration with live payment gateways
* Real-time transaction streaming
* Advanced ML-based anomaly detection
* Automated root-cause analysis
* More merchant-specific AI agents
* Automated but policy-controlled actions
* Multi-channel merchant notifications
* Advanced forecasting
* Role-based access control
* Production-grade audit and compliance infrastructure
* Integration with external business systems

---

## Project Status

**Status:** Prototype / Hackathon Project

MerchantOS is designed as a functional prototype demonstrating how AI can be used as an operational decision layer for merchants rather than only as a conversational assistant.

---

## Developer

**Rishika Sahu**

Built as an AI-powered merchant operations and decision-support project.

