const Razorpay  = require('razorpay');
const crypto    = require('crypto');
const db        = require('../config/db');
const mailer    = require('../utils/mailer');

let razorpayClient = null;

const getRazorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const err = new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env');
    err.statusCode = 500;
    throw err;
  }

  return { keyId, keySecret };
};

const getRazorpayClient = () => {
  const { keyId, keySecret } = getRazorpayConfig();

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayClient;
};

// ── Create Razorpay order ─────────────────────────────────────────────────
exports.createOrder = async (req, res, next) => {
  try {
    const { keyId } = getRazorpayConfig();
    const razorpay = getRazorpayClient();
    const { campaign_id, amount, is_anonymous = false, message } = req.body;

    // Validate campaign exists and is verified
    const [[campaign]] = await db.query(
      `SELECT id, title, collected_amount, target_amount, status
         FROM campaigns WHERE id = ?`, [campaign_id]
    );
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (campaign.status !== 'verified') {
      return res.status(400).json({ message: 'Campaign is not accepting donations' });
    }

    const amountPaise = Math.round(Number(amount) * 100); // Razorpay uses paise

    const order = await razorpay.orders.create({
      amount:   amountPaise,
      currency: 'INR',
      receipt:  `campaign_${campaign_id}_${Date.now()}`,
      notes:    { campaign_id: String(campaign_id), donor_id: String(req.user.id) },
    });

    // Store pending donation
    await db.query(
      `INSERT INTO donations
         (donor_id, campaign_id, amount, currency, razorpay_order_id, is_anonymous, message)
       VALUES (?, ?, ?, 'INR', ?, ?, ?)`,
      [req.user.id, campaign_id, amount, order.id, is_anonymous, message || null]
    );

    res.json({
      order_id:   order.id,
      amount:     amountPaise,
      currency:   'INR',
      key_id:     keyId,
      campaign:   { id: campaign.id, title: campaign.title },
    });
  } catch (err) {
    next(err);
  }
};

// ── Verify payment & capture ──────────────────────────────────────────────
exports.verifyPayment = async (req, res, next) => {
  try {
    const { keySecret } = getRazorpayConfig();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const [[donation]] = await db.query(
      `SELECT id, donor_id, campaign_id, amount, payment_status, razorpay_payment_id
         FROM donations WHERE razorpay_order_id = ?`,
      [razorpay_order_id]
    );

    if (!donation) {
      return res.status(404).json({ message: 'Donation record not found' });
    }

    if (donation.donor_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (donation.payment_status === 'captured') {
      return res.json({
        message: 'Payment already verified',
        payment_id: donation.razorpay_payment_id,
        already_verified: true,
      });
    }

    // HMAC verification
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Mark donation captured
    const [result] = await db.query(
      `UPDATE donations
          SET payment_status = 'captured',
              razorpay_payment_id = ?,
              razorpay_signature  = ?
        WHERE id = ? AND donor_id = ? AND payment_status = 'pending'`,
      [razorpay_payment_id, razorpay_signature, donation.id, req.user.id]
    );

    if (!result.affectedRows) {
      const [[latest]] = await db.query(
        'SELECT payment_status, razorpay_payment_id FROM donations WHERE id = ?',
        [donation.id]
      );
      if (latest?.payment_status === 'captured') {
        return res.json({
          message: 'Payment already verified',
          payment_id: latest.razorpay_payment_id,
          already_verified: true,
        });
      }
      return res.status(409).json({ message: 'Payment state changed, please retry' });
    }

    // Update campaign collected amount
    await db.query(
      'UPDATE campaigns SET collected_amount = collected_amount + ? WHERE id = ?',
      [donation.amount, donation.campaign_id]
    );

    // Send receipt email (non-blocking)
    const [[donor]]    = await db.query('SELECT name, email FROM users WHERE id = ?', [donation.donor_id]);
    const [[campaign]] = await db.query('SELECT title FROM campaigns WHERE id = ?', [donation.campaign_id]);
    mailer.sendDonationReceipt(donor.email, donor.name, donation.amount, campaign.title).catch(console.error);

    res.json({ message: 'Payment verified', payment_id: razorpay_payment_id });
  } catch (err) {
    next(err);
  }
};

// ── Donor: my donations ───────────────────────────────────────────────────
exports.myDonations = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT d.id, d.amount, d.payment_status, d.created_at,
              c.id AS campaign_id,
              c.title AS campaign_title,
              COALESCE(c.slug, CAST(c.id AS CHAR)) AS campaign_slug,
              c.disease, c.cover_image_url
         FROM donations d
         JOIN campaigns c ON c.id = d.campaign_id
        WHERE d.donor_id = ? AND d.payment_status = 'captured'
        ORDER BY d.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// ── Campaign donation breakdown (public) ──────────────────────────────────
exports.campaignDonations = async (req, res, next) => {
  try {
    const { campaign_id } = req.params;

    const [donations] = await db.query(
      `SELECT d.amount, d.message, d.is_anonymous, d.created_at,
              CASE WHEN d.is_anonymous = 1 THEN 'Anonymous' ELSE u.name END AS donor_name
         FROM donations d
         JOIN users u ON u.id = d.donor_id
        WHERE d.campaign_id = ? AND d.payment_status = 'captured'
        ORDER BY d.created_at DESC`,
      [campaign_id]
    );

    const [[stats]] = await db.query(
      `SELECT COUNT(*) AS count, SUM(amount) AS total
         FROM donations WHERE campaign_id = ? AND payment_status = 'captured'`,
      [campaign_id]
    );

    res.json({ donations, stats });
  } catch (err) {
    next(err);
  }
};
