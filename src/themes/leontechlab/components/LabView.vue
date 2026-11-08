<script setup>
import { computed, inject, nextTick, onMounted, ref, watch } from 'vue'
import RichText from '../../../components/RichText.vue'
import { tone } from '../../../core/audio.js'
import {
  availability,
  BNE_WINDOW,
  CALIBRATION,
  compressionRate,
  glitchOutcome,
  IMPLOSIVE_RE,
  IMPLOSIVES,
  morphTokens,
  PULAAR_SAMPLES,
  splitWords,
  standardTokens,
  survival,
  WEIBULL_PRESETS,
  weibullRegime,
} from '../../../core/lab-math.js'

/**
 * Laboratoire interactif : les trois simulateurs de la maquette, empilés comme
 * sur l'original. Les formules viennent de src/core/lab-math.js, partagé avec
 * les autres formes du blog.
 */
const props = defineProps({ module: { type: String, default: 'glitch' } })
const leon = inject('leon')

const anchors = { glitch: ref(null), pulaar: ref(null), weibull: ref(null) }
/** Onglets : un lien par simulateur, pratique au doigt sur une longue page */
const MODULES = [
  { id: 'glitch', label: '1. Matériel' },
  { id: 'pulaar', label: '2. Tokenisation' },
  { id: 'weibull', label: '3. Fiabilité' },
]

/* ---------- 1. Banc d'injection de fautes ---------- */
const offset = ref(145)
const width = ref(25)
const volt = ref(1.65)
const outcome = computed(() => glitchOutcome({ offset: offset.value, width: width.value, volt: volt.value }))
const verdict = computed(() => {
  if (outcome.value.success) return { code: 'INSTRUCTION SAUTÉE — BOOTLOADER OUVERT', tone: 'text-leon-green' }
  if (outcome.value.brownout) return { code: 'BROWNOUT RESET — CIBLE REDÉMARRÉE', tone: 'text-leon-red' }
  return { code: 'SECURE BOOT VERROUILLÉ — AUCUNE FAUTE', tone: 'text-leon-dim' }
})
function calibrate() {
  offset.value = CALIBRATION.offset
  width.value = CALIBRATION.width
  volt.value = CALIBRATION.volt
  leon.toast('Paramètres calibrés sur la fenêtre BNE')
}

/* ---------- 2. Tokenisation Pulaar ---------- */
const text = ref(PULAAR_SAMPLES[0].text)
const input = ref(null)
const words = computed(() => splitWords(text.value))
const std = computed(() => standardTokens(words.value))
const morph = computed(() => morphTokens(words.value))
const gain = computed(() => compressionRate(std.value, morph.value))
function insert(char) {
  text.value += char
  input.value?.focus()
}
function synth() {
  const value = text.value || 'Pulaar'
  for (let i = 0; i < Math.min(value.length, 14); i++) {
    const code = value.charCodeAt(i)
    const implosive = IMPLOSIVE_RE.test(value[i])
    tone({
      freq: 190 + (code % 18) * 22 + (implosive ? 160 : 0),
      type: implosive ? 'square' : 'triangle',
      duration: 0.06,
      gain: 0.1,
      attack: 0.012,
      at: i * 0.065,
    })
  }
  leon.toast('Synthèse 8-bit émise')
}

/* ---------- 3. Fiabilité Weibull ---------- */
const eta = ref(150)
const beta = ref(1.2)
const mttr = ref(4.5)
const mission = ref(72)
const dispo = computed(() => availability(eta.value, mttr.value))
const survie = computed(() => survival(mission.value, eta.value, beta.value) * 100)
const regime = computed(() => weibullRegime(beta.value))
function preset(p) {
  eta.value = p.eta
  beta.value = p.beta
  mttr.value = p.mttr
  mission.value = p.mission
  leon.toast('Préréglage GMAO appliqué')
}

