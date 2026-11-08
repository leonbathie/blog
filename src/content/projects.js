/**
 * Projets, systèmes en production et infrastructure — partagés par toutes les formes.
 */

const GITHUB = 'https://github.com/leonbathie'

export const repoCategories = [
  { id: 'sec', label: 'Cybersécurité' },
  { id: 'key', label: 'Claviers africains' },
  { id: 'ai', label: 'IA, Vision & Web' },
]

/** Sélection de dépôts GitHub (public: false = dépôt privé, le lien mène alors au profil) */
export const repos = [
  { name: 'fulfuldekey', lang: 'Kotlin', public: false, cat: 'key', desc: 'Tappirgal Pulaar : Clavier natif Android & iOS haute précision pour le Pulaar/Fulfulde avec prédiction lexicale.' },
  { name: 'wolofkey', lang: 'Kotlin', public: false, cat: 'key', desc: "Clavier Wolof Android & iOS décliné de l'architecture souveraine Tappirgal Pulaar." },
  { name: 'joolakey', lang: 'Kotlin', public: false, cat: 'key', desc: 'Clavier Joola Android & iOS avec support complet des diacritiques et caractères spéciaux.' },
  { name: 'sooninkekey', lang: 'Kotlin', public: false, cat: 'key', desc: "Clavier Sooninke mobile optimisé pour la saisie rapide et l'inclusion numérique." },
  { name: 'mandinkakey', lang: 'Kotlin', public: false, cat: 'key', desc: 'Clavier Mandinka Android & iOS issu du moteur modulaire Fulfuldekey.' },
  { name: 'seereerkey', lang: 'Kotlin', public: false, cat: 'key', desc: 'Clavier Seereer mobile avec disposition ergonomique dédiée aux langues sénégalaises.' },
  { name: 'pcfulfulde', lang: 'Python', public: true, cat: 'key', desc: "Pilote et utilitaire de clavier Fulfulde sur PC pour la bureautique et l'édition académique." },
  { name: 'lingoo', lang: 'JavaScript', public: false, cat: 'ai', desc: "Plateforme distribuée de collecte et validation de données vocales multilingues pour l'entraînement ASR/TTS." },
  { name: 'diadji', lang: 'Python', public: false, cat: 'ai', desc: 'DIADJI FAMILY : Logiciel de Caisse Express, Gestion des Stocks, Facturation PDF et Scanner IA Vision.' },
  { name: 'taro', lang: 'Kotlin', public: false, cat: 'ai', desc: 'Application mobile éducative Taro Learning : apprentissage interactif, syllabaires et contes africains.' },
  { name: 'flow-video-merger', lang: 'JavaScript', public: true, cat: 'ai', desc: 'Extension Chrome & studio web pour capturer, séquencer et assembler en 4K les vidéos générées par Google Flow (Veo).' },
  { name: 'SecureCapture', lang: 'Security', public: false, cat: 'sec', desc: 'Module durci de capture forensique et de sécurisation des flux sensibles.' },
  { name: 'juice-shop', lang: 'TypeScript', public: true, cat: 'sec', desc: "Environnement OWASP Juice Shop dédié à l'entraînement offensif, au pentest web et à l'automatisation d'exploits." },
  { name: 'jjuiceshop', lang: 'Security', public: true, cat: 'sec', desc: 'Scripts d\'analyse de vulnérabilités, payloads et résolution automatisée des défis OWASP.' },
  { name: 'samsumgadb', lang: 'Hardware/ADB', public: false, cat: 'sec', desc: 'Outils de diagnostic bas-niveau, débogage ADB et analyse matérielle sur terminaux mobiles.' },
  { name: 'SPARK-2026', lang: 'Jupyter', public: true, cat: 'ai', desc: 'Notebooks de recherche scientifique, traitement de données et modélisation IA (SPARK Academy).' },
].map((repo) => ({ ...repo, url: repo.public ? `${GITHUB}/${repo.name}` : GITHUB }))

