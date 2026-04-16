const express = require('express');
const router = express.Router();

const ctrl    = require('../controllers/announcementController');
const protect = require('../middleware/authMiddleware');
router.get('/',           ctrl.getAnnouncements);
router.post('/',  protect, ctrl.createAnnouncement);
router.put('/:id', protect, ctrl.updateAnnouncement);
router.delete('/:id', protect, ctrl.deleteAnnouncement);

module.exports = router;