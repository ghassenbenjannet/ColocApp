import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download, Users, Receipt, TrendingUp, Calendar, Euro, FileText, ArrowRight, Check, Edit2, Save, X } from 'lucide-react';
import { getColocConfig, saveColocConfig, getMonth, saveMonth, getAllMonths, getMonthKey } from './api';
import { generateStyledPDF } from './pdfGenerator';

const formatEuro = (amount) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);
};

const App = () => {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [roommates, setRoommates] = useState([]);
  const [newRoommateName, setNewRoommateName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);

  const [currentMonth, setCurrentMonth] = useState({
    month: new Date().toLocaleDateString('fr-FR', { month: 'long' }),
    year: new Date().getFullYear(),
    monthType: 'complete',
    expenses: {
      rent: '', rentPaidBy: '',
      utilities: '', utilitiesPaidBy: '',
      internet: '', internetPaidBy: '',
      daysRoommate1: '30',
      daysRoommate2: '30'
    },
    sharedExpenses: [],
    otherExpenses: [],
    regularization: { type: '', from: '', to: '', amount: '', date: '', recipient: '' }
  });

  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('frais');
  const [view, setView] = useState('current');
  const [editingMonth, setEditingMonth] = useState(null);

  // Charger les données au démarrage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger la configuration
        const config = await getColocConfig();
        if (config.isSetupComplete) {
          setIsSetupComplete(true);
          setRoommates(config.roommates);
          setStartDate(config.startDate);
        }

        // Charger l'historique d'abord
        const allMonths = await getAllMonths();
        const historyData = allMonths.map(m => m.data);
        setHistory(historyData);

        // Déterminer le "mois en cours de remplissage"
        let workingMonth = null;

        if (historyData.length > 0) {
          // Trouver le dernier mois (le plus récent)
          const lastMonth = historyData[0]; // Déjà trié par date décroissante

          // Calculer le mois suivant
          const lastDate = new Date(lastMonth.year,
            ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
              .indexOf(lastMonth.month.toLowerCase()));
          lastDate.setMonth(lastDate.getMonth() + 1);

          const nextMonthName = lastDate.toLocaleDateString('fr-FR', { month: 'long' });
          const nextYear = lastDate.getFullYear();
          const nextMonthKey = getMonthKey(nextMonthName, nextYear);

          // Essayer de charger le mois suivant
          const nextMonthData = await getMonth(nextMonthKey);

          if (nextMonthData) {
            // Le mois suivant existe déjà, c'est notre "mois en cours"
            workingMonth = nextMonthData;
          } else {
            // Le mois suivant n'existe pas, créer un nouveau mois
            workingMonth = {
              month: nextMonthName,
              year: nextYear,
              monthType: 'complete',
              expenses: {
                rent: '', rentPaidBy: '',
                utilities: '', utilitiesPaidBy: '',
                internet: '', internetPaidBy: '',
                daysRoommate1: '30',
                daysRoommate2: '30'
              },
              sharedExpenses: [],
              otherExpenses: [],
              regularization: { type: '', from: '', to: '', amount: '', date: '', recipient: '' }
            };
          }
        } else if (config.isSetupComplete && config.startDate) {
          // Aucun mois archivé, utiliser la date de début
          const [year, month] = config.startDate.split('-');
          const monthName = new Date(year, parseInt(month) - 1).toLocaleDateString('fr-FR', { month: 'long' });

          workingMonth = {
            month: monthName,
            year: parseInt(year),
            monthType: 'complete',
            expenses: {
              rent: '', rentPaidBy: '',
              utilities: '', utilitiesPaidBy: '',
              internet: '', internetPaidBy: '',
              daysRoommate1: '30',
              daysRoommate2: '30'
            },
            sharedExpenses: [],
            otherExpenses: [],
            regularization: { type: '', from: '', to: '', amount: '', date: '', recipient: '' }
          };
        }

        // Définir le mois de travail
        if (workingMonth) {
          setCurrentMonth(workingMonth);
        }

      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      }
      setDataLoaded(true);
    };

    loadData();
  }, []);

  // Sauvegarder la configuration quand elle change
  useEffect(() => {
    if (!dataLoaded) return;

    const saveConfig = async () => {
      try {
        await saveColocConfig({
          isSetupComplete,
          roommates,
          startDate
        });
      } catch (error) {
        console.error('Erreur sauvegarde config:', error);
      }
    };

    saveConfig();
  }, [isSetupComplete, roommates, startDate, dataLoaded]);

  // Sauvegarder le mois en cours quand il change
  useEffect(() => {
    if (!dataLoaded || !isSetupComplete) return;

    const saveCurrentMonth = async () => {
      try {
        const monthKey = getMonthKey(currentMonth.month, currentMonth.year);
        await saveMonth(monthKey, currentMonth);
      } catch (error) {
        console.error('Erreur sauvegarde mois:', error);
      }
    };

    saveCurrentMonth();
  }, [currentMonth, dataLoaded, isSetupComplete]);

  // Synchronisation automatique de la régularisation avec le mois suivant
  useEffect(() => {
    if (!dataLoaded || !isSetupComplete) return;
    if (currentMonth.regularization.type !== 'retenue' || !currentMonth.regularization.amount) return;

    const syncRegularization = async () => {
      try {
        // Calculer le mois suivant
        const currentDate = new Date(currentMonth.year,
          ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
            .indexOf(currentMonth.month.toLowerCase()));
        currentDate.setMonth(currentDate.getMonth() + 1);

        const nextMonthName = currentDate.toLocaleDateString('fr-FR', { month: 'long' });
        const nextYear = currentDate.getFullYear();
        const nextMonthKey = getMonthKey(nextMonthName, nextYear);
        const currentMonthKey = getMonthKey(currentMonth.month, currentMonth.year);

        // Charger le mois suivant
        const nextMonth = await getMonth(nextMonthKey);
        if (!nextMonth) return; // Le mois suivant n'existe pas encore

        // Trouver la ligne automatique existante
        const autoExpenseIndex = nextMonth.otherExpenses.findIndex(
          exp => exp.isAutomatic && exp.fromMonth === currentMonthKey
        );

        if (autoExpenseIndex >= 0) {
          // Mettre à jour le montant si différent
          const currentAutoExpense = nextMonth.otherExpenses[autoExpenseIndex];
          if (parseFloat(currentAutoExpense.amount) !== parseFloat(currentMonth.regularization.amount)) {
            const otherRoommate = roommates.find(r => r !== currentMonth.regularization.recipient);
            nextMonth.otherExpenses[autoExpenseIndex] = {
              ...currentAutoExpense,
              payer: currentMonth.regularization.recipient,
              recipient: otherRoommate,
              amount: currentMonth.regularization.amount,
              description: `Restant du mois ${currentMonth.month} ${currentMonth.year}`
            };

            // Sauvegarder le mois suivant mis à jour
            await saveMonth(nextMonthKey, nextMonth);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la synchronisation:', error);
      }
    };

    // Petit délai pour éviter trop d'appels API
    const timeoutId = setTimeout(syncRegularization, 500);
    return () => clearTimeout(timeoutId);
  }, [currentMonth.regularization, dataLoaded, isSetupComplete, currentMonth.month, currentMonth.year, roommates]);

  const addRoommate = () => {
    if (newRoommateName.trim() && roommates.length < 2) {
      setRoommates([...roommates, newRoommateName.trim()]);
      setNewRoommateName('');
    }
  };

  const removeRoommate = (index) => {
    setRoommates(roommates.filter((_, i) => i !== index));
  };

  const finalizeSetup = () => {
    if (roommates.length === 2 && startDate) {
      const [year, month] = startDate.split('-');
      const monthName = new Date(year, parseInt(month) - 1).toLocaleDateString('fr-FR', { month: 'long' });
      setCurrentMonth({
        month: monthName,
        year: parseInt(year),
        monthType: 'complete',
        expenses: {
          rent: '', rentPaidBy: '',
          utilities: '', utilitiesPaidBy: '',
          internet: '', internetPaidBy: '',
          daysRoommate1: '30',
          daysRoommate2: '30'
        },
        sharedExpenses: [],
        otherExpenses: [],
        regularization: { type: '', from: '', to: '', amount: '', date: '', recipient: '' }
      });
      setIsSetupComplete(true);
    }
  };

  const addSharedExpense = () => {
    setCurrentMonth({
      ...currentMonth,
      sharedExpenses: [...currentMonth.sharedExpenses, { description: '', amount: '', paidBy: roommates[0] || '' }]
    });
  };

  const updateSharedExpense = (index, field, value) => {
    const updated = [...currentMonth.sharedExpenses];
    updated[index][field] = value;
    setCurrentMonth({ ...currentMonth, sharedExpenses: updated });
  };

  const removeSharedExpense = (index) => {
    setCurrentMonth({
      ...currentMonth,
      sharedExpenses: currentMonth.sharedExpenses.filter((_, i) => i !== index)
    });
  };

  const addOtherExpense = () => {
    setCurrentMonth({
      ...currentMonth,
      otherExpenses: [...currentMonth.otherExpenses, { payer: roommates[0] || '', recipient: roommates[1] || '', amount: '', description: '' }]
    });
  };

  const updateOtherExpense = (index, field, value) => {
    const updated = [...currentMonth.otherExpenses];
    // Empêcher la modification des lignes automatiques
    if (updated[index].isAutomatic) {
      return;
    }
    updated[index][field] = value;
    setCurrentMonth({ ...currentMonth, otherExpenses: updated });
  };

  const removeOtherExpense = (index) => {
    // Empêcher la suppression des lignes automatiques
    if (currentMonth.otherExpenses[index].isAutomatic) {
      return;
    }
    setCurrentMonth({
      ...currentMonth,
      otherExpenses: currentMonth.otherExpenses.filter((_, i) => i !== index)
    });
  };

  const archiveMonth = async () => {
    const archived = { ...currentMonth, archivedDate: new Date().toISOString() };

    // Sauvegarder le mois archivé
    const monthKey = getMonthKey(currentMonth.month, currentMonth.year);
    await saveMonth(monthKey, archived);

    // Recharger l'historique
    const allMonths = await getAllMonths();
    setHistory(allMonths.map(m => m.data));

    // Passer au mois suivant
    const currentDate = new Date(currentMonth.year,
      ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'].indexOf(currentMonth.month.toLowerCase()));
    currentDate.setMonth(currentDate.getMonth() + 1);

    const nextMonthName = currentDate.toLocaleDateString('fr-FR', { month: 'long' });
    const nextYear = currentDate.getFullYear();

    // Charger le mois suivant s'il existe déjà
    const nextMonthKey = getMonthKey(nextMonthName, nextYear);
    const existingNextMonth = await getMonth(nextMonthKey);

    let nextMonthData = {
      month: nextMonthName,
      year: nextYear,
      monthType: 'complete',
      expenses: {
        rent: '', rentPaidBy: '',
        utilities: '', utilitiesPaidBy: '',
        internet: '', internetPaidBy: '',
        daysRoommate1: '30',
        daysRoommate2: '30'
      },
      sharedExpenses: [],
      otherExpenses: [],
      regularization: { type: '', from: '', to: '', amount: '', date: '', recipient: '' }
    };

    // Si le mois suivant existe déjà, le charger
    if (existingNextMonth) {
      nextMonthData = existingNextMonth;
    }

    // === GESTION AUTOMATIQUE DE LA RÉGULARISATION ===
    if (currentMonth.regularization.type === 'retenue' && currentMonth.regularization.amount) {
      // Trouver l'autre colocataire
      const otherRoommate = roommates.find(r => r !== currentMonth.regularization.recipient);

      // Vérifier si une régularisation automatique de ce mois existe déjà
      const existingAutoExpenseIndex = nextMonthData.otherExpenses.findIndex(
        exp => exp.isAutomatic && exp.fromMonth === monthKey
      );

      const autoExpense = {
        payer: currentMonth.regularization.recipient,
        recipient: otherRoommate,
        amount: currentMonth.regularization.amount,
        description: `Restant du mois ${currentMonth.month} ${currentMonth.year}`,
        isAutomatic: true, // Marquer comme automatique (lecture seule)
        fromMonth: monthKey // Lier au mois d'origine
      };

      if (existingAutoExpenseIndex >= 0) {
        // Mettre à jour l'existant
        nextMonthData.otherExpenses[existingAutoExpenseIndex] = autoExpense;
      } else {
        // Ajouter la nouvelle ligne
        nextMonthData.otherExpenses.push(autoExpense);
      }

      // Sauvegarder le mois suivant avec la régularisation
      await saveMonth(nextMonthKey, nextMonthData);
    }

    setCurrentMonth(nextMonthData);
  };

  const editHistoricalMonth = (index) => {
    setEditingMonth(index);
    setCurrentMonth(history[index]);
    setView('current');
  };

  const saveEditedMonth = async () => {
    if (editingMonth !== null) {
      const monthKey = getMonthKey(currentMonth.month, currentMonth.year);
      await saveMonth(monthKey, currentMonth);

      // Recharger l'historique
      const allMonths = await getAllMonths();
      setHistory(allMonths.map(m => m.data));

      setEditingMonth(null);
      setView('history');
    }
  };

  const cancelEditing = () => {
    setEditingMonth(null);
    const now = new Date();
    setCurrentMonth({
      month: now.toLocaleDateString('fr-FR', { month: 'long' }),
      year: now.getFullYear(),
      monthType: 'complete',
      expenses: {
        rent: '', rentPaidBy: '',
        utilities: '', utilitiesPaidBy: '',
        internet: '', internetPaidBy: '',
        daysRoommate1: '30',
        daysRoommate2: '30'
      },
      sharedExpenses: [],
      otherExpenses: [],
      regularization: { type: '', from: '', to: '', amount: '', date: '', recipient: '' }
    });
    setView('history');
  };

  const calculateBalance = (monthData) => {
    const { expenses, sharedExpenses, otherExpenses, monthType } = monthData;

    const totalFixed = parseFloat(expenses.rent || 0) + parseFloat(expenses.utilities || 0) + parseFloat(expenses.internet || 0);

    let balance = {};

    if (monthType === 'custom') {
      const days1 = parseInt(expenses.daysRoommate1 || 0);
      const days2 = parseInt(expenses.daysRoommate2 || 0);
      const totalDays = days1 + days2;

      if (totalDays > 0) {
        balance[roommates[0]] = (totalFixed * days1) / totalDays;
        balance[roommates[1]] = (totalFixed * days2) / totalDays;
      } else {
        balance[roommates[0]] = totalFixed / 2;
        balance[roommates[1]] = totalFixed / 2;
      }
    } else {
      balance[roommates[0]] = totalFixed / 2;
      balance[roommates[1]] = totalFixed / 2;
    }

    const rentAmount = parseFloat(expenses.rent || 0);
    const utilitiesAmount = parseFloat(expenses.utilities || 0);
    const internetAmount = parseFloat(expenses.internet || 0);

    if (expenses.rentPaidBy) {
      const other = roommates.find(r => r !== expenses.rentPaidBy);
      const share = monthType === 'custom' ?
        (rentAmount * parseInt(expenses[`daysRoommate${roommates.indexOf(other) + 1}`] || 0)) /
        (parseInt(expenses.daysRoommate1 || 0) + parseInt(expenses.daysRoommate2 || 0)) :
        rentAmount / 2;
      balance[expenses.rentPaidBy] -= share;
      if (other) balance[other] += share;
    }

    if (expenses.utilitiesPaidBy) {
      const other = roommates.find(r => r !== expenses.utilitiesPaidBy);
      const share = monthType === 'custom' ?
        (utilitiesAmount * parseInt(expenses[`daysRoommate${roommates.indexOf(other) + 1}`] || 0)) /
        (parseInt(expenses.daysRoommate1 || 0) + parseInt(expenses.daysRoommate2 || 0)) :
        utilitiesAmount / 2;
      balance[expenses.utilitiesPaidBy] -= share;
      if (other) balance[other] += share;
    }

    if (expenses.internetPaidBy) {
      const other = roommates.find(r => r !== expenses.internetPaidBy);
      const share = monthType === 'custom' ?
        (internetAmount * parseInt(expenses[`daysRoommate${roommates.indexOf(other) + 1}`] || 0)) /
        (parseInt(expenses.daysRoommate1 || 0) + parseInt(expenses.daysRoommate2 || 0)) :
        internetAmount / 2;
      balance[expenses.internetPaidBy] -= share;
      if (other) balance[other] += share;
    }

    sharedExpenses.forEach(exp => {
      const share = parseFloat(exp.amount || 0) / 2;
      balance[exp.paidBy] -= share;
      const other = roommates.find(r => r !== exp.paidBy);
      if (other) balance[other] += share;
    });

    otherExpenses.forEach(exp => {
      balance[exp.payer] -= parseFloat(exp.amount || 0);
      balance[exp.recipient] += parseFloat(exp.amount || 0);
    });

    return balance;
  };

  const balance = calculateBalance(currentMonth);
  const owes = balance[roommates[0]] > balance[roommates[1]]
    ? { debtor: roommates[0], creditor: roommates[1], amount: balance[roommates[0]] - balance[roommates[1]] }
    : { debtor: roommates[1], creditor: roommates[0], amount: balance[roommates[1]] - balance[roommates[0]] };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-2 sm:p-4 md:p-8 font-['Archivo',sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;600;700&family=Playfair+Display:wght@700;900&display=swap');

        * { box-sizing: border-box; }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-slide-in { animation: slideIn 0.5s ease-out; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }

        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        input:focus, select:focus {
          outline: none;
          ring: 2px;
          ring-color: rgb(168, 85, 247);
        }

        .glass {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @media (max-width: 640px) {
          .card-hover:hover { transform: none; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 sm:mb-12 animate-slide-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-['Playfair_Display',serif] font-black text-white mb-2 sm:mb-3 tracking-tight">
            Coloc<span className="gradient-text">Manager</span>
          </h1>
          <p className="text-purple-200 text-sm sm:text-lg font-light">Gérez votre colocation en toute simplicité</p>
        </div>

        {!isSetupComplete ? (
          <div className="glass rounded-2xl p-4 sm:p-8 mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">Configuration initiale</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-purple-200 text-sm mb-2">Ajouter les colocataires (2 maximum)</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newRoommateName}
                    onChange={(e) => setNewRoommateName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addRoommate()}
                    placeholder="Nom du colocataire"
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 transition-all"
                  />
                  <button
                    onClick={addRoommate}
                    disabled={roommates.length >= 2}
                    className="px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Ajouter</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {roommates.map((name, index) => (
                  <div key={index} className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10">
                    <span className="text-white font-medium">{name}</span>
                    <button onClick={() => removeRoommate(index)} className="text-red-400 hover:text-red-300 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              {roommates.length === 2 && (
                <div>
                  <label className="block text-purple-200 text-sm mb-2">Premier mois de la colocation</label>
                  <input
                    type="month"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-purple-400 transition-all"
                  />
                </div>
              )}
            </div>

            {roommates.length < 2 && (
              <p className="text-purple-300 text-sm mt-4 text-center">
                Ajoutez {2 - roommates.length} colocataire{2 - roommates.length > 1 ? 's' : ''} pour continuer
              </p>
            )}

            {roommates.length === 2 && (
              <button
                onClick={finalizeSetup}
                disabled={!startDate}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Check className="w-5 h-5" />
                Commencer la gestion
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <button
                onClick={() => editingMonth === null && setView('current')}
                disabled={editingMonth !== null}
                className={`px-6 sm:px-8 py-3 rounded-xl font-semibold transition-all ${view === 'current'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'glass text-purple-200 hover:bg-white/10 disabled:opacity-50'
                  }`}
              >
                <Calendar className="w-5 h-5 inline mr-2" />
                {editingMonth !== null ? 'Modification en cours' : 'Mois en cours'}
              </button>
              <button
                onClick={() => editingMonth === null && setView('history')}
                disabled={editingMonth !== null}
                className={`px-6 sm:px-8 py-3 rounded-xl font-semibold transition-all ${view === 'history'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'glass text-purple-200 hover:bg-white/10 disabled:opacity-50'
                  }`}
              >
                <FileText className="w-5 h-5 inline mr-2" />
                Historique
              </button>
            </div>

            {view === 'current' ? (
              <>
                <div className="glass rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-center">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">
                    {currentMonth.month} {currentMonth.year}
                  </h3>
                  {editingMonth !== null && (
                    <div className="mt-2 px-4 py-2 bg-yellow-600/30 rounded-full inline-flex items-center gap-2">
                      <Edit2 className="w-4 h-4 text-yellow-300" />
                      <span className="text-yellow-200 text-sm">Mode édition</span>
                    </div>
                  )}
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4">
                    {roommates.map((name, i) => (
                      <span key={i} className="px-3 sm:px-4 py-2 bg-purple-600/30 rounded-full text-purple-200 text-xs sm:text-sm">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-4 mb-6 sm:mb-8 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('frais')}
                    className={`flex-1 min-w-[140px] py-3 sm:py-4 px-3 rounded-xl font-semibold transition-all text-sm sm:text-base ${activeTab === 'frais'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'glass text-purple-200 hover:bg-white/10'
                      }`}
                  >
                    <Receipt className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                    Gestion des frais
                  </button>
                  <button
                    onClick={() => setActiveTab('regularisation')}
                    className={`flex-1 min-w-[140px] py-3 sm:py-4 px-3 rounded-xl font-semibold transition-all text-sm sm:text-base ${activeTab === 'regularisation'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'glass text-purple-200 hover:bg-white/10'
                      }`}
                  >
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                    Régularisation
                  </button>
                </div>

                {activeTab === 'frais' && (
                  <div className="space-y-4 sm:space-y-6 animate-fade-in">
                    <div className="glass rounded-2xl p-4 sm:p-6 card-hover">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Euro className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                        Loyer et Charges
                      </h3>

                      {/* Type de mois */}
                      <div className="mb-6 bg-white/5 rounded-xl p-4 border border-white/10">
                        <label className="block text-purple-200 text-sm mb-3 font-semibold">Type de mois</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            onClick={() => setCurrentMonth({ ...currentMonth, monthType: 'complete' })}
                            className={`p-3 rounded-lg border-2 transition-all text-sm ${currentMonth.monthType === 'complete'
                                ? 'bg-green-600/30 border-green-400 text-white'
                                : 'border-white/20 text-purple-200 hover:border-white/40'
                              }`}
                          >
                            <div className="font-semibold">Mois complet</div>
                            <div className="text-xs opacity-80">Division égale 50/50</div>
                          </button>
                          <button
                            onClick={() => setCurrentMonth({ ...currentMonth, monthType: 'custom' })}
                            className={`p-3 rounded-lg border-2 transition-all text-sm ${currentMonth.monthType === 'custom'
                                ? 'bg-blue-600/30 border-blue-400 text-white'
                                : 'border-white/20 text-purple-200 hover:border-white/40'
                              }`}
                          >
                            <div className="font-semibold">Personnalisé</div>
                            <div className="text-xs opacity-80">Selon jours habités</div>
                          </button>
                        </div>
                      </div>

                      {/* Jours personnalisés */}
                      {currentMonth.monthType === 'custom' && (
                        <div className="mb-6 bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
                          <label className="block text-blue-200 text-sm mb-3 font-semibold">Nombre de jours habités</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-blue-300 text-xs mb-1">{roommates[0]}</label>
                              <input
                                type="number"
                                value={currentMonth.expenses.daysRoommate1}
                                onChange={(e) => setCurrentMonth({
                                  ...currentMonth,
                                  expenses: { ...currentMonth.expenses, daysRoommate1: e.target.value }
                                })}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                                placeholder="Nombre de jours"
                                min="0"
                                max="31"
                              />
                            </div>
                            <div>
                              <label className="block text-blue-300 text-xs mb-1">{roommates[1]}</label>
                              <input
                                type="number"
                                value={currentMonth.expenses.daysRoommate2}
                                onChange={(e) => setCurrentMonth({
                                  ...currentMonth,
                                  expenses: { ...currentMonth.expenses, daysRoommate2: e.target.value }
                                })}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                                placeholder="Nombre de jours"
                                min="0"
                                max="31"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10">
                          <label className="block text-purple-200 text-sm mb-3 font-semibold">Loyer</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-purple-300 text-xs mb-1">Montant total du loyer</label>
                              <input
                                type="number"
                                value={currentMonth.expenses.rent}
                                onChange={(e) => setCurrentMonth({
                                  ...currentMonth,
                                  expenses: { ...currentMonth.expenses, rent: e.target.value }
                                })}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 text-sm sm:text-base"
                                placeholder="Ex: 800.00"
                              />
                            </div>
                            <div>
                              <label className="block text-purple-300 text-xs mb-1">Qui a payé le loyer ?</label>
                              <select
                                value={currentMonth.expenses.rentPaidBy}
                                onChange={(e) => setCurrentMonth({
                                  ...currentMonth,
                                  expenses: { ...currentMonth.expenses, rentPaidBy: e.target.value }
                                })}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm sm:text-base"
                              >
                                <option value="">Sélectionner</option>
                                {roommates.map((name, i) => (
                                  <option key={i} value={name}>{name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10">
                          <label className="block text-purple-200 text-sm mb-3 font-semibold">Gaz & Électricité</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-purple-300 text-xs mb-1">Montant des factures</label>
                              <input
                                type="number"
                                value={currentMonth.expenses.utilities}
                                onChange={(e) => setCurrentMonth({
                                  ...currentMonth,
                                  expenses: { ...currentMonth.expenses, utilities: e.target.value }
                                })}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 text-sm sm:text-base"
                                placeholder="Ex: 120.00"
                              />
                            </div>
                            <div>
                              <label className="block text-purple-300 text-xs mb-1">Qui a payé ?</label>
                              <select
                                value={currentMonth.expenses.utilitiesPaidBy}
                                onChange={(e) => setCurrentMonth({
                                  ...currentMonth,
                                  expenses: { ...currentMonth.expenses, utilitiesPaidBy: e.target.value }
                                })}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm sm:text-base"
                              >
                                <option value="">Sélectionner</option>
                                {roommates.map((name, i) => (
                                  <option key={i} value={name}>{name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10">
                          <label className="block text-purple-200 text-sm mb-3 font-semibold">Internet</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-purple-300 text-xs mb-1">Montant de l'abonnement</label>
                              <input
                                type="number"
                                value={currentMonth.expenses.internet}
                                onChange={(e) => setCurrentMonth({
                                  ...currentMonth,
                                  expenses: { ...currentMonth.expenses, internet: e.target.value }
                                })}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 text-sm sm:text-base"
                                placeholder="Ex: 30.00"
                              />
                            </div>
                            <div>
                              <label className="block text-purple-300 text-xs mb-1">Qui a payé ?</label>
                              <select
                                value={currentMonth.expenses.internetPaidBy}
                                onChange={(e) => setCurrentMonth({
                                  ...currentMonth,
                                  expenses: { ...currentMonth.expenses, internetPaidBy: e.target.value }
                                })}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm sm:text-base"
                              >
                                <option value="">Sélectionner</option>
                                {roommates.map((name, i) => (
                                  <option key={i} value={name}>{name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="glass rounded-2xl p-4 sm:p-6 card-hover">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                          <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                          Frais Partagés
                        </h3>
                        <button onClick={addSharedExpense} className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm">
                          <Plus className="w-4 h-4" />
                          <span className="hidden sm:inline">Ajouter</span>
                        </button>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 mb-4">
                        <p className="text-blue-200 text-xs sm:text-sm flex items-start gap-2">
                          <span className="text-blue-400 text-lg">ℹ️</span>
                          <span>Les frais partagés sont automatiquement divisés à <strong>50%</strong> pour chaque colocataire</span>
                        </p>
                      </div>
                      <div className="space-y-3">
                        {currentMonth.sharedExpenses.map((exp, index) => (
                          <div key={index} className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10">
                            <div className="grid grid-cols-1 gap-3 mb-3">
                              <input
                                type="text"
                                value={exp.description}
                                onChange={(e) => updateSharedExpense(index, 'description', e.target.value)}
                                placeholder="Description (ex: courses, restaurant...)"
                                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm"
                              />
                              <div className="grid grid-cols-2 gap-3">
                                <input
                                  type="number"
                                  value={exp.amount}
                                  onChange={(e) => updateSharedExpense(index, 'amount', e.target.value)}
                                  placeholder="Montant total"
                                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm"
                                />
                                <select
                                  value={exp.paidBy}
                                  onChange={(e) => updateSharedExpense(index, 'paidBy', e.target.value)}
                                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                                >
                                  <option value="">Payé par ?</option>
                                  {roommates.map((name, i) => (
                                    <option key={i} value={name}>{name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-purple-300">Part par personne: {formatEuro(exp.amount / 2)}</span>
                              <button onClick={() => removeSharedExpense(index)} className="text-red-400 hover:text-red-300">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {currentMonth.sharedExpenses.length === 0 && (
                          <p className="text-center text-purple-300 py-4 text-sm">Aucun frais partagé</p>
                        )}
                      </div>
                    </div>

                    <div className="glass rounded-2xl p-4 sm:p-6 card-hover">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                          Autres Frais
                        </h3>
                        <button onClick={addOtherExpense} className="px-3 sm:px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm">
                          <Plus className="w-4 h-4" />
                          <span className="hidden sm:inline">Ajouter</span>
                        </button>
                      </div>
                      <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3 mb-4">
                        <p className="text-yellow-200 text-xs sm:text-sm">
                          Utilisez cette section quand un colocataire avance de l'argent pour l'autre
                        </p>
                      </div>
                      <div className="space-y-3">
                        {currentMonth.otherExpenses.map((exp, index) => (
                          <div
                            key={index}
                            className={`rounded-xl p-3 sm:p-4 border ${
                              exp.isAutomatic
                                ? 'bg-blue-500/10 border-blue-400/50 relative'
                                : 'bg-white/5 border-white/10'
                            }`}
                          >
                            {/* Badge AUTOMATIQUE */}
                            {exp.isAutomatic && (
                              <div className="mb-3 flex items-center gap-2">
                                <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                                  🔒 AUTOMATIQUE - LECTURE SEULE
                                </span>
                                <span className="text-blue-300 text-xs italic">
                                  (Synchronisé depuis la régularisation)
                                </span>
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              <select
                                value={exp.payer}
                                onChange={(e) => updateOtherExpense(index, 'payer', e.target.value)}
                                disabled={exp.isAutomatic}
                                className={`px-3 py-2 ${
                                  exp.isAutomatic
                                    ? 'bg-gray-700/50 cursor-not-allowed opacity-60'
                                    : 'bg-white/10'
                                } border border-white/20 rounded-lg text-white text-sm`}
                              >
                                <option value="">Qui a payé ?</option>
                                {roommates.map((name, i) => (
                                  <option key={i} value={name}>{name}</option>
                                ))}
                              </select>
                              <select
                                value={exp.recipient}
                                onChange={(e) => updateOtherExpense(index, 'recipient', e.target.value)}
                                disabled={exp.isAutomatic}
                                className={`px-3 py-2 ${
                                  exp.isAutomatic
                                    ? 'bg-gray-700/50 cursor-not-allowed opacity-60'
                                    : 'bg-white/10'
                                } border border-white/20 rounded-lg text-white text-sm`}
                              >
                                <option value="">Pour qui ?</option>
                                {roommates.map((name, i) => (
                                  <option key={i} value={name}>{name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              <input
                                type="number"
                                value={exp.amount}
                                onChange={(e) => updateOtherExpense(index, 'amount', e.target.value)}
                                disabled={exp.isAutomatic}
                                placeholder="Montant avancé"
                                className={`px-3 py-2 ${
                                  exp.isAutomatic
                                    ? 'bg-gray-700/50 cursor-not-allowed opacity-60'
                                    : 'bg-white/10'
                                } border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm`}
                              />
                              <input
                                type="text"
                                value={exp.description}
                                onChange={(e) => updateOtherExpense(index, 'description', e.target.value)}
                                disabled={exp.isAutomatic}
                                placeholder="Motif (ex: médicaments, taxi...)"
                                className={`px-3 py-2 ${
                                  exp.isAutomatic
                                    ? 'bg-gray-700/50 cursor-not-allowed opacity-60'
                                    : 'bg-white/10'
                                } border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm`}
                              />
                            </div>
                            <div className="flex justify-end">
                              {!exp.isAutomatic && (
                                <button onClick={() => removeOtherExpense(index)} className="text-red-400 hover:text-red-300">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {currentMonth.otherExpenses.length === 0 && (
                          <p className="text-center text-purple-300 py-4 text-sm">Aucun autre frais</p>
                        )}
                      </div>
                    </div>

                    <div className="glass rounded-2xl p-4 sm:p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-400/30">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-4 text-center">Résumé</h3>
                      <div className="text-center">
                        <p className="text-purple-200 text-sm sm:text-base mb-2">
                          <span className="font-bold text-white">{owes.debtor}</span> doit{' '}
                          <span className="text-2xl sm:text-3xl font-bold text-green-400 block sm:inline my-2 sm:my-0">{formatEuro(Math.abs(owes.amount))}</span>{' '}
                          à <span className="font-bold text-white">{owes.creditor}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'regularisation' && (
                  <div className="space-y-4 sm:space-y-6 animate-fade-in">
                    <div className="glass rounded-2xl p-4 sm:p-6">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Type de régularisation</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <button
                          onClick={() => setCurrentMonth({ ...currentMonth, regularization: { ...currentMonth.regularization, type: 'ponctuelle' } })}
                          className={`p-4 rounded-xl border-2 transition-all ${currentMonth.regularization.type === 'ponctuelle'
                              ? 'bg-blue-600/30 border-blue-400 text-white'
                              : 'border-white/20 text-purple-200 hover:border-white/40'
                            }`}
                        >
                          <Check className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2" />
                          <div className="font-semibold text-sm sm:text-base">Régularisation ponctuelle</div>
                          <div className="text-xs sm:text-sm opacity-80">Virement immédiat</div>
                        </button>
                        <button
                          onClick={() => setCurrentMonth({ ...currentMonth, regularization: { ...currentMonth.regularization, type: 'retenue' } })}
                          className={`p-4 rounded-xl border-2 transition-all ${currentMonth.regularization.type === 'retenue'
                              ? 'bg-purple-600/30 border-purple-400 text-white'
                              : 'border-white/20 text-purple-200 hover:border-white/40'
                            }`}
                        >
                          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2" />
                          <div className="font-semibold text-sm sm:text-base">Retenue</div>
                          <div className="text-xs sm:text-sm opacity-80">Déduction mois suivant</div>
                        </button>
                      </div>

                      {currentMonth.regularization.type === 'ponctuelle' && (
                        <div className="space-y-4 bg-white/5 rounded-xl p-3 sm:p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-purple-200 text-xs sm:text-sm mb-2">Qui doit payer ?</label>
                              <select
                                value={currentMonth.regularization.from}
                                onChange={(e) => setCurrentMonth({ ...currentMonth, regularization: { ...currentMonth.regularization, from: e.target.value } })}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm sm:text-base"
                              >
                                <option value="">Sélectionner</option>
                                {roommates.map((name, i) => (
                                  <option key={i} value={name}>{name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-purple-200 text-xs sm:text-sm mb-2">À qui ?</label>
                              <select
                                value={currentMonth.regularization.to}
                                onChange={(e) => setCurrentMonth({ ...currentMonth, regularization: { ...currentMonth.regularization, to: e.target.value } })}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm sm:text-base"
                              >
                                <option value="">Sélectionner</option>
                                {roommates.map((name, i) => (
                                  <option key={i} value={name}>{name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-purple-200 text-xs sm:text-sm mb-2">Montant du virement</label>
                              <input
                                type="number"
                                value={currentMonth.regularization.amount}
                                onChange={(e) => setCurrentMonth({ ...currentMonth, regularization: { ...currentMonth.regularization, amount: e.target.value } })}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm sm:text-base"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-purple-200 text-xs sm:text-sm mb-2">Date prévue</label>
                              <input
                                type="date"
                                value={currentMonth.regularization.date}
                                onChange={(e) => setCurrentMonth({ ...currentMonth, regularization: { ...currentMonth.regularization, date: e.target.value } })}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm sm:text-base"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {currentMonth.regularization.type === 'retenue' && (
                        <div className="space-y-4 bg-white/5 rounded-xl p-3 sm:p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-purple-200 text-xs sm:text-sm mb-2">Montant à déduire du prochain loyer</label>
                              <input
                                type="number"
                                value={currentMonth.regularization.amount}
                                onChange={(e) => setCurrentMonth({ ...currentMonth, regularization: { ...currentMonth.regularization, amount: e.target.value } })}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm sm:text-base"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-purple-200 text-xs sm:text-sm mb-2">Déduction appliquée pour</label>
                              <select
                                value={currentMonth.regularization.recipient}
                                onChange={(e) => setCurrentMonth({ ...currentMonth, regularization: { ...currentMonth.regularization, recipient: e.target.value } })}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm sm:text-base"
                              >
                                <option value="">Sélectionner</option>
                                {roommates.map((name, i) => (
                                  <option key={i} value={name}>{name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
                  {editingMonth === null ? (
                    <>
                      <button
                        onClick={() => generateStyledPDF(currentMonth, roommates)}
                        className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
                      >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                        Télécharger PDF
                      </button>
                      <button
                        onClick={archiveMonth}
                        className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
                      >
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                        Archiver le mois
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={saveEditedMonth}
                        className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
                      >
                        <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                        Sauvegarder
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        Annuler
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Historique des mois</h2>
                {history.length === 0 ? (
                  <div className="glass rounded-2xl p-8 sm:p-12 text-center">
                    <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400 mx-auto mb-4 opacity-50" />
                    <p className="text-purple-300 text-base sm:text-lg">Aucun mois archivé</p>
                  </div>
                ) : (
                  history.map((month, index) => {
                    const monthBalance = calculateBalance(month);
                    const monthOwes = monthBalance[roommates[0]] > monthBalance[roommates[1]]
                      ? { debtor: roommates[0], creditor: roommates[1], amount: monthBalance[roommates[0]] - monthBalance[roommates[1]] }
                      : { debtor: roommates[1], creditor: roommates[0], amount: monthBalance[roommates[1]] - monthBalance[roommates[0]] };

                    return (
                      <div key={index} className="glass rounded-2xl p-4 sm:p-6 card-hover">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <h3 className="text-lg sm:text-xl font-bold text-white">
                            {month.month} {month.year}
                          </h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => editHistoricalMonth(index)}
                              className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm"
                            >
                              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Modifier</span>
                            </button>
                            <button
                              onClick={() => generateStyledPDF(month, roommates)}
                              className="px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm"
                            >
                              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">PDF</span>
                            </button>
                          </div>
                        </div>
                        <div className="bg-purple-600/20 rounded-xl p-3 sm:p-4 border border-purple-400/30">
                          <p className="text-purple-200 text-center text-sm sm:text-base">
                            <span className="font-bold text-white">{monthOwes.debtor}</span> devait{' '}
                            <span className="text-xl sm:text-2xl font-bold text-green-400 block sm:inline my-2 sm:my-0">{formatEuro(Math.abs(monthOwes.amount))}</span>{' '}
                            à <span className="font-bold text-white">{monthOwes.creditor}</span>
                          </p>
                          {month.regularization.type && (
                            <p className="text-purple-300 text-xs sm:text-sm text-center mt-2">
                              Régularisation: {month.regularization.type === 'ponctuelle' ? 'Ponctuelle' : 'Retenue'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;