/** Systèmes déployés (tone : emerald | sky | amber | purple) */
export const systems = [
  {
    code: 'SYS-01 // TARO LEARNING & LINGOO.TECH',
    status: 'PRODUCTION',
    tone: 'emerald',
    title: 'Pipeline ASR/TTS Pulaar, Wolof & Joola',
    text: 'Architecture complète de collecte de données (AudioSheet IA), nettoyage acoustique et fine-tuning de modèles Whisper, Sunbird et Kirikou sur GPU (RunPod / Colab Pro). Intégration dans des bots vocaux WhatsApp et des syllabaires interactifs 3D.',
    stack: ['PyTorch', 'Whisper-Large-v3', 'FastAPI', 'React Native', 'HuggingFace'],
  },
  {
    code: 'SYS-02 // H&D MADAR & IBS',
    status: 'INDUSTRIAL TELEMETRY',
    tone: 'sky',
    title: 'Automatisation GMAO & Analyse Prédictive de Fiabilité',
    text: "Refonte des flux GMAO (DimoMaint, Coswin, SAP PM) couplée à des scripts Python/MySQL et des tableaux de bord Power BI pour le suivi temps réel des indicateurs critiques (MTBF, MTTR, disponibilité). Réduction documentée de 25% des arrêts non planifiés sur lignes d'embouteillage.",
    stack: ['Python', 'MySQL', 'DimoMaint / Coswin', 'Power BI', 'ISO 9001 / HACCP'],
  },
  {
    code: 'SYS-03 // SEC-RESEARCH',
    status: 'LAB / EXPERIMENTAL',
    tone: 'amber',
    title: 'Agents Offensifs MCP & Injection de Fautes Matérielles',
    text: "Orchestration d'agents autonomes via le Model Context Protocol (MCP) pour l'audit de sécurité web reproductible, combinée à des bancs de test d'injection de fautes électromagnétiques et voltage glitching (Faulty Cat) sur microcontrôleurs embarqués.",
    stack: ['C / Embedded', 'Faulty Cat', 'Model Context Protocol', 'CCNA Security'],
  },
  {
    code: 'SYS-04 // INFRASTRUCTURE & MEDIA',
    status: 'OPEN-SOURCE',
    tone: 'purple',
    title: 'AudioSheet IA, VPN Multiplateforme & Contes 3D',
    text: "Développement d'un VPN sécurisé sur infrastructure VPS Contabo auto-hébergée (Docker, Nginx, n8n), d'outils d'extraction multimodale vidéo/audio pour la constitution de datasets, et numérisation 3D du patrimoine oral africain (Bouki et Leuk).",
    stack: ['Docker', 'Nginx', 'n8n', 'Flutter', 'Veo 3 / Flow'],
  },
]

/** Nœuds de calcul et bancs de test (tone : emerald | sky | amber) */
export const infrastructure = [
  {
    node: 'NODE-01 : VPS CONTABO',
    status: 'ONLINE',
    tone: 'emerald',
    title: 'Reverse Proxy, Automatisation & VPN',
    text: 'Instances Docker isolées, orchestration de workflows IA via n8n, serveur FastAPI, bases MySQL et passerelle VPN multiplateforme.',
  },
  {
    node: 'NODE-02 : RUNPOD / COLAB PRO',
    status: 'BURST GPU',
    tone: 'sky',
    title: 'Entraînement ASR/TTS & Vision',
    text: "Fine-tuning LoRA Whisper-v3, modèles Sunbird/Kirikou pour le Pulaar, et pipelines d'assemblage génératif 3D (Google Flow / Veo 3).",
  },
  {
    node: 'NODE-03 : HARDWARE BENCH',
    status: 'LAB LOCAL',
    tone: 'amber',
    title: 'Sécurité Matérielle & GMAO',
    text: "Banc d'injection de fautes EMFI/Glitching (Faulty Cat), équipements réseaux Cisco et synchronisation ERP/GMAO (DimoMaint, Coswin, SAP PM).",
  },
]
