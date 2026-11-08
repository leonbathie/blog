<script setup>
import { computed, inject, ref } from 'vue'
import RichText from '../../../components/RichText.vue'
import { kyberLevel, kyberTime, latticeError, latticeStatus } from '../../../core/lab-math.js'

/**
 * Lab 3.2 — Réseau euclidien Kyber / ML-KEM.
 * Dans la maquette, « sécurité quantique » et « statut lattice » étaient figés :
 * ils sont ici déduits de la dimension n et du bruit σ, sinon les curseurs ne
 * mesurent rien.
 */
const terminal = inject('terminal')

const n = ref(1024)
const sigma = ref(3.2)
const secret = ref('8f94e2c01b7a44d9e301a7f8c21094b76e20c4f8a19d3e5b77c0912a4f6e8d10')

const level = computed(() => kyberLevel(n.value))
const temps = computed(() => kyberTime(n.value))
const statut = computed(() => latticeStatus(sigma.value))

/* Courbe d'erreur gaussienne */
const W = 600
const H = 170
const BASE = 150
const LEFT = 35
const SPAN = 540

const curve = computed(() => {
  let d = ''
  for (let x = 0; x <= SPAN; x += 8) {
    const y = BASE - latticeError(x, SPAN / 2, sigma.value * 40) * 120
    d += x === 0 ? `M ${LEFT} ${y.toFixed(1)}` : ` L ${(LEFT + x).toFixed(1)} ${y.toFixed(1)}`
  }
  return d
})
const area = computed(() => `${curve.value} L ${LEFT + SPAN} ${BASE} L ${LEFT} ${BASE} Z`)

function encapsulate() {
  secret.value = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  terminal.beep(1200, 0.1)
  terminal.showToast(`Encapsulation KEM réussie (clé partagée ${level.value.bits} bits)`)
}
</script>

<template>
  <section class="term-card space-y-6 p-6 sm:p-8">
    <h3 class="font-term-display text-xl font-bold text-term-head sm:text-2xl">
      Cryptographie post-quantique <span class="text-term-accent">(Kyber / ML-KEM)</span>
    </h3>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <!-- Commandes -->
      <div class="space-y-5 font-term-mono text-xs">
        <div>
          <div class="mb-2 flex justify-between text-term-dim">
            <RichText tag="span" text="Dimension du réseau $n$" />
            <span class="font-bold text-term-accent-lt">{{ n }}</span>
          </div>
          <input id="term-n" v-model.number="n" type="range" min="512" max="2048" step="256" aria-label="Dimension du réseau" />
        </div>

        <div>
          <div class="mb-2 flex justify-between text-term-dim">
            <RichText tag="span" text="Bruit d'erreur $\sigma$" />
            <span class="font-bold text-term-accent2">{{ sigma.toFixed(2) }}</span>
          </div>
          <input id="term-sigma" v-model.number="sigma" type="range" min="1" max="6" step="0.1" aria-label="Bruit d'erreur" />
        </div>

        <button type="button" class="term-btn term-btn-on w-full py-3" @click="encapsulate">🔑 Tester l'encapsulation KEM</button>

        <p class="font-term-body text-[0.78rem] leading-relaxed text-term-dim">
          <RichText
            text="Un bruit trop faible laisse peu de marge face aux attaques par réduction de réseau ; un bruit trop fort fait échouer le déchiffrement. La zone exploitable se situe autour de $\sigma \approx 3$."
          />
        </p>
      </div>

      <!-- Relevés -->
      <div class="space-y-5 lg:col-span-2">
        <div class="grid grid-cols-1 gap-4 font-term-mono sm:grid-cols-3">
          <div class="border border-term-accent/30 bg-term-void p-4">
            <div class="text-[0.62rem] font-bold uppercase tracking-wider text-term-faint">Sécurité quantique</div>
            <div class="mt-1 text-base font-bold text-term-accent">Niveau {{ level.level }} ({{ level.bits }} bits)</div>
          </div>
          <div class="border border-term-accent/30 bg-term-void p-4">
            <div class="text-[0.62rem] font-bold uppercase tracking-wider text-term-faint">Temps de calcul</div>
            <div class="mt-1 text-base font-bold text-term-accent2">{{ temps.toFixed(2) }} ms</div>
          </div>
          <div class="border border-term-accent/30 bg-term-void p-4">
            <div class="text-[0.62rem] font-bold uppercase tracking-wider text-term-faint">Statut lattice</div>
            <div class="mt-1 text-xs font-bold" :class="statut.ok ? 'text-term-ok' : 'text-term-alert'" role="status">
              {{ statut.code }}
            </div>
          </div>
        </div>

        <div class="border border-term-accent/30 bg-term-void p-4">
          <div class="mb-2 flex flex-wrap justify-between gap-2 font-term-mono text-[0.68rem] text-term-faint">
            <RichText text="DISTRIBUTION D'ERREUR $e \sim \mathcal{D}_{\sigma}$" />
            <span>ÉCHANTILLONNAGE CENTRÉ</span>
          </div>
          <svg :viewBox="`0 0 ${W} ${H}`" class="h-40 w-full" role="img" :aria-label="`Distribution d'erreur pour sigma = ${sigma.toFixed(2)}`">
            <line :x1="LEFT" y1="20" :x2="W - 20" y2="20" class="stroke-term-line" stroke-dasharray="2,2" />
            <line :x1="LEFT" :y1="BASE" :x2="W - 20" :y2="BASE" class="stroke-term-line" />
            <path :d="area" class="fill-term-accent/[0.12]" />
            <path :d="curve" fill="none" class="stroke-term-accent" stroke-width="2.5" />
          </svg>
        </div>

        <div class="break-all border border-term-accent/30 bg-term-void p-4 font-term-mono text-xs text-term-ok">
          SHARED_SECRET_SHA3_512: {{ secret }}
        </div>
      </div>
    </div>
  </section>
</template>
