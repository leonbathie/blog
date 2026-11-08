/**
 * Identité et textes de présentation — partagés par TOUTES les formes du blog.
 * Les textes acceptent le Markdown en ligne (**gras**, *italique*, `code`) et les formules $…$.
 */
export const profile = {
  name: 'Ousmane Ba',
  initials: 'OB',
  handle: 'leonbathie',
  city: 'Rufisque / Dakar',
  country: 'Sénégal',
  links: {
    github: 'https://github.com/leonbathie',
    linkedin: 'https://linkedin.com/in/husary',
    email: 'ousmanhabsaba@gmail.com',
  },

  /** Axes de travail, en une ligne */
  focus: 'Offensive Security • Hardware Glitch • Sovereign AI',

  /** Phrase de présentation (FR / EN) */
  tagline: {
    fr: "Ingénieur IA, Chercheur en Sécurité Offensive & Fiabilité des Systèmes Industriels. Travaux à l'intersection des modèles vocaux à faibles ressources (Pulaar/Wolof), de la cyber-sécurité matérielle et des systèmes cyber-physiques.",
    en: 'AI Lead Engineer, Offensive Security Researcher & Industrial Systems Reliability Specialist. Working at the intersection of low-resource speech models (Pulaar/Wolof), hardware fault injection, and cyber-physical maintenance.',
  },

  /** Paragraphe d'accueil */
  intro:
    "Bienvenue dans le laboratoire d'**Ousmane Ba** (Rufisque / Dakar). À la convergence de la **cybersécurité matérielle** (injection de fautes *Faulty Cat*, audit OWASP Juice Shop, agents MCP), de la **fiabilité industrielle GMAO** (H&D Madar, IBS) et du traitement neuronal des **langues africaines** (claviers *Fulfuldekey, Wolofkey, Joolakey* & plateforme *Lingoo*).",

  /** Nombre de dépôts sur github.com/leonbathie */
  githubRepoCount: 29,

  /** Chiffres clés (category = filtre d'articles associé) */
  highlights: [
    { label: 'ASR WER (Pulaar)', value: '-34.2%', note: 'LoRA v3', category: 'speech-ai' },
    { label: 'Downtime (IBS)', value: '-25.0%', note: 'Weibull GMAO', category: 'industrial' },
    { label: 'Corpus national', value: '3 Langues', note: 'PUL/WOL/JOO', category: 'speech-ai' },
    { label: 'Infra & Réseau', value: 'CCNA', note: '+ Self-Hosted GPU', category: 'security' },
  ],

  /** Grands domaines de recherche (to = page du blog vers laquelle mène la carte) */
  domains: [
    {
      id: 'security',
      tag: 'SEC // HARDWARE',
      title: 'Faulty Cat & Audit OWASP',
      text: "Injection de fautes matérielles (Voltage/EMFI Glitching) sur bootloaders ARM Cortex-M, contournement d'instructions `BNE` et exploitation web automatisée (*OWASP Juice Shop*, *SecureCapture*).",
      cta: "Ouvrir l'oscilloscope 3D",
      to: { name: 'lab', params: { module: 'glitch' } },
    },
    {
      id: 'speech',
      tag: 'KOTLIN // ASR-TTS',
      title: '6 Claviers & Lingoo.tech',
      text: 'Architecture Android/iOS native pour **Fulfuldekey** (Tappirgal Pulaar), **Wolofkey**, **Joolakey**, **Sooninkekey**, **Mandinkakey**, **Seereerkey** et fine-tuning Whisper.',
      cta: "Inspecter l'écosystème Kotlin",
      to: { name: 'projects' },
    },
    {
      id: 'industrial',
      tag: 'GMAO // WEIBULL',
      title: 'Supervision H&D Madar & IBS',
      text: "Modélisation stochastique MTBF/MTTR (DimoMaint, Coswin, SAP PM), réduction de **-25% d'arrêts critiques** sur lignes d'embouteillage et automatisation Python/MySQL.",
      cta: 'Lire la monographie mathématique',
      to: { name: 'article', params: { slug: 'ind-weibull-2025' } },
    },
    {
      id: 'vision',
      tag: 'VISION // PQC',
      title: 'DIADJI Vision IA & MCP',
      text: "Logiciel de caisse express **DIADJI** avec scanner IA Vision, orchestrateur d'agents autonomes **MCP**, et extension Chrome **Flow-Video-Merger** 4K.",
      cta: 'Simuler le réseau Kyber-1024',
      to: { name: 'lab', params: { module: 'pqc' } },
    },
  ],

  /** Page « Parcours » */
  about: {
    kicker: "// DOSSIER D'INGÉNIERIE & PARCOURS",
    title: "Pourquoi unifier l'Électromécanique, l'IA et la Cybersécurité ?",
    text: "Dans les laboratoires de recherche modernes — qu'il s'agisse de robotique, d'infrastructures critiques ou de modèles de fondation — la frontière entre le code et les atomes s'efface. Mon parcours s'est construit sur cette double exigence : comprendre la physique des machines industrielles (usinage CNC, électromécanique, lignes d'embouteillage haute cadence) tout en concevant les couches logicielles et mathématiques qui les gouvernent ou les protègent.",
    timeline: [
      {
        period: 'Présent',
        current: true,
        role: 'Lead Tech @ Taro Learning & Direction @ Lingoo.tech',
        text: "Ingénierie de données IA sur mesure, fine-tuning ASR/TTS (Pulaar, Wolof, Joola), déploiement d'architectures RAG et agents vocaux.",
      },
      {
        period: '2023 — Présent',
        current: true,
        role: 'Superviseur & Planificateur Maintenance / Expert GMAO @ H&D Madar Industrie',
        text: 'Automatisation de la GMAO (DimoMaint, Coswin), pilotage analytique des KPI (MTBF, MTTR), ordonnancement et coordination des équipes techniques.',
      },
      {
        period: 'Académique',
        current: false,
        role: 'Licence 3 Informatique & Mathématiques Appliquées à la Cybersécurité',
        text: 'Couplé à un Brevet de Technicien en Électromécanique, Baccalauréat Technique T1 (Fabrication Mécanique) et certification réseau Cisco CCNA.',
      },
      {
        period: 'Écosystème',
        current: false,
        role: 'Campement Nyabinghi (Abéné) & Projets BTP',
        text: "Gestion d'un éco-lodge en Casamance, création de l'application locale **Jokeree** et conception d'outils de facturation proforma automatisés (WeasyPrint/Python) pour le secteur BTP à Baie de Boucotte / Diembéring.",
      },
    ],
  },
}
