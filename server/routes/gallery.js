const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/galleryController');
const protect = require('../middleware/authMiddleware');

router.get('/',       ctrl.getImages);
router.post('/',      protect, ctrl.createImage);
router.put('/:id',    protect, ctrl.updateImage);
router.delete('/:id', protect, ctrl.deleteImage);

module.exports = router;