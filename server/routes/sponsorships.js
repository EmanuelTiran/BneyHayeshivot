const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/sponsorshipController');
const protect = require('../middleware/authMiddleware');

router.post('/',                      ctrl.create);                    // פורטל — קיים
router.post('/from-commemoration',    ctrl.createFromCommemoration);   // ← הנצחות — חדש
router.get('/',          protect,     ctrl.getAll);
router.patch('/:id/status', protect,  ctrl.updateStatus);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;