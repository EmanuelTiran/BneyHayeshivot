const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/sponsorshipController');
const protect = require('../middleware/authMiddleware');

router.post('/',                ctrl.create);
router.get('/',      protect,   ctrl.getAll);
router.patch('/:id/status', protect, ctrl.updateStatus);

module.exports = router;