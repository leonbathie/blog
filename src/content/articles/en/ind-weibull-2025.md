---
title: "Stochastic MTBF/MTTR Optimization with the Weibull Law & CMMS Automation"
tag: "IND-CMMS // H&D MADAR & IBS SENEGAL"
abstract: >-
  Reliability engineering applied to bottling lines and electromechanical equipment: a 25% reduction
  in critical stoppages with DimoMaint, Coswin, SAP PM and Python.
---

As Maintenance Supervisor and Planner at **H&D Madar Industrie**, after field experience at **IBS**, I modeled the degradation of critical electromechanical components with a two-parameter Weibull distribution $(\beta, \eta)$.

$$R(t) = \exp\left(-\left(\frac{t}{\eta}\right)^\beta\right), \quad A_{\infty} = \frac{\text{MTBF}}{\text{MTBF} + \text{MTTR}} = \frac{\eta \, \Gamma(1 + 1/\beta)}{\eta \, \Gamma(1 + 1/\beta) + \text{MTTR}}$$

Coupling the CMMS histories (**DimoMaint, Coswin, SAP PM**) with Python/MySQL automation scripts made it possible to anticipate wear-out thresholds $(\beta > 1)$ and to cut unplanned stoppages by **25%**.
