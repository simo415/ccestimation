# Confluent Cost Calculator

A small React app (Vite) that estimates monthly Confluent costs for Standard, Enterprise and Dedicated clusters based on throughput, average message size, retention and replication.

Quick start (Windows PowerShell):

```powershell
cd c:\Users\Simon\projects\ConfluentCostCalc
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

Notes:
- Pricing defaults are simplified and for demonstration only. You can override storage $/GB/month in the inputs.
- This is not official Confluent pricing.
 - You can now add multiple topics/use-cases. Each topic has its own throughput, average message size and retention.
 - Replication is fixed to Confluent's default of 3 (no user override). The calculator sums storage and network across topics then applies replication.
