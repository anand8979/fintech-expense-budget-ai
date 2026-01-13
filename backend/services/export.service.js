import PDFDocument from 'pdfkit';
// Note: pdfkit may require additional setup for ES modules
// If issues occur, consider using: const PDFDocument = require('pdfkit');
import createCsvWriter from 'csv-writer';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { format } from 'date-fns';

export const generatePDFReport = async (userId, startDate, endDate, res) => {
  return new Promise(async (resolve, reject) => {
    try {
      const transactions = await Transaction.find({
        userId,
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
      })
        .populate('category', 'name type icon color')
        .sort({ date: -1 });

      const expenses = transactions.filter((t) => t.type === 'expense');
      const income = transactions.filter((t) => t.type === 'income');

      const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
      const balance = totalIncome - totalExpenses;

      const doc = new PDFDocument({ margin: 50 });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=financial-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      );

      doc.pipe(res);

      // Header
      doc.fontSize(20).text('Financial Report', { align: 'center' });
      doc.moveDown();
      doc
        .fontSize(12)
        .text(
          `Period: ${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`,
          { align: 'center' }
        );
      doc.moveDown(2);

      // Summary
      doc.fontSize(16).text('Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Total Income: $${totalIncome.toFixed(2)}`);
      doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`);
      doc.text(`Balance: $${balance.toFixed(2)}`);
      doc.moveDown(2);

      // Transactions
      doc.fontSize(16).text('Transactions', { underline: true });
      doc.moveDown();

      transactions.forEach((transaction, index) => {
        if (index > 0 && index % 25 === 0) {
          doc.addPage();
        }

        doc.fontSize(10);
        doc.text(
          `${format(new Date(transaction.date), 'MMM dd, yyyy')} - ${transaction.category.name} - $${transaction.amount.toFixed(2)}`,
          { continued: false }
        );
        if (transaction.description) {
          doc.fontSize(8).text(transaction.description, { indent: 20 });
        }
        doc.moveDown(0.5);
      });

      doc.end();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const generateCSVExport = async (userId, startDate, endDate, res) => {
  try {
    const transactions = await Transaction.find({
      userId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    })
      .populate('category', 'name type')
      .sort({ date: -1 });

    const csvWriter = createCsvWriter.createObjectCsvStringifier({
      header: [
        { id: 'date', title: 'Date' },
        { id: 'type', title: 'Type' },
        { id: 'category', title: 'Category' },
        { id: 'amount', title: 'Amount' },
        { id: 'description', title: 'Description' },
        { id: 'paymentMethod', title: 'Payment Method' },
      ],
    });

    const records = transactions.map((t) => ({
      date: format(new Date(t.date), 'yyyy-MM-dd'),
      type: t.type,
      category: t.category.name,
      amount: t.amount.toFixed(2),
      description: t.description || '',
      paymentMethod: t.paymentMethod || '',
    }));

    const csvString = csvWriter.getHeaderString() + csvWriter.stringifyRecords(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`
    );
    res.send(csvString);
  } catch (error) {
    throw error;
  }
};