const W = 560
const H = 120
const PAD = 34
const MAX_T = 300
const curve = computed(() => {
  let d = ''
  for (let t = 0; t <= MAX_T; t += 4) {
    const x = PAD + (t / MAX_T) * (W - PAD - 10)
    const y = H - survival(t, eta.value, beta.value) * (H - 14)
    d += t === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return d
})
/** Point de la courbe au temps de mission */
const missionX = computed(() => PAD + (Math.min(mission.value, MAX_T) / MAX_T) * (W - PAD - 10))
const missionY = computed(() => H - survival(mission.value, eta.value, beta.value) * (H - 14))

/* ---------- Mise au point sur le module demandé ---------- */
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
  <div class="space-y-2">
    <section class="leon-panel">
      <h2 class="leon-panel-head leon-panel-head-wrap">Laboratoire interactif — simulateurs temps réel</h2>
      <nav class="flex flex-wrap items-center gap-x-1 gap-y-0.5 px-2 pb-1.5 pt-0.5 text-[1.05rem]" aria-label="Modules du laboratoire">
        <span class="text-leon-dim">Modules&nbsp;:</span>
        <RouterLink
          v-for="m in MODULES"
          :key="m.id"
          :to="{ name: 'lab', params: { module: m.id } }"
          class="leon-btn"
          :class="module === m.id ? 'leon-btn-on' : ''"
          :aria-current="module === m.id ? 'true' : undefined"
        >
          {{ m.label }}
        </RouterLink>
      </nav>
    </section>

    <!-- 1. Faulty Cat -->
    <section :ref="anchors.glitch" class="leon-panel leon-panel-pad scroll-mt-14">
      <h3 class="leon-panel-head leon-panel-head-wrap">
        1. Banc d'injection de fautes « Faulty Cat » (bootloader ARM Cortex-M)
      </h3>
      <RichText
        tag="p"
        class="text-[1.08rem] leading-tight text-leon-ink/85"
        :text="`Perturbez le rail d'alimentation pendant le décodage de \`BNE secure_lock\` sans déclencher de Brownout Reset. Fenêtre exploitable : $[${BNE_WINDOW.start}\\text{–}${BNE_WINDOW.end}\\text{ ns}]$.`"
      />

      <div class="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div class="space-y-3 text-[1.05rem]">
          <div>
            <div class="flex justify-between text-leon-dim">
              <RichText tag="span" text="Délai glitch ($\Delta t$) :" />
              <span class="text-leon-green">{{ offset }} ns</span>
            </div>
            <input id="leon-offset" v-model.number="offset" type="range" min="50" max="300" step="5" aria-label="Délai du glitch" />
          </div>
          <div>
            <div class="flex justify-between text-leon-dim">
              <RichText tag="span" text="Largeur ($\delta$) :" />
              <span class="text-leon-green">{{ width }} ns</span>
            </div>
            <input id="leon-width" v-model.number="width" type="range" min="5" max="90" step="5" aria-label="Largeur du glitch" />
          </div>
          <div>
            <div class="flex justify-between text-leon-dim">
              <RichText tag="span" text="Chute tension ($\Delta V$) :" />
              <span class="text-leon-green">−{{ volt.toFixed(2) }} V</span>
            </div>
            <input id="leon-volt" v-model.number="volt" type="range" min="0.5" max="2.8" step="0.05" aria-label="Chute de tension" />
          </div>
          <button type="button" class="leon-btn leon-btn-gold w-full" @click="calibrate">
            Calibrer auto ({{ CALIBRATION.offset }} ns)
          </button>
        </div>

        <div class="space-y-2">
          <div class="border border-leon-green/30 bg-leon-bg p-3 text-[1rem] leading-tight">
            <div class="text-leon-dim">0x08000144: CMP R0, #0x00</div>
            <div class="bg-leon-gold/15 px-1 text-leon-gold">0x08000146: BNE 0x08000190 ← cible</div>
            <div class="text-leon-dim">0x08000148: BL unlock_debug_uart</div>
          </div>
          <div class="border p-2 text-center text-[1.02rem]" :class="verdict.tone" role="status">
            {{ verdict.code }}
          </div>
        </div>
      </div>
    </section>

    <!-- 2. Tokenisation -->
    <section :ref="anchors.pulaar" class="leon-panel leon-panel-pad scroll-mt-14">
      <h3 class="leon-panel-head leon-panel-head-wrap">
        2. Inspecteur de tokenisation Pulaar / Wolof (Lingoo &amp; Tappirgal)
      </h3>

      <label for="leon-pulaar" class="mb-1 block text-[1.02rem] text-leon-dim">Texte mesuré</label>
      <input id="leon-pulaar" ref="input" v-model="text" type="text" class="leon-field" />

      <div class="mt-2 flex flex-wrap items-center gap-1.5 text-[1.05rem]">
        <span class="text-leon-dim">Insérer :</span>
        <button
          v-for="char in IMPLOSIVES"
          :key="char"
          type="button"
          class="leon-btn leon-btn-char"
          :aria-label="`Insérer ${char}`"
          @click="insert(char)"
        >
          {{ char }}
        </button>
        <button type="button" class="leon-btn ml-auto" @click="synth">▶ Synthèse 8-bit</button>
      </div>

      <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div class="border border-leon-red/50 p-2.5">
          <div class="mb-1.5 flex justify-between text-[0.98rem]">
            <span class="text-leon-dim">Whisper standard</span>
            <span class="font-bold text-leon-red">{{ std.length }} tokens</span>
          </div>
          <div class="flex flex-wrap gap-1 text-[1rem]">
            <span v-for="(tk, i) in std" :key="`s${i}`" class="border border-leon-red/50 px-1 text-leon-red">{{ tk }}</span>
          </div>
        </div>
        <div class="border border-leon-green/40 p-2.5">
          <div class="mb-1.5 flex justify-between text-[0.98rem]">
            <span class="text-leon-dim">Tokenizer Taro / Lingoo</span>
            <span class="font-bold text-leon-green">{{ morph.length }} tokens</span>
          </div>
          <div class="flex flex-wrap gap-1 text-[1rem]">
            <span v-for="(tk, i) in morph" :key="`m${i}`" class="border border-leon-green/40 px-1 text-leon-green">{{ tk }}</span>
          </div>
        </div>
      </div>
      <p class="mt-2 text-[1rem] text-leon-gold">Compression : −{{ gain }} % de tokens</p>
    </section>

    <!-- 3. Weibull -->
    <section :ref="anchors.weibull" class="leon-panel leon-panel-pad scroll-mt-14">
      <h3 class="leon-panel-head leon-panel-head-wrap">
        3. Simulateur GMAO : loi de Weibull &amp; disponibilité industrielle
      </h3>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div class="space-y-3 text-[1.05rem] lg:col-span-5">
          <div>
            <div class="flex justify-between text-leon-dim">
              <RichText tag="span" text="MTBF ($\eta$ heures) :" />
              <span class="text-leon-green">{{ eta }} h</span>
            </div>
            <input id="leon-eta" v-model.number="eta" type="range" min="30" max="400" aria-label="Vie caractéristique" />
          </div>
          <div>
            <div class="flex justify-between text-leon-dim">
              <RichText tag="span" text="Facteur d'usure ($\beta$) :" />
              <span class="text-leon-green">{{ beta.toFixed(1) }}</span>
            </div>
            <input id="leon-beta" v-model.number="beta" type="range" min="0.5" max="3.5" step="0.1" aria-label="Facteur de forme" />
          </div>
          <div>
            <div class="flex justify-between text-leon-dim">
              <span>MTTR :</span>
              <span class="text-leon-green">{{ mttr.toFixed(1) }} h</span>
            </div>
            <input id="leon-mttr" v-model.number="mttr" type="range" min="0.5" max="24" step="0.5" aria-label="Temps de réparation" />
          </div>
          <div>
            <div class="flex justify-between text-leon-dim">
              <span>Durée de mission :</span>
              <span class="text-leon-green">{{ mission }} h</span>
            </div>
            <input id="leon-mission" v-model.number="mission" type="range" min="4" max="300" step="4" aria-label="Durée de mission" />
          </div>
          <div class="border border-leon-green/30 bg-leon-bg p-2 text-[1.02rem]">
            <div>Disponibilité : <span class="text-leon-green">{{ dispo.toFixed(1) }} %</span></div>
            <div>Survie à {{ mission }} h : <span class="text-leon-gold">{{ survie.toFixed(1) }} %</span></div>
            <div>Régime : <span class="text-leon-ink">{{ regime }}</span></div>
          </div>
          <div class="flex flex-wrap gap-x-1 gap-y-0.5">
            <button v-for="p in WEIBULL_PRESETS" :key="p.label" type="button" class="leon-btn leon-btn-wrap" @click="preset(p)">
              <RichText :text="p.label" />
            </button>
          </div>
        </div>

        <div class="lg:col-span-7">
          <svg :viewBox="`0 0 ${W} ${H + 18}`" class="w-full" role="img" :aria-label="`Courbe de survie, ${survie.toFixed(0)} % à ${mission} heures`">
            <line :x1="PAD" y1="14" :x2="W - 10" y2="14" stroke="currentColor" class="text-leon-dark" stroke-dasharray="2 3" />
            <line :x1="PAD" :y1="H" :x2="W - 10" :y2="H" stroke="currentColor" class="text-leon-dim" />
            <path :d="curve" fill="none" stroke="currentColor" class="text-leon-green" stroke-width="2" />
            <line :x1="missionX" y1="14" :x2="missionX" :y2="H" stroke="currentColor" class="text-leon-gold" stroke-dasharray="3 3" />
            <rect :x="missionX - 3" :y="missionY - 3" width="6" height="6" class="fill-leon-gold" />
            <text x="4" y="18" class="fill-leon-dim" style="font-size: 16px">100%</text>
            <text x="10" :y="H" class="fill-leon-dim" style="font-size: 16px">0%</text>
            <text :x="W - 10" :y="H + 14" text-anchor="end" class="fill-leon-dim" style="font-size: 16px">{{ MAX_T }} h</text>
          </svg>
        </div>
      </div>
    </section>
  </div>
</template>
