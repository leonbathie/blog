---
title: "Optimisation Stochastique MTBF/MTTR par Loi de Weibull & Automatisation GMAO"
date: "2025-12"
category: industrial
tag: "IND-GMAO // H&D MADAR & IBS SÉNÉGAL"
abstract: >-
  Ingénierie de fiabilité appliquée aux lignes d'embouteillage et équipements électromécaniques :
  réduction de 25% des arrêts critiques via DimoMaint, Coswin, SAP PM et Python.
lab: weibull
bibtex: |
  @techreport{ba2025weibullgmao,
    author = {Ba, Ousmane},
    title = {Predictive Maintenance & Weibull Reliability Modeling in Industrial GMAO},
    institution = {H&D Madar / IBS Maintenance Engineering},
    year = {2025}
  }
---

En tant que Superviseur et Planificateur Maintenance chez **H&D Madar Industrie** après une expérience terrain chez **IBS**, j'ai modélisé la dégradation des organes électromécaniques critiques par une distribution de Weibull à deux paramètres $(\beta, \eta)$.

$$R(t) = \exp\left(-\left(\frac{t}{\eta}\right)^\beta\right), \quad A_{\infty} = \frac{\text{MTBF}}{\text{MTBF} + \text{MTTR}} = \frac{\eta \, \Gamma(1 + 1/\beta)}{\eta \, \Gamma(1 + 1/\beta) + \text{MTTR}}$$

Le couplage des historiques GMAO (**DimoMaint, Coswin, SAP PM**) avec des scripts d'automatisation Python/MySQL a permis d'anticiper les seuils d'usure $(\beta > 1)$ et de réduire de **25%** les arrêts non planifiés.
