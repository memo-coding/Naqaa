const express = require('express');
const router = express.Router();
const { getCMS, updateCMS } = require('../controllers/cmsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', getCMS);
router.post('/', protect, admin, updateCMS);

module.exports = router;
