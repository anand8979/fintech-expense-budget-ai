import { generatePDFReport, generateCSVExport } from '../services/export.service.js';

export const exportPDF = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }

    await generatePDFReport(req.userId, startDate, endDate, res);
  } catch (error) {
    next(error);
  }
};

export const exportCSV = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }

    await generateCSVExport(req.userId, startDate, endDate, res);
  } catch (error) {
    next(error);
  }
};
