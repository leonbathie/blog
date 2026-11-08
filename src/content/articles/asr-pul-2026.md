---
title: "Scaling Pulaar & Wolof Speech-to-Text : Fine-Tuning Whisper sous contraintes acoustiques réelles"
date: "2026-10"
category: speech-ai
tag: "SPEECH AI & LOW-RESOURCE NLP"
readTime: 9
abstract: >-
  Comment adapter des architectures Transformer encodeur-décodeur pré-entraînées sur des corpus
  massifs majoritairement occidentaux aux spécificités phonologiques, tonales et morphologiques
  du Pulaar (Fulfulde) et du Wolof.
metrics: "WER -34.2% sur corpus bruité WhatsApp | Dataset: AudioSheet IA"
lab: pulaar
bibtex: |
  @article{ba2026pulaarasr,
    title={Scaling Pulaar and Wolof Speech-to-Text under Real Acoustic Constraints},
    author={Ba, Ousmane},
    journal={Taro Learning & Lingoo.tech Technical Monographs},
    year={2026},
    note={Dakar / Rufisque, Senegal}
  }
---

Les modèles de fondation audio tels que **Whisper** démontrent une robustesse remarquable sur les langues à fortes ressources, mais subissent une dégradation sévère du taux d'erreur sur les mots (*Word Error Rate*, $\text{WER}$) lorsqu'ils sont confrontés à des langues agglutinantes ou à consonnes implosives comme le **Pulaar** ($\text{ɓ, ɗ, ƴ, ŋ}$).

### 1. Formulation du problème & Tokenisation

Dans un pipeline ASR standard, l'encodeur transforme les spectrogrammes log-Mel $X \in \mathbb{R}^{T \times F}$ en représentations latentes, tandis que le décodeur estime la séquence de tokens $Y = (y_1, \dots, y_N)$ maximisant :

$$P(Y \mid X; \theta) = \prod_{i=1}^{N} P(y_i \mid y_{<i}, \text{Encoder}(X); \theta)$$

Or, le tokenizer BPE multilingue par défaut segmente excessivement les morphèmes pulaar, gonflant artificiellement la longueur de séquence $N$ et ralentissant l'inférence sur les serveurs GPU (RunPod).

### 2. Pipeline de collecte distribuée : AudioSheet IA

Pour pallier la rareté des données alignées, nous avons développé **AudioSheet IA** et couplé l'ingestion aux flux vocaux WhatsApp (codecs Opus basse bande passante à $16\text{ kHz}$) ainsi qu'aux corpus communautaires (Mozilla Common Voice, Sunbird, Kirikou, tests sur Fooyre Ɓamtaare et Saggitorde).

```python
# Normalisation phonétique et filtrage SNR avant Fine-Tuning LoRA
def preprocess_pulaar_utterance(waveform, sample_rate=16000):
    snr_db = estimate_snr(waveform)
    if snr_db < 12.5:
        waveform = spectral_gating_denoise(waveform, sample_rate)
    mel_spec = compute_log_mel_spectrogram(waveform, n_mels=128)
    return mel_spec
```

### 3. Résultats sur Taro Learning & Lingoo.tech

En combinant du *SpecAugment* ciblé et un fine-tuning LoRA sur les couches d'attention croisée, nous stabilisons la reconnaissance des géminées et des implosives, permettant l'intégration directe dans les syllabaires interactifs et les contes 3D de **Taro Learning**.
