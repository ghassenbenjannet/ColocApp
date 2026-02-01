# Guide de Déploiement - ColocApp

## Architecture de Déploiement

L'application ColocApp est composée de deux parties :
- **Frontend React** : Déployé sur **GitHub Pages**
- **Backend Node.js** : Déployé sur **Render** (ou autre service)

---

## Étape 1 : Déployer le Backend sur Render

### 1.1 Créer un compte sur Render
Allez sur [render.com](https://render.com) et créez un compte gratuit.

### 1.2 Créer un nouveau Web Service
1. Cliquez sur **"New +"** → **"Web Service"**
2. Connectez votre repository GitHub `ColocApp`
3. Configurez le service :
   - **Name** : `colocapp-backend` (ou autre nom)
   - **Region** : Choisir la région la plus proche
   - **Branch** : `main`
   - **Root Directory** : `backend`
   - **Runtime** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `node server.js`
   - **Instance Type** : `Free`

### 1.3 Variables d'environnement (si nécessaire)
Dans l'onglet "Environment", ajoutez :
```
PORT=3001
NODE_ENV=production
```

### 1.4 Déployer
Cliquez sur **"Create Web Service"**. Render va automatiquement :
- Cloner votre repo
- Installer les dépendances
- Démarrer le serveur

### 1.5 Récupérer l'URL du backend
Une fois déployé, vous obtiendrez une URL comme :
```
https://colocapp-backend.onrender.com
```
**⚠️ IMPORTANT : Copiez cette URL, vous en aurez besoin pour le frontend !**

---

## Étape 2 : Configurer GitHub Pages pour le Frontend

### 2.1 Activer GitHub Pages
1. Allez sur votre repository GitHub `ColocApp`
2. Cliquez sur **Settings** → **Pages**
3. Dans "Build and deployment" :
   - **Source** : Deploy from a branch
   - **Branch** : `gh-pages`
   - **Folder** : `/ (root)`
4. Cliquez sur **Save**

### 2.2 Ajouter l'URL du backend comme secret
1. Allez sur **Settings** → **Secrets and variables** → **Actions**
2. Cliquez sur **"New repository secret"**
3. Ajoutez :
   - **Name** : `BACKEND_URL`
   - **Value** : `https://colocapp-backend.onrender.com/api` (votre URL Render + /api)
4. Cliquez sur **Add secret**

### 2.3 Vérifier que le workflow est activé
1. Allez sur l'onglet **Actions**
2. Le workflow "Deploy to GitHub Pages" devrait être visible
3. Si nécessaire, activez les workflows

---

## Étape 3 : Déployer l'Application

### 3.1 Pousser vers main
```bash
git checkout main
git merge claude/add-json-data-storage-B9BiC
git push origin main
```

### 3.2 Vérifier le déploiement
1. Allez sur **Actions** dans GitHub
2. Vous devriez voir le workflow "Deploy to GitHub Pages" en cours
3. Attendez qu'il soit vert (✓)

### 3.3 Accéder à l'application
Votre application sera disponible sur :
```
https://ghassenbenjannet.github.io/ColocApp
```

---

## Alternative : Déploiement Manuel

Si vous préférez déployer manuellement :

### Frontend (depuis /frontend)
```bash
cd frontend
npm install gh-pages --save-dev
npm run deploy
```

### Backend (déjà sur Render)
Le backend est automatiquement redéployé à chaque push sur `main`.

---

## Problèmes Courants

### 1. Le frontend affiche une page blanche
**Cause** : L'URL du backend n'est pas configurée

**Solution** :
1. Vérifiez que le secret `BACKEND_URL` est bien configuré
2. Vérifiez que le backend est bien déployé sur Render
3. Ouvrez la console du navigateur (F12) pour voir les erreurs

### 2. Erreur CORS
**Cause** : Le backend n'autorise pas les requêtes depuis GitHub Pages

**Solution** : Vérifier que le backend autorise l'origine GitHub Pages
Le fichier `backend/server.js` doit contenir :
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:3000', 'https://ghassenbenjannet.github.io']
}));
```

### 3. Les données ne se sauvegardent pas
**Cause** : Le backend Render gratuit s'endort après 15 minutes d'inactivité

**Solution** :
- Première requête peut prendre 30-60 secondes (réveil du serveur)
- Utiliser un service de "keep-alive" (optionnel)
- Ou passer à un plan payant Render

### 4. Le workflow GitHub Actions échoue
**Cause** : Problème de permissions ou de secrets

**Solution** :
1. Vérifiez que le secret `BACKEND_URL` existe
2. Vérifiez les permissions dans Settings → Actions → General
3. Activez "Read and write permissions"

---

## Mise à Jour de l'Application

Pour mettre à jour l'application après des modifications :

```bash
# 1. Faire vos modifications
# 2. Commiter
git add .
git commit -m "Description des changements"

# 3. Pousser vers main
git push origin main

# Le déploiement se fait automatiquement !
```

---

## URLs Finales

Une fois déployé, vous aurez :

- **Frontend** : https://ghassenbenjannet.github.io/ColocApp
- **Backend** : https://colocapp-backend.onrender.com
- **API** : https://colocapp-backend.onrender.com/api

---

## Support

En cas de problème :
1. Vérifiez les logs du workflow GitHub Actions
2. Vérifiez les logs Render du backend
3. Ouvrez la console du navigateur (F12) pour voir les erreurs frontend

---

**Date de création** : 2026-02-01
**Version** : 1.0
