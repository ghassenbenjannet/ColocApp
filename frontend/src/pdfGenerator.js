import jsPDF from 'jspdf';
import 'jspdf-autotable';

const formatEuro = (amount) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);
};

export const generateStyledPDF = (monthData, roommates) => {
  const { month, year, expenses, sharedExpenses, otherExpenses, regularization, monthType } = monthData;

  // Créer le PDF
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Couleurs du thème
  const primaryColor = [102, 126, 234]; // Bleu-violet
  const secondaryColor = [139, 92, 246]; // Violet
  const accentColor = [236, 72, 153]; // Rose
  const darkBg = [30, 27, 75]; // Fond sombre
  const lightText = [255, 255, 255]; // Blanc

  // === EN-TÊTE AVEC DÉGRADÉ ===
  // Simuler un dégradé avec des rectangles
  for (let i = 0; i < 50; i++) {
    const ratio = i / 50;
    const r = primaryColor[0] + (secondaryColor[0] - primaryColor[0]) * ratio;
    const g = primaryColor[1] + (secondaryColor[1] - primaryColor[1]) * ratio;
    const b = primaryColor[2] + (secondaryColor[2] - primaryColor[2]) * ratio;
    doc.setFillColor(r, g, b);
    doc.rect(0, i * 0.6, pageWidth, 0.6, 'F');
  }

  // Logo et titre
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('ColocManager', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Récapitulatif de Colocation', pageWidth / 2, 22, { align: 'center' });

  // Mois et année - Encadré
  let yPosition = 30;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(pageWidth / 2 - 50, yPosition, 100, 12, 3, 3, 'FD');

  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`, pageWidth / 2, yPosition + 8, { align: 'center' });

  yPosition = 48;

  // === SECTION COLOCATAIRES ===
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(14, yPosition, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('COLOCATAIRES', 16, yPosition + 5.5);

  yPosition += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  roommates.forEach((name, index) => {
    doc.text(`${index + 1}. ${name}`, 20, yPosition);
    yPosition += 6;
  });

  // Type de mois
  yPosition += 3;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Type de mois: ${monthType === 'custom' ? 'Personnalise (au prorata des jours)' : 'Complet (50/50)'}`, 20, yPosition);
  yPosition += 12;

  // === SECTION FRAIS FIXES ===
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, yPosition, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('FRAIS FIXES', 16, yPosition + 5.5);
  yPosition += 12;

  const totalRent = parseFloat(expenses.rent || 0);
  const totalUtilities = parseFloat(expenses.utilities || 0);
  const totalInternet = parseFloat(expenses.internet || 0);
  const fixedTotal = totalRent + totalUtilities + totalInternet;

  // Calcul des parts
  let perPerson1, perPerson2;
  if (monthType === 'custom') {
    const days1 = parseInt(expenses.daysRoommate1 || 0);
    const days2 = parseInt(expenses.daysRoommate2 || 0);
    const totalDays = days1 + days2;
    perPerson1 = totalDays > 0 ? (fixedTotal * days1) / totalDays : 0;
    perPerson2 = totalDays > 0 ? (fixedTotal * days2) / totalDays : 0;
  } else {
    perPerson1 = fixedTotal / 2;
    perPerson2 = fixedTotal / 2;
  }

  // Tableau des frais fixes
  const fixedExpensesData = [
    ['Loyer', formatEuro(totalRent), expenses.rentPaidBy || '-'],
    ['Gaz & Electricite', formatEuro(totalUtilities), expenses.utilitiesPaidBy || '-'],
    ['Internet', formatEuro(totalInternet), expenses.internetPaidBy || '-'],
  ];

  doc.autoTable({
    startY: yPosition,
    head: [['Type', 'Montant', 'Payé par']],
    body: fixedExpensesData,
    theme: 'grid',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'left'
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
      minCellHeight: 10
    },
    columnStyles: {
      0: { cellWidth: 60 },      // Type
      1: { cellWidth: 50, halign: 'right' },  // Montant
      2: { cellWidth: 'auto' }   // Payé par
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 }
  });

  yPosition = doc.lastAutoTable.finalY + 5;

  // Total et répartition
  doc.setFillColor(245, 245, 245);
  doc.rect(14, yPosition, pageWidth - 28, 20, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL FRAIS FIXES:', 20, yPosition + 6);
  doc.text(formatEuro(fixedTotal), pageWidth - 20, yPosition + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (monthType === 'custom') {
    const days1 = parseInt(expenses.daysRoommate1 || 0);
    const days2 = parseInt(expenses.daysRoommate2 || 0);
    doc.text(`Part ${roommates[0]}: ${formatEuro(perPerson1)} (${days1} jours)`, 20, yPosition + 12);
    doc.text(`Part ${roommates[1]}: ${formatEuro(perPerson2)} (${days2} jours)`, 20, yPosition + 17);
  } else {
    doc.text(`Part par personne: ${formatEuro(perPerson1)}`, 20, yPosition + 12);
  }

  yPosition += 28;

  // === SECTION FRAIS PARTAGÉS ===
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, yPosition, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('FRAIS PARTAGES (50% chacun)', 16, yPosition + 5.5);
  yPosition += 12;

  if (sharedExpenses.length === 0) {
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('Aucun frais partagé ce mois-ci', 20, yPosition);
    yPosition += 10;
  } else {
    const sharedExpensesData = sharedExpenses.map(exp => [
      exp.description || '-',
      formatEuro(exp.amount),
      exp.paidBy || '-',
      formatEuro(exp.amount / 2)
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Description', 'Montant Total', 'Payé par', 'Part/personne']],
      body: sharedExpensesData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'left'
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
        minCellHeight: 10,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 60 },      // Description
        1: { cellWidth: 35, halign: 'right' },  // Montant Total
        2: { cellWidth: 45 },      // Payé par
        3: { cellWidth: 35, halign: 'right' }   // Part/personne
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 14, right: 14 }
    });

    yPosition = doc.lastAutoTable.finalY + 12;
  }

  // === SECTION AUTRES FRAIS ===
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(14, yPosition, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTRES FRAIS (Avances)', 16, yPosition + 5.5);
  yPosition += 12;

  if (otherExpenses.length === 0) {
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('Aucun autre frais ce mois-ci', 20, yPosition);
    yPosition += 10;
  } else {
    const otherExpensesData = otherExpenses.map(exp => [
      exp.payer || '-',
      exp.recipient || '-',
      formatEuro(exp.amount),
      exp.description || '-'
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Payeur', 'Beneficiaire', 'Montant', 'Motif']],
      body: otherExpensesData,
      theme: 'grid',
      headStyles: {
        fillColor: [236, 72, 153],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'left'
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
        minCellHeight: 10,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 40 },      // Payeur
        1: { cellWidth: 40 },      // Beneficiaire
        2: { cellWidth: 35, halign: 'right' },  // Montant
        3: { cellWidth: 'auto' }   // Motif
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 14, right: 14 }
    });

    yPosition = doc.lastAutoTable.finalY + 12;
  }

  // === SECTION RÉGULARISATION ===
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFillColor(168, 85, 247);
  doc.rect(14, yPosition, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('REGULARISATION', 16, yPosition + 5.5);
  yPosition += 12;

  if (!regularization.type) {
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('Aucune regularisation prevue', 20, yPosition);
    yPosition += 10;
  } else {
    doc.setFillColor(250, 250, 250);
    doc.rect(14, yPosition, pageWidth - 28,
      regularization.type === 'ponctuelle' ? 22 : 16, 'F');

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);

    if (regularization.type === 'ponctuelle') {
      doc.text('Type: Regularisation ponctuelle (virement immediat)', 20, yPosition + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${regularization.from} doit verser ${formatEuro(regularization.amount)} a ${regularization.to}`, 20, yPosition + 11);
      if (regularization.date) {
        doc.text(`Date prevue: ${new Date(regularization.date).toLocaleDateString('fr-FR')}`, 20, yPosition + 17);
      }
      yPosition += 25;
    } else {
      doc.text('Type: Retenue sur le mois suivant', 20, yPosition + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Montant a deduire: ${formatEuro(regularization.amount)} (deduction pour ${regularization.recipient})`, 20, yPosition + 11);
      yPosition += 18;
    }
  }

  // === RÉCAPITULATIF FINAL ===
  if (yPosition > pageHeight - 50) {
    doc.addPage();
    yPosition = 20;
  }

  // Calculer le solde
  const calculateBalance = () => {
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

  const balance = calculateBalance();
  const owes = balance[roommates[0]] > balance[roommates[1]]
    ? { debtor: roommates[0], creditor: roommates[1], amount: balance[roommates[0]] - balance[roommates[1]] }
    : { debtor: roommates[1], creditor: roommates[0], amount: balance[roommates[1]] - balance[roommates[0]] };

  yPosition += 5;

  // Dégradé pour le récap
  for (let i = 0; i < 30; i++) {
    const ratio = i / 30;
    const r = secondaryColor[0] + (accentColor[0] - secondaryColor[0]) * ratio;
    const g = secondaryColor[1] + (accentColor[1] - secondaryColor[1]) * ratio;
    const b = secondaryColor[2] + (accentColor[2] - secondaryColor[2]) * ratio;
    doc.setFillColor(r, g, b);
    doc.rect(14, yPosition + i * 0.8, pageWidth - 28, 0.8, 'F');
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RECAPITULATIF FINAL', pageWidth / 2, yPosition + 8, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${owes.debtor} doit`, pageWidth / 2, yPosition + 14, { align: 'center' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(formatEuro(Math.abs(owes.amount)), pageWidth / 2, yPosition + 20, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`à ${owes.creditor}`, pageWidth / 2, yPosition + 25, { align: 'center' });

  // Footer
  yPosition = pageHeight - 15;
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(`Document genere le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}`,
    pageWidth / 2, yPosition, { align: 'center' });
  doc.text('ColocManager - Gestion simplifiee de colocation',
    pageWidth / 2, yPosition + 4, { align: 'center' });

  // Sauvegarder le PDF
  doc.save(`Colocation-${month}-${year}.pdf`);
};
