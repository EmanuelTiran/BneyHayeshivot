const express = require('express');
const router = express.Router();
const controller = require('../controllers/contactController');
const protect = require('../middleware/authMiddleware');

router.get('/', controller.getAll);
router.post('/', controller.create);
router.patch('/:id/handled', controller.updateHandledStatus);
router.patch('/:id', controller.updateHandledStatus);
router.put('/:id/handled', controller.updateHandledStatus);
router.delete('/:id', protect, controller.remove);

module.exports = router;