# 🚀 Guide de Déploiement - GitHub Pages Uniquement

## Architecture Simplifiée

✅ **Frontend React** → GitHub Pages
✅ **Stockage** → LocalStorage (navigateur)
✅ **Export/Import** → Fichiers JSON
❌ **Backend** → Pas nécessaire !

---

## Avantages de cette solution

### ✅ Avantages
- **Gratuit** : 100% gratuit avec GitHub Pages
- **Simple** : Pas de backend à gérer
- **Rapide** : Pas de serveur, tout est local
- **Portable** : Export/Import des données en JSON

### ⚠️ Limitations
- Données dans le navigateur (effacées si cache vidé)
- Pas de synchronisation automatique entre appareils
- **Solution** : Utiliser Export/Import pour transférer les données

---

## 📋 Déploiement en 3 Étapes (5 minutes)

### 1️⃣ Activer GitHub Pages

1. Aller sur votre repository GitHub `ColocApp`
2. **Settings** → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **gh-pages** / **root**
5. **Save**

### 2️⃣ Merger vers main

```bash
git checkout main
git merge claude/add-json-data-storage-B9BiC
git push origin main
```

### 3️⃣ Attendre le déploiement

1. Aller sur **Actions** dans GitHub
2. Voir le workflow "Deploy to GitHub Pages"
3. Attendre qu'il soit ✅ vert (2-3 minutes)

---

## 🌐 Accès à l'Application

Une fois déployé :

**URL** : https://ghassenbenjannet.github.io/ColocApp

---

## 💾 Utilisation Export/Import

### Sauvegarder vos données

1. Cliquer sur **"Exporter les données"** (en haut)
2. Un fichier JSON est téléchargé : `colocapp_backup_2026-02-01.json`
3. **Conserver ce fichier en sécurité** (Google Drive, Dropbox, etc.)

### Restaurer vos données

1. Cliquer sur **"Importer des données"**
2. Sélectionner votre fichier JSON
3. Les données sont restaurées automatiquement

### Transférer entre appareils

1. **Sur l'appareil source** : Exporter les données
2. **Transférer le fichier** (email, USB, cloud, etc.)
3. **Sur le nouvel appareil** : Importer les données

---

## ⚠️ Important à Savoir

### Les données sont dans le navigateur

- Stockées dans le **LocalStorage** du navigateur
- **Risques de perte** :
  - Vider le cache du navigateur
  - Désinstaller le navigateur
  - Utiliser le mode privé
- **Protection** : Exporter régulièrement vos données

### Bonnes pratiques

1. **Exporter après chaque mois archivé**
2. **Garder plusieurs backups** (au cas où)
3. **Stocker dans le cloud** (Google Drive, Dropbox, OneDrive)
4. **Nommer les fichiers clairement** : `coloc_backup_janvier_2026.json`

---

## 🔧 Problèmes Courants

### La page GitHub Pages affiche le README

**Cause** : Le workflow n'a pas encore déployé le site

**Solution** :
1. Vérifier que le workflow existe : `.github/workflows/deploy.yml`
2. Merger vers `main` pour déclencher le workflow
3. Attendre 2-3 minutes

### Les données disparaissent

**Cause** : Cache du navigateur vidé

**Solution** :
1. Importer le dernier backup
2. Exporter plus régulièrement à l'avenir

### Import ne fonctionne pas

**Cause** : Fichier JSON invalide

**Solution** :
1. Vérifier que c'est un fichier exporté par ColocApp
2. Vérifier que le fichier n'est pas corrompu
3. Essayer un autre backup

---

## 📱 Utilisation Multi-Appareils

### Scénario : Utiliser sur PC et mobile

1. **Sur PC** :
   - Utiliser l'application normalement
   - Exporter les données après chaque modification
   - Sauvegarder le JSON sur Google Drive

2. **Sur Mobile** :
   - Ouvrir l'application sur mobile
   - Télécharger le JSON depuis Google Drive
   - Importer les données
   - Utiliser l'application
   - Exporter et sauvegarder à nouveau

### Scénario : Partager avec colocataire

1. **Colocataire A** crée et remplit l'application
2. **Exporte les données** en JSON
3. **Envoie le fichier** à Colocataire B (WhatsApp, email, etc.)
4. **Colocataire B** importe le fichier
5. Les deux ont les mêmes données

**Important** : Pas de synchronisation automatique, donc il faut s'envoyer les exports après chaque modification.

---

## 🚀 Workflow Recommandé

### Chaque mois :

1. **Remplir les données** du mois
2. **Archiver le mois**
3. **Exporter les données** immédiatement
4. **Sauvegarder le JSON** dans un dossier cloud
5. **Partager avec colocataire** si nécessaire

### Format de nommage :

```
colocapp_backup_2026_01_janvier.json
colocapp_backup_2026_02_fevrier.json
colocapp_backup_2026_03_mars.json
```

---

## 📚 Structure du Fichier JSON

Le fichier exporté contient :

```json
{
  "coloc": {
    "isSetupComplete": true,
    "roommates": ["Alice", "Bob"],
    "startDate": "2026-01"
  },
  "months": {
    "01_2026": { /* données janvier 2026 */ },
    "02_2026": { /* données février 2026 */ }
  },
  "exportDate": "2026-02-01T10:30:00.000Z",
  "version": "1.0"
}
```

---

## 🎯 Résumé

| Aspect | Solution |
|--------|----------|
| **Hébergement** | GitHub Pages (gratuit) |
| **Stockage** | LocalStorage (navigateur) |
| **Sauvegarde** | Export JSON manuel |
| **Multi-appareils** | Import/Export manuel |
| **Coût** | 0€ |
| **Complexité** | Très simple |

---

## ✅ Prêt à Déployer !

Suivez les 3 étapes ci-dessus et votre application sera en ligne en 5 minutes !

**URL finale** : https://ghassenbenjannet.github.io/ColocApp

---

**Date de création** : 2026-02-01
**Version** : 2.0 (LocalStorage)
