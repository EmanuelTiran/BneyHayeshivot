const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/portalItemController');
const protect = require('../middleware/authMiddleware');

router.get('/',                     ctrl.getAll);
router.get('/category/:categoryId', ctrl.getByCategory);
router.get('/:id',                  ctrl.getById);
router.post('/',      protect,      ctrl.create);
router.put('/:id',    protect,      ctrl.update);
router.delete('/:id', protect,      ctrl.remove);

module.exports = router;