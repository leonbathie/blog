/** Simulateurs du laboratoire de la forme « Monographie » (l'id correspond à #/labo/<id>). */
export const LAB_MODULES = [
  {
    id: 'weibull',
    tab: 'LAB 3.1 // FIABILITÉ WEIBULL & MTBF',
    cta: String.raw`Tester le Simulateur de Weibull $(\beta, \eta)$ dans le Laboratoire (Module 3.1)`,
    palette: 'Lab 3.1 : Simulateur de Fiabilité Weibull & MTBF',
  },
  {
    id: 'pulaar',
    tab: 'LAB 3.2 // TOKENIZER & SPECTROGRAMME PULAAR',
    cta: "Ouvrir l'Inspecteur de Tokenisation Pulaar dans le Laboratoire (Module 3.2)",
    palette: 'Lab 3.2 : Inspecteur de Tokenisation Pulaar & Spectrogramme',
  },
  {
    id: 'glitch',
    tab: 'LAB 3.3 // FAULTY CAT EMFI GLITCHING',
    cta: "Lancer le Banc d'Injection de Fautes Faulty Cat (Module 3.3)",
    palette: "Lab 3.3 : Banc d'Injection de Fautes Faulty Cat",
  },
]
