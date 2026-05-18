const db = require('../config/db');

// ── Upload expense receipt ────────────────────────────────────────────────
exports.create = async (req, res, next) => {
  try {
    const { campaign_id } = req.params;
    const { description, expense_type, amount, spent_on } = req.body;
    const receipt_url  = req.file?.location || null;
    const receipt_name = req.file?.originalname || null;

    // Only patient owner or admin can upload expenses
    const campaignResult = await db.query(
      'SELECT patient_id FROM campaigns WHERE id = $1', [campaign_id]
    );
    if (!campaignResult.rows.length) return res.status(404).json({ message: 'Campaign not found' });
    const campaign = campaignResult.rows[0];
    if (campaign.patient_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await db.query(
      `INSERT INTO expenses
         (campaign_id, description, expense_type, amount, receipt_url, receipt_name, spent_on, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [campaign_id, description, expense_type, amount, receipt_url, receipt_name, spent_on, req.user.id]
    );

    res.status(201).json({ message: 'Expense recorded' });
  } catch (err) {
    next(err);
  }
};

// ── List expenses for a campaign ──────────────────────────────────────────
exports.list = async (req, res, next) => {
  try {
    const { campaign_id } = req.params;

    const expensesResult = await db.query(
      `SELECT e.*, u.name AS uploaded_by_name
         FROM expenses e JOIN users u ON u.id = e.uploaded_by
        WHERE e.campaign_id = $1 ORDER BY e.spent_on DESC`,
      [campaign_id]
    );
    const expenses = expensesResult.rows;

    const summaryResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_spent,
              COUNT(*) AS expense_count
         FROM expenses WHERE campaign_id = $1`,
      [campaign_id]
    );
    const summary = summaryResult.rows[0];

    res.json({ expenses, summary });
  } catch (err) {
    next(err);
  }
};
