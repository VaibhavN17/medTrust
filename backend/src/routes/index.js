const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { validate }                = require('../middleware/errorHandler');
const { makeUploader }            = require('../config/s3');

const auth     = require('../controllers/authController');
const campaign = require('../controllers/campaignController');
const donation = require('../controllers/donationController');
const ngo      = require('../controllers/ngoController');
const admin    = require('../controllers/adminController');
const expense  = require('../controllers/expenseController');

const avatarUp    = makeUploader('avatars',   5);
const coverUp     = makeUploader('covers',    8);
const docUp       = makeUploader('documents', 15);
const receiptUp   = makeUploader('receipts',  10);
const confUp      = makeUploader('conf',      10);

// ─── AUTH ──────────────────────────────────────────────────────────────────
router.post('/auth/register', [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('role').optional().isIn(['patient','donor','ngo']),
  validate,
], auth.register);

router.post('/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
], auth.login);

router.get('/auth/me',       authenticate, auth.me);
router.put('/auth/profile',  authenticate, avatarUp.single('avatar'), auth.updateProfile);
router.put('/auth/password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
  validate,
], auth.changePassword);

// ─── CAMPAIGNS ────────────────────────────────────────────────────────────
router.get('/campaigns',      campaign.list);
router.get('/campaigns/mine', authenticate, authorize('patient'), campaign.myCampaigns);
router.get('/campaigns/:id',  campaign.get);

router.post('/campaigns', authenticate, authorize('patient'),
  coverUp.single('cover_image'), [
    body('title').trim().notEmpty(),
    body('disease').trim().notEmpty(),
    body('hospital_name').trim().notEmpty(),
    body('target_amount').isFloat({ min: 100 }),
    body('description').trim().isLength({ min: 50 }),
    validate,
  ], campaign.create
);

router.put('/campaigns/:id', authenticate,
  coverUp.single('cover_image'), campaign.update
);

router.post('/campaigns/:campaign_id/documents', authenticate, authorize('patient', 'admin'),
  docUp.array('documents', 10), campaign.uploadDocuments
);

router.post('/campaigns/:campaign_id/updates', authenticate, authorize('patient', 'ngo', 'admin'),
  docUp.single('image'), [
    body('content').trim().notEmpty(),
    validate,
  ], campaign.postUpdate
);

// ─── DONATIONS ────────────────────────────────────────────────────────────
router.post('/donations/order',  authenticate, authorize('donor'), [
  body('campaign_id').isInt(),
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Minimum donation amount is Rs 1')
    .toFloat(),
  validate,
], donation.createOrder);

router.post('/donations/verify', authenticate, authorize('donor'), [
  body('razorpay_order_id').notEmpty(),
  body('razorpay_payment_id').notEmpty(),
  body('razorpay_signature').notEmpty(),
  validate,
], donation.verifyPayment);

router.get('/donations/mine',                authenticate, authorize('donor'), donation.myDonations);
router.get('/donations/:id/receipt',         authenticate, authorize('donor'), donation.getReceipt);
router.get('/campaigns/:campaign_id/donations', donation.campaignDonations);

// ─── EXPENSES ─────────────────────────────────────────────────────────────
router.get('/campaigns/:campaign_id/expenses', expense.list);
router.post('/campaigns/:campaign_id/expenses', authenticate,
  receiptUp.single('receipt'), [
    body('description').trim().notEmpty(),
    body('expense_type').isIn(['hospital_bill','medicine','surgery','consultation','tests','transport','other']),
    body('amount').isFloat({ min: 0 }),
    body('spent_on').isISO8601(),
    validate,
  ], expense.create
);

// ─── NGO ──────────────────────────────────────────────────────────────────
router.get('/ngo/pending',          authenticate, authorize('ngo','admin'), ngo.pendingCampaigns);
router.post('/ngo/verify/:id',      authenticate, authorize('ngo','admin'), confUp.single('conf'), ngo.verifyCampaign);
router.post('/ngo/reject/:id',      authenticate, authorize('ngo','admin'), [body('reason').notEmpty(), validate], ngo.rejectCampaign);
router.post('/ngo/flag/:campaign_id', authenticate, authorize('ngo','admin'), [body('reason').notEmpty(), validate], ngo.flagFraud);

// ─── ADMIN ────────────────────────────────────────────────────────────────
router.get('/admin/stats',         authenticate, authorize('admin'), admin.stats);
router.get('/admin/users',         authenticate, authorize('admin'), admin.listUsers);
router.put('/admin/users/:id/toggle', authenticate, authorize('admin'), admin.toggleUser);
router.get('/admin/campaigns',     authenticate, authorize('admin'), admin.allCampaigns);
router.get('/admin/fraud-flags',   authenticate, authorize('admin'), admin.fraudFlags);
router.put('/admin/fraud-flags/:id', authenticate, authorize('admin'), [
  body('status').isIn(['open', 'investigating', 'resolved', 'dismissed']),
  validate,
], admin.updateFraudFlag);

module.exports = router;
