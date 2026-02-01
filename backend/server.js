const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Servir les fichiers statiques du frontend en production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// Assurer que le dossier data existe
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Initialiser Coloc.json s'il n'existe pas
async function initColocFile() {
  const colocPath = path.join(DATA_DIR, 'Coloc.json');
  try {
    await fs.access(colocPath);
  } catch {
    const initialData = {
      isSetupComplete: false,
      roommates: [],
      startDate: ''
    };
    await fs.writeFile(colocPath, JSON.stringify(initialData, null, 2));
  }
}

// Routes API

// Récupérer les données de configuration de la coloc
app.get('/api/coloc', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, 'Coloc.json'), 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la lecture des données' });
  }
});

// Mettre à jour les données de configuration de la coloc
app.post('/api/coloc', async (req, res) => {
  try {
    await fs.writeFile(
      path.join(DATA_DIR, 'Coloc.json'),
      JSON.stringify(req.body, null, 2)
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la sauvegarde des données' });
  }
});

// Récupérer un mois spécifique (format: MM_YYYY)
app.get('/api/month/:monthKey', async (req, res) => {
  try {
    const { monthKey } = req.params;
    const data = await fs.readFile(
      path.join(DATA_DIR, `${monthKey}.json`),
      'utf-8'
    );
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json(null); // Mois n'existe pas encore
    } else {
      res.status(500).json({ error: 'Erreur lors de la lecture du mois' });
    }
  }
});

// Sauvegarder un mois
app.post('/api/month/:monthKey', async (req, res) => {
  try {
    const { monthKey } = req.params;
    await fs.writeFile(
      path.join(DATA_DIR, `${monthKey}.json`),
      JSON.stringify(req.body, null, 2)
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la sauvegarde du mois' });
  }
});

// Récupérer tous les mois archivés
app.get('/api/months', async (req, res) => {
  try {
    const files = await fs.readdir(DATA_DIR);
    const monthFiles = files.filter(f => f.match(/^\d{2}_\d{4}\.json$/));

    const months = await Promise.all(
      monthFiles.map(async (file) => {
        const data = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
        return {
          key: file.replace('.json', ''),
          data: JSON.parse(data)
        };
      })
    );

    // Trier par date décroissante
    months.sort((a, b) => {
      const [monthA, yearA] = a.key.split('_');
      const [monthB, yearB] = b.key.split('_');
      if (yearA !== yearB) return yearB - yearA;
      return monthB - monthA;
    });

    res.json(months);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des mois' });
  }
});

// Supprimer un mois
app.delete('/api/month/:monthKey', async (req, res) => {
  try {
    const { monthKey } = req.params;
    await fs.unlink(path.join(DATA_DIR, `${monthKey}.json`));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression du mois' });
  }
});

// Route catch-all pour le frontend en production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Démarrer le serveur
async function start() {
  await ensureDataDir();
  await initColocFile();

  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📁 Dossier de données: ${DATA_DIR}`);
  });
}

start();
