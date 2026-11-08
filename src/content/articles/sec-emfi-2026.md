---
title: "Injection de Fautes Électromagnétiques (EMFI) & Voltage Glitching sur Bootloaders Industriels"
date: "2026-10"
category: security
icon: chip
tag: "SEC-HW // FAULTY CAT & ARM CORTEX-M"
abstract: >-
  Modélisation physique et caractérisation temporelle des impulsions de sous-tension (Faulty Cat)
  permettant de contourner les vérifications cryptographiques d'intégrité sur microcontrôleurs
  ARM Cortex-M4.
lab: glitch
bibtex: |
  @techreport{ba2026faultycat,
    author = {Ba, Ousmane},
    title = {Deterministic Voltage Glitching & EMFI on Embedded Bootloaders},
    institution = {Dakar Cyber-Physical Security Lab},
    year = {2026}
  }
---

L'évaluation de la sécurité matérielle des systèmes embarqués repose sur la capacité à induire des fautes transitoires contrôlées sans déclencher les capteurs de *Brownout Reset (BOR)*. Avec l'outil **Faulty Cat**, nous ciblons la fenêtre d'échantillonnage du registre d'état lors de l'instruction de branchement conditionnel `BNE`.

$$P_{\text{glitch}}(\Delta t, \Delta V) = \Phi\left( \frac{|V_{\text{DD}} - \Delta V| - V_{\text{th}}(T)}{\sigma_{\text{jitter}}} \right) \cdot \mathbb{I}_{[t_{\text{setup}}, t_{\text{hold}}]}(\Delta t)$$

En couplant cette approche matérielle à des agents d'audit web offensifs entraînés sur **OWASP Juice Shop** (`jjuiceshop`) et **SecureCapture**, nous obtenons une chaîne de validation de sécurité de bout en bout, du silicium jusqu'aux API applicatives.
