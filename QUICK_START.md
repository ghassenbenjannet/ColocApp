# 🚀 Démarrage Rapide - Déploiement GitHub Pages

## Ce qui a été configuré

✅ Frontend configuré pour GitHub Pages
✅ Backend configuré avec CORS pour GitHub Pages
✅ Workflow GitHub Actions créé
✅ Guide de déploiement complet créé

---

## 📋 Étapes à Suivre (15 minutes)

### 1️⃣ Déployer le Backend sur Render (5 min)

1. **Aller sur [render.com](https://render.com)** et créer un compte
2. Cliquer sur **"New +"** → **"Web Service"**
3. Connecter votre repository GitHub
4. Configuration :
   ```
   Name: colocapp-backend
   Root Directory: backend
   Build Command: npm install
   Start Command: node server.js
   ```
5. Cliquer sur **"Create Web Service"**
6. **COPIER l'URL** générée (ex: `https://colocapp-backend.onrender.com`)

---

### 2️⃣ Configurer GitHub (5 min)

#### A. Ajouter le secret BACKEND_URL
1. Aller sur votre repo GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** :
   - Name: `BACKEND_URL`
   - Value: `https://colocapp-backend.onrender.com/api` (votre URL + /api)

#### B. Activer GitHub Pages
1. **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **gh-pages** / **root**
4. **Save**

#### C. Activer les Workflows
1. **Settings** → **Actions** → **General**
2. Actions permissions: **Allow all actions**
3. Workflow permissions: **Read and write permissions**
4. **Save**

---

### 3️⃣ Déployer l'Application (5 min)

```bash
# 1. Merger vers main
git checkout main
git merge claude/add-json-data-storage-B9BiC
git push origin main

# 2. Le déploiement GitHub Actions démarre automatiquement
```

#### Vérifier le déploiement
1. Aller sur **Actions** dans GitHub
2. Voir le workflow "Deploy to GitHub Pages"
3. Attendre qu'il soit ✅ vert

---

## 🌐 Accès à l'Application

Une fois déployé :

**Frontend** : https://ghassenbenjannet.github.io/ColocApp
**Backend** : https://colocapp-backend.onrender.com

---

## ⚠️ Important à Savoir

### Render (gratuit) s'endort
- Après 15 minutes d'inactivité, le backend s'endort
- **Première requête** : 30-60 secondes de délai
- **Ensuite** : fonctionne normalement

### Pas de base de données
- Les données sont stockées dans des fichiers JSON
- Render **efface les fichiers** à chaque redéploiement
- **Solution** : utiliser un volume persistant (payant) ou une vraie BDD

---

## 🔧 Si Vous Avez des Problèmes

### Le frontend affiche une page blanche
```bash
# Vérifier la console du navigateur (F12)
# Vérifier que BACKEND_URL est bien configuré
```

### Erreur CORS
```bash
# Vérifier que le backend autorise GitHub Pages
# Fichier: backend/server.js ligne 12-25
```

### Le workflow échoue
```bash
# Vérifier les permissions dans Settings → Actions
# Vérifier que le secret BACKEND_URL existe
```

---

## 📚 Documentation Complète

Pour plus de détails, consultez **DEPLOYMENT_GUIDE.md**

---

## 🎯 Résumé des URLs

| Service | URL | Type |
|---------|-----|------|
| **Frontend** | https://ghassenbenjannet.github.io/ColocApp | GitHub Pages |
| **Backend** | https://colocapp-backend.onrender.com | Render |
| **API** | https://colocapp-backend.onrender.com/api | Render |

---

**Bonne chance ! 🎉**
