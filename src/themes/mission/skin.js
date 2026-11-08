import { profile } from '../../content/index.js'
import { createRadar } from './radar.js'

/**
 * Peau « Mission Control » du socle commun (src/themes/_terminal/).
 * Les couleurs sont dans theme.css ; ici, les mots et le fond animé.
 *
 * Les classes Tailwind écrites ici sont bien détectées : la configuration
 * scanne ./src/**\/*.{vue,js,md}.
 */
export const MISSION_SKIN = {
  id: 'mission',
  rootClass: 'theme-mission',

  bar: {
    id: 'MISSION_ID: OUSMANE_BA_2050',
    fields: [
      { label: 'SECTEUR: DAKAR_ORBIT_01', tone: 'text-term-accent2', hidden: '' },
      { label: 'STATUS: NOMINAL', tone: 'text-term-info', hidden: 'hidden sm:inline' },
    ],
    clockLabel: 'MET',
  },

  buttons: { sound: 'AUDIO', backdrop: 'RADAR', cli: 'CLI [^K]' },
  backdropName: 'Radar orbital',

  kicker: profile.focus.toUpperCase(),
  panel: { title: 'ORBITAL_TELEMETRY', status: 'ONLINE' },

  tabs: [
    { code: 'LOG 01', label: 'MONOGRAPHIES DE RECHERCHE' },
    { code: 'LOG 02', label: 'GITHUB & ARTEFACTS SWARM' },
    { code: 'LOG 03', label: 'LABO ORBITAL & PQC' },
    { code: 'LOG 04', label: 'STRATÉGIE 2050' },
  ],

  labs: {
    mcp: 'SWARM MCP ORCHESTRATOR',
    pqc: 'CRYPTOGRAPHIE POST-QUANTIQUE',
    hologram: 'TÉLÉMÉTRIE ORBITALE 4D',
  },

  footer: `${profile.name.toUpperCase()} // MISSION CONTROL ${profile.city.toUpperCase()} // 2026-2050 FLIGHT READY`,

  createBackground: createRadar,
}
