const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentController');
const protect = require('../middleware/authMiddleware');

// ── משתמש מחובר: הנתונים שלו ─────────────────────────────────────────────────
router.get('/me',                     protect, ctrl.getMyPayments);
router.post('/me/debts',              protect, ctrl.addDebt);
router.patch('/me/debts/:debtId',     protect, ctrl.markDebtPaid);
router.post('/me/standing-order',     protect, ctrl.setStandingOrder);
router.delete('/me/standing-order',   protect, ctrl.cancelStandingOrder);
router.post('/me/donations',          protect, ctrl.addDonation);

// ── אדמין: ניהול כלל המשתמשים ────────────────────────────────────────────────
router.get('/',                                    protect, ctrl.getAllPayments);
router.get('/:userId',                             protect, ctrl.getUserPayments);
router.post('/:userId/debts',                      protect, ctrl.addDebt);
router.patch('/:userId/debts/:debtId',             protect, ctrl.markDebtPaid);
router.delete('/:userId/debts/:debtId',            protect, ctrl.deleteDebt);
router.post('/:userId/standing-order',             protect, ctrl.setStandingOrder);
router.delete('/:userId/standing-order',           protect, ctrl.cancelStandingOrder);
router.post('/:userId/donations',                  protect, ctrl.addDonation);
router.delete('/:userId/donations/:donationId',    protect, ctrl.deleteDonation);
router.patch('/:userId/notes',                     protect, ctrl.updateNotes);

module.exports = router;