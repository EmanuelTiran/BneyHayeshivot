const express    = require('express');
const router     = express.Router();
const authController = require('../controllers/authController');
const  protect  = require('../middleware/authMiddleware');



router.post('/register', authController.register);
router.post('/login',    authController.login);
router.post('/google',   authController.googleLogin);
router.post('/refresh',  authController.refresh);         // ← חדש
router.post('/logout',   protect, authController.logout); // ← חדש

module.exports = router;