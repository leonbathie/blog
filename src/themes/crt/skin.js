import { createRain } from './rain.js'

/**
 * Peau « CRT » du socle commun (src/themes/_terminal/).
 * Les couleurs sont dans theme.css ; ici, les mots et le fond animé.
 */
export const CRT_SKIN = {
  id: 'crt',
  rootClass: 'theme-crt',

  bar: {
    id: 'OUSMANE_BA // 2026-2050',
    fields: [
      { label: 'GRID: DAKAR_CLUSTER_V9', tone: 'text-term-accent2', hidden: '' },
      { label: 'POST-QUANTUM: KYBER-1024', tone: 'text-term-info', hidden: 'hidden sm:inline' },
    ],
    clockLabel: 'TIME',
  },

  buttons: { sound: 'SOUND', backdrop: 'QUANTUM_GRID', cli: 'MCP_CLI [^K]' },
  backdropName: 'Grille quantique',

  kicker: '// AUTONOMOUS AGENTS, MCP PROTOCOL & POST-SECURITY LAB (2026-2050)',
  panel: { title: 'NEURAL_SWARM.SYS', status: '4 AGENTS ACTIFS' },

  tabs: [
    { code: '01', label: 'MONOGRAPHIES_FUTURISTES' },
    { code: '02', label: 'SWARM & ARTEFACTS_GITHUB' },
    { code: '03', label: 'LAB_QUANTIQUE' },
    { code: '04', label: 'VISION_2050' },
  ],

  labs: {
    mcp: 'SWARM MCP ORCHESTRATOR',
    pqc: 'CHIFFREMENT POST-QUANTIQUE',
    hologram: 'VISUALISEUR NEURAL 4D',
  },

  footer: 'OUSMANE BA // DAKAR QUANTUM GRID v9.4 // 2026-2050 FUTURE-READY',

  createBackground: createRain,
}
