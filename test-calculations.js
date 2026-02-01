// Script de test pour valider les calculs de balance
// Test de la fonction calculateBalance après corrections

const calculateBalance = (monthData, roommates) => {
  const { expenses, sharedExpenses, otherExpenses, monthType } = monthData;

  const totalFixed = parseFloat(expenses.rent || 0) + parseFloat(expenses.utilities || 0) + parseFloat(expenses.internet || 0);
  const rentAmount = parseFloat(expenses.rent || 0);
  const utilitiesAmount = parseFloat(expenses.utilities || 0);
  const internetAmount = parseFloat(expenses.internet || 0);

  // Initialiser le balance à 0 pour chaque colocataire
  let balance = {
    [roommates[0]]: 0,
    [roommates[1]]: 0
  };

  // ÉTAPE 1 : Soustraire ce qui a été payé (négatif = a payé)
  if (expenses.rentPaidBy) {
    balance[expenses.rentPaidBy] -= rentAmount;
  }
  if (expenses.utilitiesPaidBy) {
    balance[expenses.utilitiesPaidBy] -= utilitiesAmount;
  }
  if (expenses.internetPaidBy) {
    balance[expenses.internetPaidBy] -= internetAmount;
  }

  // ÉTAPE 2 : Ajouter ce qui est dû (positif = doit)
  if (monthType === 'custom') {
    const days1 = parseInt(expenses.daysRoommate1 || 0);
    const days2 = parseInt(expenses.daysRoommate2 || 0);
    const totalDays = days1 + days2;

    if (totalDays > 0) {
      balance[roommates[0]] += (totalFixed * days1) / totalDays;
      balance[roommates[1]] += (totalFixed * days2) / totalDays;
    } else {
      balance[roommates[0]] += totalFixed / 2;
      balance[roommates[1]] += totalFixed / 2;
    }
  } else {
    // Mois complet : division égale 50/50
    balance[roommates[0]] += totalFixed / 2;
    balance[roommates[1]] += totalFixed / 2;
  }

  // ÉTAPE 3 : Frais partagés
  sharedExpenses.forEach(exp => {
    const share = parseFloat(exp.amount || 0) / 2;
    balance[exp.paidBy] -= share;
    const other = roommates.find(r => r !== exp.paidBy);
    if (other) balance[other] += share;
  });

  // ÉTAPE 4 : Autres frais
  otherExpenses.forEach(exp => {
    balance[exp.payer] -= parseFloat(exp.amount || 0);
    balance[exp.recipient] += parseFloat(exp.amount || 0);
  });

  return balance;
};

const formatEuro = (amount) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);
};

