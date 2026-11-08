---
title: "Tokenisation Phonétique & Collecte Vocale Distribuée pour les Langues Atlantiques et Mandé"
date: "2026-08"
category: speech-ai
icon: phone
tag: "AI-NLP // LINGOO & CLAVIERS SOUVERAINS"
abstract: >-
  Architecture unifiée reliant 6 claviers mobiles natifs (Fulfuldekey, Wolofkey, Joolakey,
  Sooninkekey, Mandinkakey, Seereerkey) et la plateforme Lingoo pour le fine-tuning ASR/TTS
  bas-ressources.
lab: pulaar
bibtex: |
  @article{ba2026sovereignnlp,
    author = {Ba, Ousmane},
    title = {Low-Resource ASR & Native Input Systems for West African Languages},
    journal = {Lingoo & Taro Learning Technical Monograph},
    year = {2026}
  }
---

Les modèles de fondation multilingues souffrent d'une sur-fragmentation sur les consonnes implosives et prénasalisées du Pulaar (`ɓ, ɗ, ƴ, ŋ`), du Wolof et du Joola. Notre écosystème de claviers Android/iOS en Kotlin (déclinés de **Tappirgal Pulaar / fulfuldekey**) normalise l'encodage Unicode NFC à la source.

$$\mathcal{L}_{\text{CTC-Adapt}}(\theta) = -\sum_{(X, Y) \in \mathcal{D}_{\text{Lingoo}}} \log P(Y \mid \text{Conformer}_{\theta}(\text{Mel}(X))) + \lambda \|\theta - \theta_{\text{Whisper}}\|_2^2$$

Les corpus collectés via **Lingoo** et **AudioSheet IA** permettent de réduire drastiquement le *Word Error Rate (WER)* tout en préservant la souveraineté des données vocales locales.
