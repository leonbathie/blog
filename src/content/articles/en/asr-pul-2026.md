---
title: "Scaling Pulaar & Wolof Speech-to-Text: Fine-Tuning Whisper under Real Acoustic Constraints"
abstract: >-
  How to adapt encoder-decoder Transformer architectures, pre-trained on massive and mostly Western
  corpora, to the phonological, tonal and morphological features of Pulaar (Fulfulde) and Wolof.
metrics: "WER -34.2% on a noisy WhatsApp corpus | Dataset: AudioSheet IA"
---

Audio foundation models such as **Whisper** are remarkably robust on high-resource languages, but their *Word Error Rate* ($\text{WER}$) degrades severely on agglutinative languages, or on languages with implosive consonants such as **Pulaar** ($\text{ɓ, ɗ, ƴ, ŋ}$).

### 1. Problem formulation & tokenization

In a standard ASR pipeline, the encoder turns log-Mel spectrograms $X \in \mathbb{R}^{T \times F}$ into latent representations, while the decoder estimates the token sequence $Y = (y_1, \dots, y_N)$ that maximizes:

$$P(Y \mid X; \theta) = \prod_{i=1}^{N} P(y_i \mid y_{<i}, \text{Encoder}(X); \theta)$$

However, the default multilingual BPE tokenizer over-segments Pulaar morphemes, which artificially inflates the sequence length $N$ and slows down inference on GPU servers (RunPod).

### 2. Distributed collection pipeline: AudioSheet IA

To make up for the scarcity of aligned data, we built **AudioSheet IA** and connected its ingestion to WhatsApp voice streams (low-bandwidth Opus codecs at $16\text{ kHz}$) and to community corpora (Mozilla Common Voice, Sunbird, Kirikou, tests on Fooyre Ɓamtaare and Saggitorde).

```python
# Phonetic normalization and SNR filtering before LoRA fine-tuning
def preprocess_pulaar_utterance(waveform, sample_rate=16000):
    snr_db = estimate_snr(waveform)
    if snr_db < 12.5:
        waveform = spectral_gating_denoise(waveform, sample_rate)
    mel_spec = compute_log_mel_spectrogram(waveform, n_mels=128)
    return mel_spec
```

### 3. Results on Taro Learning & Lingoo.tech

By combining targeted *SpecAugment* with LoRA fine-tuning of the cross-attention layers, we stabilize the recognition of geminates and implosives, which allows direct integration into the interactive syllabaries and 3D tales of **Taro Learning**.