// Fonction utilitaire pour afficher le résultat
const printResult = (testName, balance, roommates, expected) => {
  // Le balance négatif = créditeur (on lui doit), positif = débiteur (il doit)
  // Donc on cherche qui a un balance positif (le débiteur)
  const owes = balance[roommates[0]] > 0
    ? { debtor: roommates[0], creditor: roommates[1], amount: balance[roommates[0]] }
    : { debtor: roommates[1], creditor: roommates[0], amount: balance[roommates[1]] };

  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${testName}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Balance ${roommates[0]}: ${formatEuro(balance[roommates[0]])}`);
  console.log(`Balance ${roommates[1]}: ${formatEuro(balance[roommates[1]])}`);
  console.log(`\nRésultat: ${owes.debtor} doit ${formatEuro(Math.abs(owes.amount))} à ${owes.creditor}`);
  console.log(`Attendu: ${expected}`);

  const isCorrect = Math.abs(Math.abs(owes.amount) - parseFloat(expected.match(/[\d.]+/)[0])) < 0.01;
  console.log(`\n✅ STATUT: ${isCorrect ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'}`);

  return isCorrect;
};

// Tests
const roommates = ['Alice', 'Bob'];
let passedTests = 0;
let totalTests = 0;

console.log('\n');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     TESTS DE VALIDATION - CALCUL DE BALANCE CORRIGÉ       ║');
console.log('╔════════════════════════════════════════════════════════════╗');

// Test 1: Frais Fixes - Mode Complet (50/50)
totalTests++;
const test1 = {
  monthType: 'complete',
  expenses: {
    rent: '800',
    rentPaidBy: 'Alice',
    utilities: '0',
    internet: '0',
    daysRoommate1: '30',
    daysRoommate2: '30'
  },
  sharedExpenses: [],
  otherExpenses: []
};
const balance1 = calculateBalance(test1, roommates);
if (printResult('Test 1: Loyer 800€ payé par Alice (50/50)', balance1, roommates, '400€')) passedTests++;

// Test 2: Frais Fixes - Mode Custom (Prorata)
totalTests++;
const test2 = {
  monthType: 'custom',
  expenses: {
    rent: '900',
    rentPaidBy: 'Bob',
    utilities: '0',
    internet: '0',
    daysRoommate1: '10',
    daysRoommate2: '20'
  },
  sharedExpenses: [],
  otherExpenses: []
};
const balance2 = calculateBalance(test2, roommates);
if (printResult('Test 2: Loyer 900€ payé par Bob (10j/20j)', balance2, roommates, '300€')) passedTests++;

// Test 3: Frais Fixes Multiples - Mode Complet
totalTests++;
const test3 = {
  monthType: 'complete',
  expenses: {
    rent: '800',
    rentPaidBy: 'Alice',
    utilities: '120',
    utilitiesPaidBy: 'Bob',
    internet: '30',
    internetPaidBy: 'Alice',
    daysRoommate1: '30',
    daysRoommate2: '30'
  },
  sharedExpenses: [],
  otherExpenses: []
};
const balance3 = calculateBalance(test3, roommates);
if (printResult('Test 3: Loyer 800€ (Alice) + Électricité 120€ (Bob) + Internet 30€ (Alice)', balance3, roommates, '355€')) passedTests++;

// Test 4: Frais Partagés (50/50)
totalTests++;
const test4 = {
  monthType: 'complete',
  expenses: {
    rent: '0',
    utilities: '0',
    internet: '0',
    daysRoommate1: '30',
    daysRoommate2: '30'
  },
  sharedExpenses: [
    { description: 'Courses', amount: '60', paidBy: 'Alice' },
    { description: 'Restaurant', amount: '80', paidBy: 'Bob' }
  ],
  otherExpenses: []
};
const balance4 = calculateBalance(test4, roommates);
if (printResult('Test 4: Courses 60€ (Alice) + Restaurant 80€ (Bob)', balance4, roommates, '10€')) passedTests++;

// Test 5: Autres Frais (Avances)
totalTests++;
const test5 = {
  monthType: 'complete',
  expenses: {
    rent: '0',
    utilities: '0',
    internet: '0',
    daysRoommate1: '30',
    daysRoommate2: '30'
  },
  sharedExpenses: [],
  otherExpenses: [
    { payer: 'Alice', recipient: 'Bob', amount: '50', description: 'Médicaments' },
    { payer: 'Bob', recipient: 'Alice', amount: '30', description: 'Taxi' }
  ]
};
const balance5 = calculateBalance(test5, roommates);
if (printResult('Test 5: Alice avance 50€ pour Bob, Bob avance 30€ pour Alice', balance5, roommates, '20€')) passedTests++;

// Test 6: Scénario Complet Mixte
totalTests++;
const test6 = {
  monthType: 'complete',
  expenses: {
    rent: '800',
    rentPaidBy: 'Alice',
    utilities: '100',
    utilitiesPaidBy: 'Bob',
    internet: '40',
    internetPaidBy: 'Alice',
    daysRoommate1: '30',
    daysRoommate2: '30'
  },
  sharedExpenses: [
    { description: 'Courses', amount: '80', paidBy: 'Alice' }
  ],
  otherExpenses: [
    { payer: 'Alice', recipient: 'Bob', amount: '25', description: 'Avance' }
  ]
};
const balance6 = calculateBalance(test6, roommates);
if (printResult('Test 6: Scénario complet (loyer + charges + courses + avance)', balance6, roommates, '435€')) passedTests++;

// Résumé
console.log('\n');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                    RÉSUMÉ DES TESTS                        ║');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log(`\nTests réussis: ${passedTests}/${totalTests}`);
console.log(`Taux de réussite: ${((passedTests/totalTests)*100).toFixed(2)}%`);
console.log('\n');

if (passedTests === totalTests) {
  console.log('🎉 TOUS LES TESTS SONT RÉUSSIS ! 🎉');
  console.log('✅ La fonction calculateBalance fonctionne correctement.');
  process.exit(0);
} else {
  console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ');
  console.log(`⚠️  ${totalTests - passedTests} test(s) à corriger`);
  process.exit(1);
}
