# ColocManager - Application de Gestion de Colocation

Une application web moderne pour gérer les finances de votre colocation à deux personnes.

## 🌟 Fonctionnalités

- **Configuration initiale** : Définissez vos colocataires et la date de début
- **Gestion des frais fixes** : Loyer, électricité, gaz, internet
- **Mois personnalisés** : Calcul proportionnel selon les jours habités
- **Frais partagés** : Courses, sorties, etc. (division 50/50)
- **Autres frais** : Quand un colocataire avance de l'argent pour l'autre
- **Régularisation** : Ponctuelle (virement immédiat) ou retenue (mois suivant)
- **Historique** : Consultez et modifiez les mois archivés
- **Export PDF** : Téléchargez un récapitulatif mensuel
- **Stockage JSON** : Données sauvegardées dans des fichiers JSON synchronisés

## 📁 Structure du Projet

```
ColocApp/
├── backend/              # Serveur Node.js/Express
│   ├── data/            # Fichiers JSON (Coloc.json, MM_YYYY.json)
│   ├── server.js        # Serveur API
│   └── package.json
├── frontend/            # Application React
│   ├── public/
│   ├── src/
│   │   ├── App.jsx      # Composant principal
│   │   ├── api.js       # Service API
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── package.json         # Scripts racine
└── README.md
```

## 🚀 Installation et Démarrage Local

### Prérequis
- Node.js (v16 ou supérieur)
- npm ou yarn

### Installation

```bash
# Cloner le repository
git clone <votre-repo-url>
cd ColocApp

# Installer toutes les dépendances (root, backend, frontend)
npm run install-all
```

### Démarrage en développement

```bash
# Lancer le backend et le frontend simultanément
npm run dev
```

L'application sera accessible sur :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001

### Démarrage en production

```bash
# Construire le frontend
npm run build

# Lancer le serveur de production
npm start
```

## 📊 Format des Données

### Coloc.json
```json
{
  "isSetupComplete": true,
  "roommates": ["Alice", "Bob"],
  "startDate": "2026-01"
}
```

### MM_YYYY.json (exemple: 01_2026.json)
```json
{
  "month": "janvier",
  "year": 2026,
  "monthType": "complete",
  "expenses": {
    "rent": "800",
    "rentPaidBy": "Alice",
    "utilities": "120",
    "utilitiesPaidBy": "Bob",
    "internet": "30",
    "internetPaidBy": "Alice"
  },
  "sharedExpenses": [
    {
      "description": "Courses",
      "amount": "80",
      "paidBy": "Alice"
    }
  ],
  "otherExpenses": [],
  "regularization": {
    "type": "",
    "from": "",
    "to": "",
    "amount": "",
    "date": "",
    "recipient": ""
  }
}
```

## 🌐 Déploiement

### Option 1 : Heroku

```bash
# Installer Heroku CLI et se connecter
heroku login

# Créer une application
heroku create votre-nom-app

# Déployer
git push heroku main

# Ouvrir l'application
heroku open
```

### Option 2 : Render.com

1. Connectez votre repository GitHub à Render
2. Créez un nouveau "Web Service"
3. Configurez :
   - **Build Command** : `npm run install-all && npm run build`
   - **Start Command** : `npm start`
   - **Environment** : `NODE_ENV=production`

### Option 3 : Railway.app

1. Connectez votre repository
2. Railway détectera automatiquement votre configuration
3. Ajoutez la variable d'environnement `NODE_ENV=production`

## 🔧 Variables d'Environnement

Pour le backend (optionnel) :
```bash
PORT=3001                    # Port du serveur (défaut: 3001)
NODE_ENV=production          # Mode production
```

Pour le frontend (optionnel) :
```bash
REACT_APP_API_URL=/api      # URL de l'API (défaut: /api)
```

## 🛠️ Scripts Disponibles

```bash
npm run dev              # Lancer en développement (backend + frontend)
npm run server           # Lancer uniquement le backend
npm run client           # Lancer uniquement le frontend
npm run build            # Construire le frontend pour production
npm start                # Lancer en production
npm run install-all      # Installer toutes les dépendances
```

## 🗂️ API Endpoints

- `GET /api/coloc` - Récupérer la configuration
- `POST /api/coloc` - Sauvegarder la configuration
- `GET /api/month/:monthKey` - Récupérer un mois (ex: 01_2026)
- `POST /api/month/:monthKey` - Sauvegarder un mois
- `GET /api/months` - Récupérer tous les mois archivés
- `DELETE /api/month/:monthKey` - Supprimer un mois

## 📱 Responsive Design

L'application est entièrement responsive et optimisée pour :
- Desktop (1920px+)
- Tablette (768px - 1024px)
- Mobile (320px - 767px)

## 🎨 Technologies Utilisées

### Frontend
- React 18
- Lucide React (icônes)
- Tailwind CSS (styles)

### Backend
- Node.js
- Express
- CORS

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou un pull request.

## 📄 Licence

MIT

## 👥 Auteur

Créé avec ❤️ pour faciliter la gestion de colocation
