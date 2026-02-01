// Service API pour communiquer avec le backend

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Récupérer les données de configuration de la coloc
export const getColocConfig = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/coloc`);
    if (!response.ok) throw new Error('Erreur lors de la récupération de la configuration');
    return await response.json();
  } catch (error) {
    console.error('Erreur getColocConfig:', error);
    return { isSetupComplete: false, roommates: [], startDate: '' };
  }
};

// Sauvegarder les données de configuration de la coloc
export const saveColocConfig = async (config) => {
  try {
    const response = await fetch(`${API_BASE_URL}/coloc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!response.ok) throw new Error('Erreur lors de la sauvegarde de la configuration');
    return await response.json();
  } catch (error) {
    console.error('Erreur saveColocConfig:', error);
    throw error;
  }
};

// Récupérer un mois spécifique
export const getMonth = async (monthKey) => {
  try {
    const response = await fetch(`${API_BASE_URL}/month/${monthKey}`);
    if (!response.ok) throw new Error('Erreur lors de la récupération du mois');
    return await response.json();
  } catch (error) {
    console.error('Erreur getMonth:', error);
    return null;
  }
};

// Sauvegarder un mois
export const saveMonth = async (monthKey, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/month/${monthKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Erreur lors de la sauvegarde du mois');
    return await response.json();
  } catch (error) {
    console.error('Erreur saveMonth:', error);
    throw error;
  }
};

// Récupérer tous les mois archivés
export const getAllMonths = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/months`);
    if (!response.ok) throw new Error('Erreur lors de la récupération des mois');
    return await response.json();
  } catch (error) {
    console.error('Erreur getAllMonths:', error);
    return [];
  }
};

// Supprimer un mois
export const deleteMonth = async (monthKey) => {
  try {
    const response = await fetch(`${API_BASE_URL}/month/${monthKey}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erreur lors de la suppression du mois');
    return await response.json();
  } catch (error) {
    console.error('Erreur deleteMonth:', error);
    throw error;
  }
};

// Utilitaire: Convertir un mois/année en clé (format MM_YYYY)
export const getMonthKey = (month, year) => {
  const monthIndex = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    .indexOf(month.toLowerCase()) + 1;
  return `${String(monthIndex).padStart(2, '0')}_${year}`;
};
