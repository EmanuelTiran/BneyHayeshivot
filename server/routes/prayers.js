const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/prayerController');

// בדוק ב-middleware/authMiddleware.js איך ייצאת את protect. 
// אם ייצאת אותו כ-module.exports = protect, אז תוריד את הסוגריים המסולסלים.
const  protect  = require('../middleware/authMiddleware'); 

// שליפת תפילות - פתוח לכולם
router.get('/', ctrl.getPrayers);
console.log("Checking protect middleware:", protect);
console.log("Checking controller function:", ctrl.replacePrayers);
// עדכון כל התפילות - דורש הגנה (Token/Admin)
router.put('/', protect, ctrl.replacePrayers);

// יצירת תפילה בודדת (אופציונלי)
router.post('/', protect, ctrl.create);

module.exports = router;