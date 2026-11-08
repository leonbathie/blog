---
title: "From Passive CMMS to Predictive Scheduling: Cutting Stoppages by 25% on a Bottling Line"
abstract: >-
  Engineering field report from H&D Madar Industrie and IBS: turning maintenance logs (DimoMaint,
  Coswin) into mathematical reliability models.
metrics: "-25% unplanned stoppages | KPI: MTBF / MTTR / OEE"
---

In most plants, the CMMS (*Computerized Maintenance Management System*) is used as a mere post-mortem ledger. My goal at **H&D Madar Industrie** and on the bottling lines of **IBS** was to treat maintenance as a distributed-systems engineering problem.

### 1. Modeling the failure rate $\lambda(t)$

Rather than applying arbitrary overhaul intervals, we extract the work-order history from **DimoMaint** and **Coswin** with Python and SQL, then model the survival law of each electromechanical subassembly with a two-parameter Weibull distribution $(\beta, \eta)$:

$$f(t) = \frac{\beta}{\eta} \left( \frac{t}{\eta} \right)^{\beta - 1} e^{-(t/\eta)^\beta}, \quad \text{MTBF} = \eta \cdot \Gamma\left(1 + \frac{1}{\beta}\right)$$

When the shape parameter $\beta > 1$, the component enters an accelerated mechanical wear-out phase (bearings, solenoid valves, conveyors).

### 2. Automated reporting and RCA

By coupling automated analysis pipelines (advanced Excel, Power BI, Python/MySQL) with **Lean Maintenance, 5S and Root Cause Analysis (RCA)** methods under ISO 9001 and HACCP constraints, the mean time to repair ($\text{MTTR}$) drops sharply, thanks to pre-positioned critical spare parts and targeted training of field technicians.
