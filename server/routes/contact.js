const express = require('express');
const router = express.Router();
const controller = require('../controllers/contactController');

router.get('/', controller.getAll);
router.post('/', controller.create);
router.patch('/:id/handled', controller.updateHandledStatus);
router.patch('/:id', controller.updateHandledStatus);
router.put('/:id/handled', controller.updateHandledStatus);

module.exports = router;