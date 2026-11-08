#!/usr/bin/env bash
#
# Déploiement du blog SANS runner GitHub et SANS secret GitHub.
#
# Principe inverse du workflow habituel : ce n'est pas GitHub qui pousse vers le
# serveur, c'est le serveur qui va chercher les nouveautés. Le dépôt étant public,
# aucune clé ni aucun jeton n'est nécessaire — nulle part.
#
# Le script ne fait rien s'il n'y a pas de nouveau commit, et ne remplace le site
# en ligne qu'une fois le build réussi.
#
# Installation : voir README.md dans ce dossier.

set -euo pipefail

REPO="https://github.com/leonbathie/blog.git"
BRANCH="main"
WORKDIR="/srv/blog"        # clone de travail (pas servi par Nginx)
WEBROOT="/var/www/blog"    # dossier servi par Nginx (= root de la config Nginx)

log() { printf '%s  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

# ---- Premier passage : cloner ----
if [ ! -d "$WORKDIR/.git" ]; then
  log "Premier déploiement : clonage dans $WORKDIR"
  mkdir -p "$(dirname "$WORKDIR")"
  git clone --branch "$BRANCH" --depth 50 "$REPO" "$WORKDIR"
fi

cd "$WORKDIR"

# ---- Y a-t-il du nouveau ? ----
git remote set-url origin "$REPO"
git fetch --quiet origin "$BRANCH"

LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse "origin/$BRANCH")"

if [ "$LOCAL" = "$REMOTE" ]; then
  log "Déjà à jour (${LOCAL:0:7}) — rien à faire."
  exit 0
fi

log "Nouveau commit : ${LOCAL:0:7} -> ${REMOTE:0:7}"
git reset --hard "origin/$BRANCH"
git clean -fd
log "Message : $(git log -1 --pretty=%s)"

# ---- Construire ----
# npm ci exige package-lock.json, versionné dans le dépôt : build reproductible.
log "Installation des dépendances…"
npm ci --no-fund --no-audit

log "Build…"
npm run build

if [ ! -f dist/index.html ]; then
  log "ERREUR : dist/index.html absent, le build a échoué. Site en ligne inchangé."
  exit 1
fi

# ---- Publier ----
# --delete retire les anciens fichiers hachés par Vite.
# On ne publie qu'ici, après un build réussi : le site n'est jamais cassé à mi-chemin.
log "Publication vers $WEBROOT"
mkdir -p "$WEBROOT"
rsync -a --delete dist/ "$WEBROOT/"

log "Déployé : ${REMOTE:0:7} — $(find "$WEBROOT" -type f | wc -l) fichiers."
