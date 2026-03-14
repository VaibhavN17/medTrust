const db     = require('../config/db');
const mailer = require('../utils/mailer');

const ensureNgoVerificationsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ngo_verifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      campaign_id INT NOT NULL UNIQUE,
      ngo_user_id INT NOT NULL,
      status ENUM('pending','verified','rejected') DEFAULT 'pending',
      notes TEXT,
      hospital_conf_url TEXT,
      verified_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY (ngo_user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
};

const runWithNgoVerificationsTable = async (queryFn) => {
  try {
    return await queryFn();
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE') throw err;

    try {
      await ensureNgoVerificationsTable();
    } catch (createErr) {
      createErr.statusCode = 500;
      createErr.message =
        'Missing table ngo_verifications and auto-create failed. Run backend/schema.sql or grant CREATE TABLE permission.';
      throw createErr;
    }

    return queryFn();
  }
};

// ── List pending campaigns for NGO ────────────────────────────────────────
exports.pendingCampaigns = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.title, c.disease, c.hospital_name, c.hospital_city,
              c.target_amount, c.urgency_level, c.created_at,
              u.name AS patient_name, u.email AS patient_email
         FROM campaigns c
         JOIN users u ON u.id = c.patient_id
        WHERE c.status = 'pending'
        ORDER BY c.urgency_level = 'critical' DESC, c.created_at ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// ── Verify (approve) ──────────────────────────────────────────────────────
exports.verifyCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes, hospital_conf_url } = req.body;
    const confUrl = req.file?.location || hospital_conf_url || null;

    await db.query(
      `UPDATE campaigns SET status = 'verified', verified_by = ?, verified_at = NOW() WHERE id = ?`,
      [req.user.id, id]
    );

    // Upsert verification record
    await runWithNgoVerificationsTable(() =>
      db.query(
        `INSERT INTO ngo_verifications (campaign_id, ngo_user_id, status, notes, hospital_conf_url, verified_at)
         VALUES (?, ?, 'verified', ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           status = 'verified', notes = VALUES(notes),
           hospital_conf_url = VALUES(hospital_conf_url), verified_at = NOW()`,
        [id, req.user.id, notes || null, confUrl]
      )
    );

    // Notify patient
    const [[campaign]] = await db.query(
      `SELECT c.title, u.email, u.name FROM campaigns c JOIN users u ON u.id = c.patient_id WHERE c.id = ?`, [id]
    );
    mailer.sendCampaignApproved(campaign.email, campaign.name, campaign.title).catch(console.error);

    res.json({ message: 'Campaign verified and published' });
  } catch (err) {
    next(err);
  }
};

// ── Reject ────────────────────────────────────────────────────────────────
exports.rejectCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) return res.status(400).json({ message: 'Rejection reason required' });

    await db.query(
      `UPDATE campaigns SET status = 'rejected', rejection_reason = ?, verified_by = ? WHERE id = ?`,
      [reason, req.user.id, id]
    );

    await runWithNgoVerificationsTable(() =>
      db.query(
        `INSERT INTO ngo_verifications (campaign_id, ngo_user_id, status, notes, verified_at)
         VALUES (?, ?, 'rejected', ?, NOW())
         ON DUPLICATE KEY UPDATE status = 'rejected', notes = VALUES(notes), verified_at = NOW()`,
        [id, req.user.id, reason]
      )
    );

    const [[campaign]] = await db.query(
      `SELECT c.title, u.email, u.name FROM campaigns c JOIN users u ON u.id = c.patient_id WHERE c.id = ?`, [id]
    );
    mailer.sendCampaignRejected(campaign.email, campaign.name, campaign.title, reason).catch(console.error);

    res.json({ message: 'Campaign rejected' });
  } catch (err) {
    next(err);
  }
};

// ── Flag fraud ────────────────────────────────────────────────────────────
exports.flagFraud = async (req, res, next) => {
  try {
    const { campaign_id } = req.params;
    const { reason } = req.body;

    await db.query(
      'INSERT INTO fraud_flags (campaign_id, reported_by, reason) VALUES (?, ?, ?)',
      [campaign_id, req.user.id, reason]
    );

    // Suspend campaign
    await db.query(
      `UPDATE campaigns SET status = 'suspended' WHERE id = ?`, [campaign_id]
    );

    res.json({ message: 'Campaign flagged and suspended' });
  } catch (err) {
    next(err);
  }
};
