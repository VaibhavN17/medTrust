const db      = require('../config/db');
const slugify = require('slugify');

// ── List / search campaigns ───────────────────────────────────────────────
exports.list = async (req, res, next) => {
  try {
    const {
      disease, urgency, city, status = 'verified',
      search, page = 1, limit = 12, sort = 'created_at'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const where  = ['c.status = ?'];
    const vals   = [status];

    if (disease) { where.push('c.disease LIKE ?');        vals.push(`%${disease}%`); }
    if (urgency) { where.push('c.urgency_level = ?');     vals.push(urgency); }
    if (city)    { where.push('c.hospital_city LIKE ?');  vals.push(`%${city}%`); }
    if (search)  { where.push('MATCH(c.title, c.disease, c.description, c.hospital_name) AGAINST(? IN BOOLEAN MODE)'); vals.push(`${search}*`); }

    const sortMap = {
      created_at: 'c.created_at DESC',
      urgency:    `FIELD(c.urgency_level,'critical','high','medium','low')`,
      progress:   '(c.collected_amount / c.target_amount) DESC',
      deadline:   'c.treatment_deadline ASC',
    };
    const orderBy = sortMap[sort] || 'c.created_at DESC';

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM campaigns c WHERE ${where.join(' AND ')}`,
      vals
    );

    const [rows] = await db.query(
          `SELECT c.id,
            COALESCE(c.slug, CAST(c.id AS CHAR)) AS slug,
            c.title, c.disease, c.hospital_name, c.hospital_city,
              c.target_amount, c.collected_amount, c.urgency_level, c.status,
              c.cover_image_url, c.treatment_deadline, c.created_at,
              u.name AS patient_name
         FROM campaigns c
         JOIN users u ON u.id = c.patient_id
        WHERE ${where.join(' AND ')}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?`,
      [...vals, Number(limit), offset]
    );

    res.json({
      data:  rows,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};

// ── Get single campaign ───────────────────────────────────────────────────
exports.get = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, u.name AS patient_name
         FROM campaigns c
         JOIN users u ON u.id = c.patient_id
        WHERE c.slug = ? OR c.id = ?`,
      [req.params.id, Number(req.params.id) || 0]
    );
    if (!rows.length) return res.status(404).json({ message: 'Campaign not found' });

    const campaign = rows[0];

    const safeQuery = async (sql, params) => {
      try {
        const [result] = await db.query(sql, params);
        return result;
      } catch (queryErr) {
        // Keep detail page usable even if optional related tables are out of sync.
        console.error('[WARN] Optional campaign detail query failed:', queryErr.message);
        return [];
      }
    };

    // Documents
    const docs = await safeQuery(
      'SELECT * FROM documents WHERE campaign_id = ?', [campaign.id]
    );
    // Updates
    const updates = await safeQuery(
      `SELECT cu.*, u.name AS author_name FROM campaign_updates cu
         JOIN users u ON u.id = cu.author_id
        WHERE cu.campaign_id = ? ORDER BY cu.created_at DESC`,
      [campaign.id]
    );
    // Expenses
    const expenses = await safeQuery(
      'SELECT * FROM expenses WHERE campaign_id = ? ORDER BY spent_on DESC', [campaign.id]
    );
    // Top donors (non-anonymous)
    const donors = await safeQuery(
      `SELECT u.name, d.amount, d.message, d.created_at
         FROM donations d JOIN users u ON u.id = d.donor_id
        WHERE d.campaign_id = ? AND d.payment_status = 'captured' AND d.is_anonymous = 0
        ORDER BY d.amount DESC LIMIT 10`,
      [campaign.id]
    );

    res.json({ ...campaign, documents: docs, updates, expenses, top_donors: donors });
  } catch (err) {
    next(err);
  }
};

