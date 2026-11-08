---
title: "Sécurité Offensive Hybride : Agents MCP autonomes et Injection de Fautes Matérielles (Faulty Cat)"
date: "2026-06"
category: security
icon: computer
tag: "OFFENSIVE SECURITY & HARDWARE GLITCHING"
readTime: 11
abstract: >-
  Exploration de la surface d'attaque moderne : de l'orchestration d'agents LLM via le Model Context
  Protocol (MCP) pour l'audit web jusqu'au contournement de vérifications cryptographiques par
  impulsion électromagnétique.
metrics: "Hardware: Faulty Cat EMFI | Protocol: Anthropic MCP"
lab: glitch
bibtex: |
  @article{ba2026hybridsec,
    title={Hybrid Offensive Security: Autonomous MCP Agents and Electromagnetic Fault Injection},
    author={Ba, Ousmane},
    journal={Cybersecurity & Applied Mathematics Research Log},
    year={2026}
  }
---

La recherche en sécurité offensive se divise traditionnellement entre l'audit logiciel haut niveau et l'attaque physique sur silicium. Dans le cadre de mes travaux en **Licence Informatique & Mathématiques Appliquées à la Cybersécurité**, j'explore la convergence de ces deux paradigmes.

### 1. Orchestration d'Agents Offensifs via MCP

Le *Model Context Protocol* (MCP) permet d'exposer des outils d'énumération réseau, d'analyse statique et de fuzzing sous forme de primitives typées accessibles à un agent raisonneur. L'agent maintient un graphe d'hypothèses de vulnérabilités et vérifie formellement chaque vecteur sans halluciner les sorties système.

### 2. Perturbation Physique d'Horloge et de Tension (Faulty Cat)

Sur les cibles embarquées, la sécurité logicielle repose sur l'hypothèse que le matériel exécute fidèlement les instructions compilées en C. Avec un injecteur comme **Faulty Cat**, une brève impulsion électromagnétique ($\Delta V$ sur quelques nanosecondes) pendant le cycle de décodage d'instruction suffit à induire un saut de compteur ordinal (*Instruction Skipping*) :

$$T_{\text{clk}} < T_{\text{propagation}}(\text{VDD} - \Delta V_{\text{glitch}}) \implies \text{Setup Time Violation}$$

Cette approche physique démontre pourquoi toute architecture critique industrielle ou IoT doit combiner durcissement matériel et redondance temporelle dans son code critique.
