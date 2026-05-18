const db = require('../config/db');

// ── Dashboard stats ───────────────────────────────────────────────────────
exports.stats = async (req, res, next) => {
  try {
    const totalsResult = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users)                                        AS total_users,
        (SELECT COUNT(*) FROM campaigns WHERE status = 'verified')         AS active_campaigns,
        (SELECT COUNT(*) FROM campaigns WHERE status = 'pending')          AS pending_campaigns,
        (SELECT COALESCE(SUM(amount), 0) FROM donations
           WHERE payment_status = 'captured')                              AS total_donated,
        (SELECT COUNT(*) FROM donations WHERE payment_status = 'captured') AS total_donations,
        (SELECT COUNT(*) FROM fraud_flags WHERE status = 'open')           AS open_fraud_flags,
        (SELECT COUNT(*) FROM users WHERE role = 'ngo')                    AS ngo_count
    `);
    const totals = totalsResult.rows[0];

    const recentDonationsResult = await db.query(`
      SELECT d.amount, d.created_at, u.name AS donor, c.title AS campaign
        FROM donations d
        JOIN users u     ON u.id = d.donor_id
        JOIN campaigns c ON c.id = d.campaign_id
       WHERE d.payment_status = 'captured'
       ORDER BY d.created_at DESC LIMIT 10
    `);
    const recentDonations = recentDonationsResult.rows;

    const topCampaignsResult = await db.query(`
      SELECT id, title, COALESCE(slug, id::text) AS slug, collected_amount, target_amount, disease
        FROM campaigns WHERE status = 'verified'
       ORDER BY collected_amount DESC LIMIT 5
    `);
    const topCampaigns = topCampaignsResult.rows;

    res.json({ totals, recentDonations, topCampaigns });
  } catch (err) {
    next(err);
  }
};

// ── All users ─────────────────────────────────────────────────────────────
exports.listUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let paramCount = 1;
    const where = [];
    const vals = [];
    
    if (role) { 
      where.push(`role = $${paramCount++}`); 
      vals.push(role); 
    }

    const whereClause = where.length ? ' WHERE ' + where.join(' AND ') : '';
    
    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM users${whereClause}`, 
      vals
    );
    const total = countResult.rows[0].total;

    const rowsResult = await db.query(
      `SELECT id, name, email, role, is_verified, is_active, created_at
         FROM users${whereClause}
        ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...vals, Number(limit), offset]
    );

    res.json({ data: rowsResult.rows, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
};

// ── Toggle user active ────────────────────────────────────────────────────
exports.toggleUser = async (req, res, next) => {
  try {
    await db.query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1', 
      [req.params.id]
    );
    res.json({ message: 'User status toggled' });
  } catch (err) {
    next(err);
  }
};

// ── Fraud flags ───────────────────────────────────────────────────────────
exports.fraudFlags = async (req, res, next) => {
  try {
    const rowsResult = await db.query(`
      SELECT ff.*, c.title AS campaign_title, u.name AS reporter
        FROM fraud_flags ff
        JOIN campaigns c ON c.id = ff.campaign_id
        LEFT JOIN users u ON u.id = ff.reported_by
       WHERE ff.status = 'open'
       ORDER BY ff.created_at DESC
    `);
    res.json(rowsResult.rows);
  } catch (err) {
    next(err);
  }
};

// ── Update fraud flag status ──────────────────────────────────────────────
exports.updateFraudFlag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await db.query(
      'UPDATE fraud_flags SET status = $1 WHERE id = $2',
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Fraud flag not found' });
    }

    res.json({ message: 'Flag updated', status });
  } catch (err) {
    next(err);
  }
};

// ── All campaigns (any status) ────────────────────────────────────────────
exports.allCampaigns = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let paramCount = 1;
    const where = [];
    const vals = [];
    
    if (status) { 
      where.push(`c.status = $${paramCount++}`); 
      vals.push(status); 
    }

    const whereClause = where.length ? ' WHERE ' + where.join(' AND ') : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM campaigns c${whereClause}`, 
      vals
    );
    const total = countResult.rows[0].total;

    const rowsResult = await db.query(
      `SELECT c.id, c.title, c.disease, c.hospital_name, c.target_amount,
              c.collected_amount, c.status, c.urgency_level, c.created_at,
              u.name AS patient_name
         FROM campaigns c JOIN users u ON u.id = c.patient_id
         ${whereClause}
        ORDER BY c.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...vals, Number(limit), offset]
    );

    res.json({ data: rowsResult.rows, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
};
