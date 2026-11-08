# Mise en ligne du blog

Procédure reprise du projet `miliwal`, adaptée à ce blog.
Tout passe par **git + GitHub Actions** : un push sur `main` construit le site et envoie
`dist/` sur le VPS par `rsync`. Aucune publication manuelle depuis le PC.

## En résumé

1. Générer une clé SSH dédiée au déploiement.
2. Autoriser sa clé publique sur le VPS.
3. Renseigner 4 secrets dans ce dépôt.
4. Installer `nginx.example.conf` une fois sur le VPS.
5. Pousser sur `main` — [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) fait le reste.

---

## 1. Générer une clé SSH dédiée

Sur le PC :

```bash
ssh-keygen -t ed25519 -C "blog-deploy" -f ~/.ssh/blog_deploy
# Appuyer deux fois sur Entrée : pas de phrase de passe (obligatoire pour un CI non interactif).
```

Deux fichiers sont créés :

- `~/.ssh/blog_deploy` ← clé **privée**, à coller dans le secret `VPS_SSH_KEY`
- `~/.ssh/blog_deploy.pub` ← clé publique, à installer sur le VPS

> **À conserver.** Une clé privée perdue ne se récupère pas : GitHub ne permet jamais de
> relire un secret. Il faut alors régénérer une clé et la réautoriser sur le serveur.

## 2. Autoriser la clé sur le VPS

```bash
ssh-copy-id -i ~/.ssh/blog_deploy.pub utilisateur@ip-du-vps
# ou, manuellement :
cat ~/.ssh/blog_deploy.pub | ssh utilisateur@ip-du-vps 'cat >> ~/.ssh/authorized_keys'
```

Vérifier que la connexion se fait **sans mot de passe** :

```bash
ssh -i ~/.ssh/blog_deploy utilisateur@ip-du-vps 'echo ok'
```

## 3. Créer le dossier cible sur le VPS

Un dossier dédié : son contenu est remplacé à chaque déploiement (`rsync --delete`).

```bash
sudo mkdir -p /var/www/blog
sudo chown $USER:$USER /var/www/blog
```

## 4. Renseigner les secrets

Sur https://github.com/leonbathie/blog/settings/secrets/actions :

| Nom | Valeur |
|---|---|
| `VPS_HOST` | IP ou domaine du serveur |
| `VPS_USER` | utilisateur SSH (`deploy`, `ubuntu`, `ousmane`…) |
| `VPS_PATH` | `/var/www/blog` — doit correspondre au `root` de Nginx |
| `VPS_SSH_KEY` | **tout** le contenu de `~/.ssh/blog_deploy`, lignes `-----BEGIN…` et `-----END…` comprises |
| `VPS_PORT` | *(optionnel)* port SSH si différent de 22 |
| `RELOAD_NGINX` | *(optionnel)* `true` pour recharger Nginx à la fin de chaque déploiement |

Le workflow vérifie la présence des 4 premiers et s'arrête avec un message explicite si
l'un manque, avant toute tentative de connexion.

## 5. Installer la configuration Nginx (une seule fois)

Voir les instructions en tête de [`nginx.example.conf`](nginx.example.conf).

Pour le HTTPS :

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.example
```

## 6. Déployer

```bash
git push origin main
```

Puis **Actions → Deploy to VPS**. Un déploiement manuel est aussi possible depuis cet
onglet (« Run workflow »), sans nouveau commit — pratique après avoir ajouté les secrets.

## Optionnel : rechargement de Nginx sans mot de passe

Nécessaire si `RELOAD_NGINX=true` :

```bash
echo "deploy ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx" | sudo tee /etc/sudoers.d/deploy-nginx
sudo chmod 440 /etc/sudoers.d/deploy-nginx
```

Remplacer `deploy` par l'utilisateur de `VPS_USER`.

## En cas de problème

- **Secrets manquants : …** → les secrets ne sont pas encore renseignés (étape 4).
- **Permission denied (publickey)** → `VPS_SSH_KEY` est incorrect, ou la clé publique n'est
  pas dans `authorized_keys`. Tester en local avec `ssh -i ~/.ssh/blog_deploy …`.
- **rsync: failed to set times on …: Operation not permitted** → l'utilisateur SSH ne
  possède pas le dossier cible : `sudo chown -R $USER /var/www/blog`.
- **Les fichiers arrivent mais le site renvoie 404** → le `root` de Nginx ne correspond pas
  à `VPS_PATH`. Vérifier avec `sudo nginx -t`.
- **L'ancienne forme du blog s'affiche encore** → `index.html` est en cache. La
  configuration fournie l'interdit ; sinon, forcer un rechargement (Ctrl+Shift+R).
