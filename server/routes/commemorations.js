const express = require('express');
const router  = express.Router();

const ctrl    = require('../controllers/commemorationController');
const protect = require('../middleware/authMiddleware');

// פתוח לכולם – קריאה
router.get('/',    ctrl.getCommemorations);
router.get('/:id', ctrl.getCommemorationById);

// מוגן – כתיבה / עדכון / מחיקה (מנהל בלבד)
router.post('/',     protect, ctrl.createCommemoration);
router.put('/:id',  protect, ctrl.updateCommemoration);
router.patch('/:id/status', protect, ctrl.updateCommemorationStatus); // ← חדש
router.delete('/:id', protect, ctrl.deleteCommemoration);

module.exports = router;