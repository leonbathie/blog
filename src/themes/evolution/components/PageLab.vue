<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import RichText from '../../../components/RichText.vue'
import { useThemes } from '../../../core/themes.js'
import {
  availability,
  compressionRate,
  IMPLOSIVES,
  morphTokens,
  PULAAR_SAMPLES,
  splitWords,
  standardTokens,
  survival,
  WEIBULL_PRESETS,
  weibullRegime,
} from '../../../core/lab-math.js'
import { LABELS } from '../eras.js'

/**
 * Le laboratoire dans les couleurs de l'époque : tokenisation Pulaar et
 * fiabilité de Weibull. Les formules vivent dans src/core/lab-math.js.
 * Le premier module du laboratoire s'ouvre dans la forme LeonTechLab.
 */
const props = defineProps({ era: { type: Object, required: true }, module: { type: String, default: 'glitch' } })
const L = computed(() => LABELS[props.era.lang])
const T = computed(
  () =>
    ({
      en: {
        other: 'This module opens in the LeonTechLab form of the blog.',
        open: 'Open in LeonTechLab',
        text: 'Measured text',
        insert: 'Insert',
        standard: 'Standard Whisper',
        morph: 'Taro / Lingoo tokenizer',
        gain: 'Compression',
        eta: 'MTBF ($\\eta$ hours)',
        beta: 'Wear factor ($\\beta$)',
        mttr: 'MTTR (hours)',
        mission: 'Mission time (hours)',
        availability: 'Availability',
        survival: 'Survival at',
        regime: 'Regime',
        regimes: { infant: 'Infant mortality / burn-in', random: 'Random (constant)', wear: 'Mechanical wear-out' },
        presets: ['Mechanical wear-out ($\\beta=2.2$)', 'IBS preventive plan (−25% stoppages)'],
      },
      fr: {
        other: 'Ce module s’ouvre dans la forme LeonTechLab du blog.',
        open: 'Ouvrir dans LeonTechLab',
        text: 'Texte mesuré',
        insert: 'Insérer',
        standard: 'Whisper standard',
        morph: 'Tokenizer Taro / Lingoo',
        gain: 'Compression',
        eta: 'MTBF ($\\eta$ heures)',
        beta: 'Facteur d’usure ($\\beta$)',
        mttr: 'MTTR (heures)',
        mission: 'Durée de mission (heures)',
        availability: 'Disponibilité',
        survival: 'Survie à',
        regime: 'Régime',
        regimes: { infant: 'Jeunesse / rodage', random: 'Aléatoire (constant)', wear: 'Usure mécanique' },
        presets: ['Usure mécanique ($\\beta=2.2$)', 'Plan préventif IBS (−25 % d’arrêts)'],
      },
    })[props.era.lang],
)

const { setTheme } = useThemes()
const anchors = { glitch: ref(null), pulaar: ref(null), weibull: ref(null) }

/* ---------- Tokenisation ---------- */
const text = ref(PULAAR_SAMPLES[0].text)
const field = ref(null)
const words = computed(() => splitWords(text.value))
const std = computed(() => standardTokens(words.value))
const morph = computed(() => morphTokens(words.value))
const gain = computed(() => compressionRate(std.value, morph.value))
function insert(char) {
  text.value += char
  field.value?.focus()
}

