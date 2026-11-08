---
title: "De la GMAO passive à l'ordonnancement prédictif : Réduire les arrêts de 25% en ligne d'embouteillage"
date: "2026-08"
category: industrial
tag: "CYBER-PHYSICAL SYSTEMS & RELIABILITY"
readTime: 7
abstract: >-
  Retour d'expérience d'ingénierie chez H&D Madar Industrie et IBS : transformation des journaux
  d'interventions (DimoMaint, Coswin) en modèles mathématiques de fiabilité.
metrics: "-25% d'arrêts non planifiés | KPI: MTBF / MTTR / OEE"
lab: weibull
bibtex: |
  @techreport{ba2026gmao,
    title={Predictive Maintenance Scheduling and Weibull Reliability Modeling in High-Speed Bottling Lines},
    author={Ba, Ousmane},
    institution={H&D Madar Industrie / IBS Engineering Notes},
    year={2026}
  }
---

Dans la majorité des usines, la GMAO (*Gestion de Maintenance Assistée par Ordinateur*) est utilisée comme un simple registre comptable post-mortem. Mon objectif chez **H&D Madar Industrie** et sur les lignes d'embouteillage d'**IBS** a été de traiter la maintenance comme un problème d'ingénierie des systèmes distribués.

### 1. Modélisation du Taux de Défaillance $\lambda(t)$

Plutôt que d'appliquer des intervalles de révision arbitraires, nous extrayons via Python et SQL l'historique des ordres de travail depuis **DimoMaint** et **Coswin** afin de modéliser la loi de survie de chaque sous-ensemble électromécanique selon une distribution de Weibull à deux paramètres $(\beta, \eta)$ :

$$f(t) = \frac{\beta}{\eta} \left( \frac{t}{\eta} \right)^{\beta - 1} e^{-(t/\eta)^\beta}, \quad \text{MTBF} = \eta \cdot \Gamma\left(1 + \frac{1}{\beta}\right)$$

Lorsque le paramètre de forme $\beta > 1$, le composant entre en phase d'usure mécanique accélérée (roulements, électrovannes, convoyeurs).

### 2. Automatisation du Reporting et RCA

En couplant des pipelines d'analyse automatisés (Excel avancé, Power BI, Python/MySQL) aux méthodologies **Lean Maintenance, 5S et Root Cause Analysis (RCA)** sous contraintes ISO 9001 et HACCP, le temps moyen de réparation ($\text{MTTR}$) chute drastiquement grâce au pré-positionnement des pièces critiques et à la formation ciblée des techniciens terrain.
