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
    const result = await db.query(
      `SELECT c.id, c.title, c.disease, c.hospital_name, c.hospital_city,
              c.target_amount, c.urgency_level, c.created_at,
              u.name AS patient_name, u.email AS patient_email
         FROM campaigns c
         JOIN users u ON u.id = c.patient_id
        WHERE c.status = 'pending'
        ORDER BY (c.urgency_level = 'critical') DESC, c.created_at ASC`
    );
    res.json(result.rows);
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
      `UPDATE campaigns SET status = 'verified', verified_by = $1, verified_at = NOW() WHERE id = $2`,
      [req.user.id, id]
    );

    // Upsert verification record (PostgreSQL: INSERT ... ON CONFLICT DO UPDATE)
    await runWithNgoVerificationsTable(() =>
      db.query(
        `INSERT INTO ngo_verifications (campaign_id, ngo_user_id, status, notes, hospital_conf_url, verified_at)
         VALUES ($1, $2, 'verified', $3, $4, NOW())
         ON CONFLICT (campaign_id) DO UPDATE SET
           status = 'verified', notes = EXCLUDED.notes,
           hospital_conf_url = EXCLUDED.hospital_conf_url, verified_at = NOW()`,
        [id, req.user.id, notes || null, confUrl]
      )
    );

    // Notify patient
    const campaignResult = await db.query(
      `SELECT c.title, u.email, u.name FROM campaigns c JOIN users u ON u.id = c.patient_id WHERE c.id = $1`, [id]
    );
    if (campaignResult.rows.length) {
      const campaign = campaignResult.rows[0];
      mailer.sendCampaignApproved(campaign.email, campaign.name, campaign.title).catch(console.error);
    }

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
      `UPDATE campaigns SET status = 'rejected', rejection_reason = $1, verified_by = $2 WHERE id = $3`,
      [reason, req.user.id, id]
    );

    await runWithNgoVerificationsTable(() =>
      db.query(
        `INSERT INTO ngo_verifications (campaign_id, ngo_user_id, status, notes, verified_at)
         VALUES ($1, $2, 'rejected', $3, NOW())
         ON CONFLICT (campaign_id) DO UPDATE SET status = 'rejected', notes = EXCLUDED.notes, verified_at = NOW()`,
        [id, req.user.id, reason]
      )
    );

    const campaignResult = await db.query(
      `SELECT c.title, u.email, u.name FROM campaigns c JOIN users u ON u.id = c.patient_id WHERE c.id = $1`, [id]
    );
    if (campaignResult.rows.length) {
      const campaign = campaignResult.rows[0];
      mailer.sendCampaignRejected(campaign.email, campaign.name, campaign.title, reason).catch(console.error);
    }

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
      'INSERT INTO fraud_flags (campaign_id, reported_by, reason) VALUES ($1, $2, $3)',
      [campaign_id, req.user.id, reason]
    );

    // Suspend campaign
    await db.query(
      `UPDATE campaigns SET status = 'suspended' WHERE id = $1`, [campaign_id]
    );

    res.json({ message: 'Campaign flagged and suspended' });
  } catch (err) {
    next(err);
  }
};

// ── Get NGO profile ───────────────────────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, user_id, org_name, registration_no, website, description, logo_url, verified_at
         FROM ngo_profiles
        WHERE user_id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'NGO profile not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// ── Update NGO profile ────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { org_name, registration_no, website, description } = req.body;
    const logo_url = req.file?.location || undefined;

    console.log('[DEBUG updateProfile] req.file:', req.file);
    console.log('[DEBUG updateProfile] logo_url:', logo_url);

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (org_name !== undefined) { updates.push(`org_name = $${paramCount++}`); values.push(org_name); }
    if (registration_no !== undefined) { updates.push(`registration_no = $${paramCount++}`); values.push(registration_no); }
    if (website !== undefined) { updates.push(`website = $${paramCount++}`); values.push(website); }
    if (description !== undefined) { updates.push(`description = $${paramCount++}`); values.push(description); }
    if (logo_url) { updates.push(`logo_url = $${paramCount++}`); values.push(logo_url); }

    if (!updates.length) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    values.push(req.user.id);
    console.log('[DEBUG updateProfile] SQL:', `UPDATE ngo_profiles SET ${updates.join(', ')} WHERE user_id = $${paramCount}`);
    console.log('[DEBUG updateProfile] Values:', values);

    await db.query(
      `UPDATE ngo_profiles SET ${updates.join(', ')} WHERE user_id = $${paramCount}`,
      values
    );

    res.json({ message: 'NGO profile updated' });
  } catch (err) {
    next(err);
  }
};
