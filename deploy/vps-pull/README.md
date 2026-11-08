# Déployer sur le VPS sans runner ni secret GitHub

Le principe est inversé par rapport à un workflow classique : **ce n'est pas GitHub qui
pousse vers le serveur, c'est le serveur qui va chercher les nouveautés.**

Conséquence : le dépôt étant public, **aucune clé SSH et aucun secret ne sont nécessaires**,
ni sur GitHub ni ailleurs. Rien de sensible ne quitte le serveur, et il n'y a pas de runner
à installer ni à maintenir.

Le commit poussé sur `main` reste le déclencheur et la source de vérité : rien n'est publié
depuis le PC.

```
   git push                GitHub (dépôt public)
      │                           ▲
      ▼                           │  git fetch toutes les 5 min
   leonbathie/blog ────────────────┘
                                   │
                            VPS : build + rsync → /var/www/blog
```

## Installation (une seule fois)

### 1. Node.js 22 sur le VPS

```bash
node -v   # doit afficher v22.12 ou plus
# sinon :
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Les deux dossiers

```bash
sudo mkdir -p /srv/blog /var/www/blog
sudo chown -R $USER:$USER /srv/blog /var/www/blog
```

- `/srv/blog` : clone de travail, **non servi** par Nginx
- `/var/www/blog` : le site publié, `root` de la configuration Nginx

### 3. Le script

```bash
sudo cp blog-deploy.sh /usr/local/bin/blog-deploy.sh
sudo chmod +x /usr/local/bin/blog-deploy.sh
```

Ouvrir le script et vérifier les 4 variables en tête (`REPO`, `BRANCH`, `WORKDIR`, `WEBROOT`).

### 4. Premier déploiement, à la main pour voir la sortie

```bash
/usr/local/bin/blog-deploy.sh
```

Attendu : clonage, `npm ci`, build, puis `Déployé : <commit> — N fichiers.`

### 5. Nginx

Installer [`../nginx.example.conf`](../nginx.example.conf) en vérifiant que son `root`
vaut bien `/var/www/blog`. Instructions en tête du fichier.

### 6. Automatiser avec systemd

Remplacer `ousmane` par ton utilisateur dans le `.service` (3 endroits : `User`, `Group`,
`HOME`/`ReadWritePaths`), puis :

```bash
sudo cp blog-deploy.service blog-deploy.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now blog-deploy.timer
```

Vérifier :

```bash
systemctl list-timers blog-deploy.timer   # prochaine exécution
journalctl -u blog-deploy.service -n 30   # journal des déploiements
```

Le site se met désormais à jour tout seul dans les 5 minutes qui suivent chaque push.

## Pour forcer un déploiement immédiat

```bash
sudo systemctl start blog-deploy.service
```

## Sécurité du script

- Il ne publie **qu'après** un build réussi : un commit qui ne compile pas laisse le site
  en ligne intact.
- Il ne fait rien s'il n'y a pas de nouveau commit, donc l'interroger toutes les 5 minutes
  ne coûte quasiment rien.
- `npm ci` s'appuie sur `package-lock.json` versionné : les versions installées sont
  exactement celles testées.
- Le service systemd est restreint (`ProtectSystem`, `ReadWritePaths`) : il n'écrit que
  dans ses deux dossiers et le cache npm.

## Comparaison des trois méthodes

| | Pages (actuel) | VPS *push* ([deploy.yml](../../.github/workflows/deploy.yml)) | VPS *pull* (ici) |
|---|---|---|---|
| Secrets GitHub | aucun | 4 requis | **aucun** |
| Runner | GitHub | GitHub | **aucun** |
| Clé SSH | non | oui | **non** |
| Node sur le VPS | non | non | oui |
| Délai après un push | ~1 min | ~1 min | ≤ 5 min |
| Dépôt privé possible | non (payant) | oui | oui, avec un jeton de lecture |

Les trois peuvent coexister : Pages pour l'adresse publique, le VPS pour un domaine à toi.
