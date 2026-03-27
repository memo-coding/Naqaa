const express = require('express');
const router = express.Router();
const { getReviews, createReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.route('/:productId')
  .get(getReviews)
  .post(protect, createReview);

module.exports = router;