/* ---------- Weibull ---------- */
const eta = ref(150)
const beta = ref(1.2)
const mttr = ref(4.5)
const mission = ref(72)
const dispo = computed(() => availability(eta.value, mttr.value))
const survie = computed(() => survival(mission.value, eta.value, beta.value) * 100)
// lab-math renvoie le régime en français : on le traduit par sa clé
const REGIMES = { 'Jeunesse / Rodage': 'infant', 'Aléatoire (Constant)': 'random', 'Usure Mécanique': 'wear' }
const regime = computed(() => T.value.regimes[REGIMES[weibullRegime(beta.value)] ?? 'random'])
/** Nombres et pourcentages à la typographie de la langue de l'époque */
const num = (v, digits = 1) =>
  Number(v).toLocaleString(props.era.lang === 'en' ? 'en-US' : 'fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const pct = (v, digits = 1) => (props.era.lang === 'en' ? `${num(v, digits)}%` : `${num(v, digits)} %`)
function preset(p) {
  eta.value = p.eta
  beta.value = p.beta
  mttr.value = p.mttr
  mission.value = p.mission
}
const W = 520
const H = 180
const PAD = 36
const MAX_T = 300
const xOf = (time) => PAD + (time / MAX_T) * (W - PAD - 10)
const yOf = (v) => 10 + (1 - v) * (H - 34)
const curve = computed(() => {
  let d = ''
  for (let time = 0; time <= MAX_T; time += 4) d += `${time ? ' L' : 'M'} ${xOf(time).toFixed(1)} ${yOf(survival(time, eta.value, beta.value)).toFixed(1)}`
  return d
})

/* ---------- Défilement vers le module demandé ---------- */
async function focusModule(id) {
  await nextTick()
  anchors[id]?.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
watch(() => props.module, focusModule)
onMounted(() => {
  if (props.module && props.module !== 'glitch') focusModule(props.module)
})
</script>

<template>
  <div class="space-y-6 p-4 sm:p-6">
    <h1 class="era-h1 text-2xl font-bold">{{ L.lab }}</h1>

    <!-- Module 1 : dans la forme LeonTechLab -->
    <section :ref="anchors.glitch" class="era-panel scroll-mt-4 p-3">
      <h2 class="era-h2 text-[1.05rem]">1. {{ L.glitch }}</h2>
      <p class="era-muted mt-1 text-[0.9rem]">{{ T.other }}</p>
      <button type="button" class="era-btn mt-2" @click="setTheme('leontechlab')">{{ T.open }} →</button>
    </section>

    <!-- Module 2 : tokenisation -->
    <section :ref="anchors.pulaar" class="era-panel scroll-mt-4 p-3">
      <h2 class="era-h2 text-[1.05rem]">2. {{ L.tokens }}</h2>
      <div class="mt-2 flex flex-wrap gap-1.5">
        <button v-for="s in PULAAR_SAMPLES" :key="s.label" type="button" class="era-btn" :class="text === s.text ? 'era-btn-on' : ''" @click="text = s.text">
          {{ s.label }}
        </button>
      </div>
      <label for="evo-pulaar" class="era-muted mt-3 block text-[0.85rem]">{{ T.text }}</label>
      <input id="evo-pulaar" ref="field" v-model="text" type="text" class="era-field mt-1" lang="ff" spellcheck="false" />
      <p class="mt-2 flex flex-wrap items-center gap-1.5 text-[0.9rem]">
        <span class="era-muted">{{ T.insert }}{{ L.colon }}</span>
        <button v-for="c in IMPLOSIVES" :key="c" type="button" class="era-btn px-2" @click="insert(c)">{{ c }}</button>
      </p>
      <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p class="text-[0.85rem]"><b>{{ T.standard }}</b> — {{ std.length }} tokens</p>
          <p class="mt-1 flex flex-wrap gap-1" lang="ff"><span v-for="(tk, i) in std" :key="`s${i}`" class="era-chip">{{ tk }}</span></p>
        </div>
        <div>
          <p class="text-[0.85rem]"><b>{{ T.morph }}</b> — {{ morph.length }} tokens</p>
          <p class="mt-1 flex flex-wrap gap-1" lang="ff"><span v-for="(tk, i) in morph" :key="`m${i}`" class="era-chip">{{ tk }}</span></p>
        </div>
      </div>
      <p class="mt-2 text-[0.9rem] font-bold text-[rgb(var(--era-accent))]">{{ T.gain }}{{ L.colon }}−{{ pct(gain, 0) }}</p>
    </section>

    <!-- Module 3 : Weibull -->
    <section :ref="anchors.weibull" class="era-panel scroll-mt-4 p-3">
      <h2 class="era-h2 text-[1.05rem]">3. {{ L.weibull }}</h2>
      <div class="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="space-y-2 text-[0.9rem]">
          <label class="block"><RichText :text="T.eta" />{{ L.colon }}<b>{{ eta }}</b><input v-model.number="eta" type="range" min="30" max="400" /></label>
          <label class="block"><RichText :text="T.beta" />{{ L.colon }}<b>{{ num(beta) }}</b><input v-model.number="beta" type="range" min="0.5" max="3.5" step="0.1" /></label>
          <label class="block">{{ T.mttr }}{{ L.colon }}<b>{{ num(mttr) }}</b><input v-model.number="mttr" type="range" min="0.5" max="24" step="0.5" /></label>
          <label class="block">{{ T.mission }}{{ L.colon }}<b>{{ mission }}</b><input v-model.number="mission" type="range" min="4" max="300" step="4" /></label>
          <p>{{ T.availability }}{{ L.colon }}<b class="text-[rgb(var(--era-accent))]">{{ pct(dispo) }}</b></p>
          <p>{{ T.survival }} {{ mission }} h{{ L.colon }}<b class="text-[rgb(var(--era-accent))]">{{ pct(survie) }}</b></p>
          <p>{{ T.regime }}{{ L.colon }}{{ regime }}</p>
          <p class="flex flex-wrap gap-1.5">
            <button v-for="(p, i) in WEIBULL_PRESETS" :key="p.label" type="button" class="era-btn" @click="preset(p)"><RichText :text="T.presets[i] ?? p.label" /></button>
          </p>
        </div>
        <svg :viewBox="`0 0 ${W} ${H}`" class="w-full" role="img" :aria-label="`R(t)${L.colon}${pct(survie, 0)} — ${mission} h`">
          <g stroke="currentColor" class="text-[rgb(var(--era-line))]" stroke-dasharray="2 4">
            <line v-for="v in [0, 0.5, 1]" :key="v" :x1="PAD" :x2="W - 10" :y1="yOf(v)" :y2="yOf(v)" />
          </g>
          <g class="fill-[rgb(var(--era-muted))]" style="font-size: 14px">
            <text v-for="v in [0, 0.5, 1]" :key="`l${v}`" :x="PAD - 6" :y="yOf(v) + 5" text-anchor="end">{{ v * 100 }}%</text>
            <text :x="PAD" :y="H - 4">0 h</text>
            <text :x="W - 10" :y="H - 4" text-anchor="end">{{ MAX_T }} h</text>
          </g>
          <path :d="curve" fill="none" stroke="currentColor" class="text-[rgb(var(--era-accent))]" stroke-width="2.5" />
          <line :x1="xOf(mission)" :x2="xOf(mission)" :y1="10" :y2="yOf(0)" stroke="currentColor" class="text-[rgb(var(--era-link))]" stroke-dasharray="3 3" />
          <circle :cx="xOf(mission)" :cy="yOf(survie / 100)" r="4" class="fill-[rgb(var(--era-link))]" />
        </svg>
      </div>
    </section>
  </div>
</template>
