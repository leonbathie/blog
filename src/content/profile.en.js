/**
 * Traduction anglaise du profil (src/content/profile.js).
 * Mêmes clés, mêmes positions dans les listes : seuls les textes changent.
 * Une clé absente garde le texte français.
 */
export const profileEn = {
  role: 'AI Engineer & Researcher',

  intro:
    'Welcome to the lab of **Ousmane Ba** (Rufisque / Dakar). At the crossroads of **hardware cybersecurity** (*Faulty Cat* fault injection, OWASP Juice Shop audits, MCP agents), **industrial CMMS reliability** (H&D Madar, IBS) and neural processing of **African languages** (*Fulfuldekey, Wolofkey, Joolakey* keyboards & the *Lingoo* platform).',

  highlights: [
    { label: 'ASR WER (Pulaar)', note: 'LoRA v3' },
    { label: 'Downtime (IBS)', note: 'Weibull CMMS' },
    { label: 'National corpus', value: '3 Languages', note: 'PUL/WOL/JOO' },
    { label: 'Infra & Network', note: '+ Self-Hosted GPU' },
  ],

  domains: [
    {
      title: 'Faulty Cat & OWASP Audit',
      text: 'Hardware fault injection (voltage / EMFI glitching) on ARM Cortex-M bootloaders, `BNE` instruction skipping and automated web exploitation (*OWASP Juice Shop*, *SecureCapture*).',
      cta: 'Open the 3D oscilloscope',
    },
    {
      title: '6 Keyboards & Lingoo.tech',
      text: 'Native Android/iOS architecture for **Fulfuldekey** (Tappirgal Pulaar), **Wolofkey**, **Joolakey**, **Sooninkekey**, **Mandinkakey**, **Seereerkey**, plus Whisper fine-tuning.',
      cta: 'Inspect the Kotlin ecosystem',
    },
    {
      tag: 'CMMS // WEIBULL',
      title: 'H&D Madar & IBS Supervision',
      text: 'Stochastic MTBF/MTTR modeling (DimoMaint, Coswin, SAP PM), **−25% critical stoppages** on bottling lines and Python/MySQL automation.',
      cta: 'Read the mathematical monograph',
    },
    {
      title: 'DIADJI Vision AI & MCP',
      text: 'Express checkout software **DIADJI** with an AI Vision scanner, an autonomous **MCP** agent orchestrator, and the **Flow-Video-Merger** 4K Chrome extension.',
      cta: 'Simulate the Kyber-1024 lattice',
    },
  ],

  about: {
    kicker: '// ENGINEERING DOSSIER & CAREER',
    title: 'Why unify Electromechanics, AI and Cybersecurity?',
    text: 'In modern research labs, whether in robotics, critical infrastructure or foundation models, the boundary between code and atoms is fading. My path has been built on this dual requirement: understanding the physics of industrial machines (CNC machining, electromechanics, high-speed bottling lines) while designing the software and mathematical layers that govern or protect them.',
    timeline: [
      {
        period: 'Present',
        role: 'Tech Lead @ Taro Learning & Director @ Lingoo.tech',
        text: 'Custom AI data engineering, ASR/TTS fine-tuning (Pulaar, Wolof, Joola), deployment of RAG architectures and voice agents.',
      },
      {
        period: '2023 — Present',
        role: 'Maintenance Supervisor & Planner / CMMS Expert @ H&D Madar Industrie',
        text: 'CMMS automation (DimoMaint, Coswin), analytical KPI management (MTBF, MTTR), scheduling and coordination of technical teams.',
      },
      {
        period: 'Academic',
        role: 'Bachelor (L3) in Computer Science & Applied Mathematics for Cybersecurity',
        text: 'Together with an Electromechanics Technician Certificate, a Technical Baccalaureate T1 (Mechanical Manufacturing) and the Cisco CCNA network certification.',
      },
      {
        period: 'Ecosystem',
        role: 'Campement Nyabinghi (Abéné) & Construction Projects',
        text: 'Running an eco-lodge in Casamance, building the local app **Jokeree** and designing automated pro-forma invoicing tools (WeasyPrint/Python) for the construction sector in Baie de Boucotte / Diembéring.',
      },
    ],
  },
}
