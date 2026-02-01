// Service de stockage local pour remplacer le backend
// Les données sont stockées dans le navigateur (localStorage)

const STORAGE_KEYS = {
  COLOC: 'colocapp_coloc',
  MONTHS: 'colocapp_months'
};

// Récupérer les données de configuration de la coloc
export const getColocConfig = async () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COLOC);
    if (data) {
      return JSON.parse(data);
    }
    return { isSetupComplete: false, roommates: [], startDate: '' };
  } catch (error) {
    console.error('Erreur getColocConfig:', error);
    return { isSetupComplete: false, roommates: [], startDate: '' };
  }
};

// Sauvegarder les données de configuration de la coloc
export const saveColocConfig = async (config) => {
  try {
    localStorage.setItem(STORAGE_KEYS.COLOC, JSON.stringify(config));
    return { success: true };
  } catch (error) {
    console.error('Erreur saveColocConfig:', error);
    throw error;
  }
};

// Récupérer un mois spécifique
export const getMonth = async (monthKey) => {
  try {
    const allMonths = JSON.parse(localStorage.getItem(STORAGE_KEYS.MONTHS) || '{}');
    return allMonths[monthKey] || null;
  } catch (error) {
    console.error('Erreur getMonth:', error);
    return null;
  }
};

// Sauvegarder un mois
export const saveMonth = async (monthKey, data) => {
  try {
    const allMonths = JSON.parse(localStorage.getItem(STORAGE_KEYS.MONTHS) || '{}');
    allMonths[monthKey] = data;
    localStorage.setItem(STORAGE_KEYS.MONTHS, JSON.stringify(allMonths));
    return { success: true };
  } catch (error) {
    console.error('Erreur saveMonth:', error);
    throw error;
  }
};

// Récupérer tous les mois archivés
export const getAllMonths = async () => {
  try {
    const allMonths = JSON.parse(localStorage.getItem(STORAGE_KEYS.MONTHS) || '{}');
    const months = Object.entries(allMonths).map(([key, data]) => ({
      key,
      data
    }));

    // Trier par date décroissante
    months.sort((a, b) => {
      const [monthA, yearA] = a.key.split('_');
      const [monthB, yearB] = b.key.split('_');
      if (yearA !== yearB) return yearB - yearA;
      return monthB - monthA;
    });

    return months;
  } catch (error) {
    console.error('Erreur getAllMonths:', error);
    return [];
  }
};

// Supprimer un mois
export const deleteMonth = async (monthKey) => {
  try {
    const allMonths = JSON.parse(localStorage.getItem(STORAGE_KEYS.MONTHS) || '{}');
    delete allMonths[monthKey];
    localStorage.setItem(STORAGE_KEYS.MONTHS, JSON.stringify(allMonths));
    return { success: true };
  } catch (error) {
    console.error('Erreur deleteMonth:', error);
    throw error;
  }
};

// Exporter toutes les données en JSON
export const exportAllData = () => {
  try {
    const data = {
      coloc: JSON.parse(localStorage.getItem(STORAGE_KEYS.COLOC) || '{}'),
      months: JSON.parse(localStorage.getItem(STORAGE_KEYS.MONTHS) || '{}'),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `colocapp_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Erreur exportAllData:', error);
    return false;
  }
};

// Importer des données depuis un fichier JSON
export const importAllData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Vérifier que c'est bien un fichier d'export ColocApp
        if (!data.version) {
          reject(new Error('Fichier invalide : pas un export ColocApp'));
          return;
        }

        // Restaurer les données
        if (data.coloc) {
          localStorage.setItem(STORAGE_KEYS.COLOC, JSON.stringify(data.coloc));
        }
        if (data.months) {
          localStorage.setItem(STORAGE_KEYS.MONTHS, JSON.stringify(data.months));
        }

        resolve({
          success: true,
          importDate: data.exportDate,
          monthsCount: Object.keys(data.months || {}).length
        });
      } catch (error) {
        reject(new Error('Erreur lors de la lecture du fichier : ' + error.message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsText(file);
  });
};

// Effacer toutes les données
export const clearAllData = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.COLOC);
    localStorage.removeItem(STORAGE_KEYS.MONTHS);
    return true;
  } catch (error) {
    console.error('Erreur clearAllData:', error);
    return false;
  }
};

// Utilitaire: Convertir un mois/année en clé (format MM_YYYY)
export const getMonthKey = (month, year) => {
  const monthIndex = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    .indexOf(month.toLowerCase()) + 1;
  return `${String(monthIndex).padStart(2, '0')}_${year}`;
};
