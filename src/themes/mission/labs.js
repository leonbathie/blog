/** Modules du labo orbital de la forme « Mission Control » (id ↔ #/labo/<id>). */
export const LAB_MODULES = [
  { id: 'mcp', code: 'LAB 3.1', tab: 'SWARM MCP ORCHESTRATOR', palette: "Lab 3.1 : déployer l'essaim d'agents MCP" },
  { id: 'pqc', code: 'LAB 3.2', tab: 'CRYPTOGRAPHIE POST-QUANTIQUE', palette: 'Lab 3.2 : réseau euclidien Kyber / ML-KEM' },
  { id: 'hologram', code: 'LAB 3.3', tab: 'TÉLÉMÉTRIE ORBITALE 4D', palette: 'Lab 3.3 : scanner de télémétrie orbitale' },
]

/**
 * Les modules de cette forme ne portent pas les mêmes noms que ceux des autres formes.
 * Un lien `#/labo/weibull` venu de la monographie ou de la planche atterrit donc sur le
 * module le plus proche, plutôt que systématiquement sur le premier.
 */
export const MODULE_ALIASES = {
  glitch: 'pqc', // sécurité matérielle → réseau euclidien et blindage
  pulaar: 'mcp', // langues africaines → tâche « dataset » de l'essaim
  weibull: 'hologram', // fiabilité et relevés → télémétrie orbitale
}

/**
 * Tâches de l'essaim MCP.
 *
 * Dans la maquette d'origine, le sélecteur et la zone de consignes n'avaient aucun
 * effet : la console affichait toujours les deux mêmes agents. Chaque tâche a donc
 * ici son propre enchaînement d'agents, pour que les commandes servent à quelque chose.
 */
export const SWARM_TASKS = [
  {
    id: 'audit',
    label: 'Audit automatisé des vulnérabilités OWASP Juice Shop via MCP',
    prompt: "Lancer l'audit de sécurité et synchroniser les contre-mesures.",
    agents: [
      'Agent 1 [Auditeur Web] : connexion sécurisée au serveur MCP établie.',
      'Agent 2 [Fuzzer] : 214 requêtes rejouées sur les points d\'entrée Juice Shop.',
      'Agent 3 [Correcteur] : 3 injections SQL et 1 XSS stockée neutralisées.',
    ],
    done: '[SUCCÈS] Essaim synchronisé. Vulnérabilités colmatées, rapport signé.',
  },
  {
    id: 'dataset',
    label: 'Génération de dataset Pulaar/Wolof & fine-tuning Whisper',
    prompt: 'Collecter, nettoyer et aligner les corpus vocaux avant entraînement.',
    agents: [
      'Agent 1 [Collecteur] : 1 240 énoncés récupérés depuis Lingoo et AudioSheet IA.',
      'Agent 2 [Nettoyeur] : normalisation Unicode NFC des implosives ɓ ɗ ƴ ŋ.',
      'Agent 3 [Entraîneur] : adaptateur LoRA appliqué à Whisper-large-v3.',
    ],
    done: '[SUCCÈS] Jeu de données aligné. WER estimé en recul de 34,2 %.',
  },
  {
    id: 'firmware',
    label: 'Analyse de firmware ARM et détection de glitches Faulty Cat',
    prompt: 'Cartographier les branchements critiques et repérer les fenêtres exploitables.',
    agents: [
      'Agent 1 [Désassembleur] : image Cortex-M4 chargée, 18 412 instructions lues.',
      'Agent 2 [Traceur] : branchement conditionnel BNE isolé à 0x08000146.',
      'Agent 3 [Banc EMFI] : fenêtre exploitable relevée entre 175 et 205 ns.',
    ],
    done: '[SUCCÈS] Surface d\'attaque cartographiée. Contre-mesure proposée : double vérification.',
  },
]