// ── Create campaign ───────────────────────────────────────────────────────
exports.create = async (req, res, next) => {
  try {
    const {
      title, disease, description, hospital_name, hospital_city,
      hospital_state, target_amount, treatment_deadline, urgency_level,
    } = req.body;

    const base = slugify(title, { lower: true, strict: true });
    const slug = `${base}-${Date.now()}`;
    const cover_image_url = req.file?.location || null;

    const [r] = await db.query(
      `INSERT INTO campaigns
         (patient_id, title, slug, disease, description, hospital_name, hospital_city,
          hospital_state, target_amount, treatment_deadline, urgency_level, cover_image_url)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.user.id, title, slug, disease, description, hospital_name,
        hospital_city, hospital_state, target_amount,
        treatment_deadline || null, urgency_level || 'medium', cover_image_url,
      ]
    );

    res.status(201).json({ id: r.insertId, slug });
  } catch (err) {
    next(err);
  }
};

// ── Update campaign (patient only) ────────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT patient_id, status FROM campaigns WHERE id = ?', [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    if (rows[0].patient_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (['verified', 'completed'].includes(rows[0].status) && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'Cannot edit a verified campaign' });
    }

    const allowed = [
      'title','disease','description','hospital_name','hospital_city',
      'hospital_state','target_amount','treatment_deadline','urgency_level',
    ];
    const fields = [];
    const vals   = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        vals.push(req.body[key]);
      }
    }
    if (req.file?.location) { fields.push('cover_image_url = ?'); vals.push(req.file.location); }
    if (!fields.length) return res.status(400).json({ message: 'Nothing to update' });

    vals.push(id);
    await db.query(`UPDATE campaigns SET ${fields.join(', ')} WHERE id = ?`, vals);

    res.json({ message: 'Campaign updated' });
  } catch (err) {
    next(err);
  }
};

// ── Upload documents ──────────────────────────────────────────────────────
exports.uploadDocuments = async (req, res, next) => {
  try {
    const { campaign_id } = req.params;
    if (!req.files?.length) return res.status(400).json({ message: 'No files uploaded' });

    const [[campaign]] = await db.query(
      'SELECT id, patient_id, status FROM campaigns WHERE id = ?',
      [campaign_id]
    );
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const isOwner = campaign.patient_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (campaign.status === 'suspended' && !isAdmin) {
      return res.status(400).json({ message: 'Cannot upload documents for a suspended campaign' });
    }

    const allowedDocTypes = new Set([
      'hospital_report',
      'identity_proof',
      'treatment_estimate',
      'prescription',
      'other',
    ]);
    const requestedType = req.body.document_type || 'other';
    if (!allowedDocTypes.has(requestedType)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }

    const rows = req.files.map(f => [
      campaign_id,
      requestedType,
      f.location,
      f.originalname,
      f.size,
      f.mimetype,
    ]);

    await db.query(
      `INSERT INTO documents (campaign_id, document_type, file_url, file_name, file_size, mime_type)
       VALUES ?`, [rows]
    );

    res.json({ message: `${rows.length} document(s) uploaded` });
  } catch (err) {
    next(err);
  }
};

// ── Post update ───────────────────────────────────────────────────────────
exports.postUpdate = async (req, res, next) => {
  try {
    const { campaign_id } = req.params;
    const { title, content } = req.body;
    const image_url = req.file?.location || null;

    const [[campaign]] = await db.query(
      'SELECT id, patient_id, status FROM campaigns WHERE id = ?',
      [campaign_id]
    );
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const isOwner = campaign.patient_id === req.user.id;
    const isNgoOrAdmin = req.user.role === 'ngo' || req.user.role === 'admin';
    if (!isOwner && !isNgoOrAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (['rejected', 'suspended'].includes(campaign.status) && req.user.role !== 'admin') {
      return res.status(400).json({ message: `Cannot post updates for a ${campaign.status} campaign` });
    }

    await db.query(
      'INSERT INTO campaign_updates (campaign_id, author_id, title, content, image_url) VALUES (?,?,?,?,?)',
      [campaign_id, req.user.id, title?.trim() || null, content, image_url]
    );

    res.status(201).json({ message: 'Update posted' });
  } catch (err) {
    next(err);
  }
};

// ── Patient's own campaigns ────────────────────────────────────────────────
exports.myCampaigns = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, slug, title, disease, target_amount, collected_amount,
              status, urgency_level, created_at
         FROM campaigns WHERE patient_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
