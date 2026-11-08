---
title: "Phonetic Tokenization & Distributed Voice Collection for Atlantic and Mande Languages"
tag: "AI-NLP // LINGOO & SOVEREIGN KEYBOARDS"
abstract: >-
  A unified architecture linking 6 native mobile keyboards (Fulfuldekey, Wolofkey, Joolakey,
  Sooninkekey, Mandinkakey, Seereerkey) and the Lingoo platform for low-resource ASR/TTS fine-tuning.
---

Multilingual foundation models over-fragment the implosive and prenasalized consonants of Pulaar (`ɓ, ɗ, ƴ, ŋ`), Wolof and Joola. Our Kotlin ecosystem of Android/iOS keyboards (derived from **Tappirgal Pulaar / fulfuldekey**) normalizes the Unicode NFC encoding at the source.

$$\mathcal{L}_{\text{CTC-Adapt}}(\theta) = -\sum_{(X, Y) \in \mathcal{D}_{\text{Lingoo}}} \log P(Y \mid \text{Conformer}_{\theta}(\text{Mel}(X))) + \lambda \|\theta - \theta_{\text{Whisper}}\|_2^2$$

The corpora collected through **Lingoo** and **AudioSheet IA** drastically reduce the *Word Error Rate (WER)* while preserving the sovereignty of local voice data.
