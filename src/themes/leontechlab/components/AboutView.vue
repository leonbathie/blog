<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import RichText from '../../../components/RichText.vue'
import ProfileAvatar from './ProfileAvatar.vue'
import { t, useLeon } from '../i18n.js'

/** Colonne centrale : présentation, parcours, chiffres clés, domaines et contact. */
const props = defineProps({
  /** Vrai quand l'adresse vise la section contact (#/parcours#contact) */
  contact: { type: Boolean, default: false },
})
const { lang, content } = useLeon()
const profile = computed(() => content.value.profile)
const contactBox = ref(null)

watch(
  () => props.contact,
  async (on) => {
    if (!on) return
    await nextTick()
    contactBox.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  },
  { immediate: true },
)
</script>

<template>
  <div class="space-y-2">
    <!-- Présentation -->
    <section class="leon-panel">
      <h2 class="leon-panel-head">{{ t('about.title', { name: profile.name }) }}</h2>
      <div class="leon-panel-body">
        <div class="flex items-start gap-3 sm:gap-4">
          <ProfileAvatar :size="88" />
          <div class="min-w-0 text-[1.1rem] leading-tight">
            <p class="text-[1.45rem] leading-tight text-leon-gold">{{ profile.name }}</p>
            <a :href="profile.links.github" target="_blank" rel="noopener noreferrer" class="text-leon-green hover:text-leon-bright">
              @{{ profile.handle }}
            </a>
            <p class="text-leon-ink/85">{{ profile.role }}</p>
            <p class="text-leon-dim">{{ profile.city }}, {{ profile.country }}</p>
          </div>
        </div>
        <p class="mt-3 text-[1.08rem] text-leon-cyan">&gt;&gt; {{ profile.focus }}</p>
        <p class="mt-2 text-[1.15rem] leading-tight text-leon-ink/90">{{ profile.tagline[lang] ?? profile.tagline.fr }}</p>
      </div>
    </section>

    <!-- Dossier -->
    <section class="leon-panel">
      <h2 class="leon-panel-head leon-panel-head-wrap">{{ profile.about.kicker.replace(/^\/\/\s*/, '') }}</h2>
      <div class="leon-panel-body">
        <h3 class="text-[1.4rem] leading-tight text-leon-cyan">{{ profile.about.title }}</h3>
        <p class="mt-2 text-[1.15rem] leading-tight text-leon-ink/90">{{ profile.about.text }}</p>
      </div>
    </section>

    <!-- Parcours -->
    <section class="leon-panel">
      <h2 class="leon-panel-head">{{ t('about.career') }}</h2>
      <ol class="divide-y divide-leon-green/25">
        <li
          v-for="step in profile.about.timeline"
          :key="step.role"
          class="grid grid-cols-1 gap-x-4 gap-y-0.5 px-3 py-2.5 sm:grid-cols-[9.5rem_minmax(0,1fr)]"
        >
          <p class="text-[1.05rem]">
            <span class="text-leon-gold">[{{ step.period }}]</span>
            <span v-if="step.current" class="ml-1 text-leon-green sm:ml-0 sm:block">{{ t('about.current') }}</span>
          </p>
          <div class="min-w-0">
            <h3 class="text-[1.22rem] leading-tight text-leon-green">{{ step.role }}</h3>
            <RichText tag="p" class="mt-1 text-[1.08rem] leading-tight text-leon-ink/85" :text="step.text" />
          </div>
        </li>
      </ol>
    </section>

    <!-- Chiffres clés -->
    <section class="leon-panel">
      <h2 class="leon-panel-head">{{ t('about.figures') }}</h2>
      <ul class="grid grid-cols-2 gap-2 p-2 md:grid-cols-4">
        <li v-for="h in profile.highlights" :key="h.label" class="border border-leon-green/40 p-2 text-center">
          <p class="text-[1.6rem] leading-none text-leon-gold">{{ h.value }}</p>
          <p class="mt-1 text-[1.02rem] leading-tight text-leon-ink/90">{{ h.label }}</p>
          <p class="text-[0.98rem] text-leon-dim">{{ h.note }}</p>
        </li>
      </ul>
    </section>

    <!-- Domaines -->
    <section class="leon-panel">
      <h2 class="leon-panel-head">{{ t('about.domains') }}</h2>
      <div class="grid grid-cols-1 gap-2 p-2 md:grid-cols-2">
        <RouterLink
          v-for="d in profile.domains"
          :key="d.id"
          :to="d.to"
          class="group block border border-leon-green/40 p-2.5 transition-colors hover:border-leon-green hover:bg-leon-green/5"
        >
          <span class="block text-[1rem] text-leon-gold">{{ d.tag }}</span>
          <span class="mt-0.5 block text-[1.25rem] leading-tight text-leon-cyan">{{ d.title }}</span>
          <RichText tag="span" class="mt-1 block text-[1.06rem] leading-tight text-leon-ink/85" :text="d.text" />
          <span class="mt-1.5 block text-[1.04rem] text-leon-green group-hover:text-leon-bright">[ {{ d.cta }} ]</span>
        </RouterLink>
      </div>
    </section>

    <!-- Contact -->
    <section id="contact" ref="contactBox" class="leon-panel scroll-mt-16" :class="contact ? 'outline outline-1 outline-leon-gold' : ''">
      <h2 class="leon-panel-head">{{ t('about.contact') }}</h2>
      <div class="leon-panel-body text-[1.12rem]">
        <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
          <dt class="text-leon-dim">GitHub</dt>
          <dd class="min-w-0 truncate">
            <a :href="profile.links.github" target="_blank" rel="noopener noreferrer" class="text-leon-green hover:text-leon-bright">
              github.com/{{ profile.handle }}
            </a>
          </dd>
          <dt class="text-leon-dim">LinkedIn</dt>
          <dd class="min-w-0 truncate">
            <a :href="profile.links.linkedin" target="_blank" rel="noopener noreferrer" class="text-leon-green hover:text-leon-bright">
              {{ profile.links.linkedin.replace(/^https?:\/\//, '') }}
            </a>
          </dd>
          <dt class="text-leon-dim">{{ t('about.email') }}</dt>
          <dd class="min-w-0 break-all">
            <a :href="`mailto:${profile.links.email}`" class="text-leon-green hover:text-leon-bright">{{ profile.links.email }}</a>
          </dd>
          <dt class="text-leon-dim">{{ t('about.place') }}</dt>
          <dd>{{ profile.city }}, {{ profile.country }}</dd>
        </dl>
        <p class="mt-3 leading-tight text-leon-ink/85">{{ t('about.ask') }}</p>
        <a :href="`mailto:${profile.links.email}`" class="leon-btn leon-btn-gold mt-2">{{ t('about.write') }}</a>
      </div>
    </section>
  </div>
</template>
