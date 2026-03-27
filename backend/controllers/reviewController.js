const Review = require('../models/Review');

// @desc    Get all reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product_id: req.params.productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new review
// @route   POST /api/reviews/:productId
// @access  Private
const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Check if user has already reviewed the product
    const existingReview = await Review.findOne({ 
      product_id: req.params.productId, 
      user_id: req.user._id 
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const review = new Review({
      product_id: req.params.productId,
      user_id: req.user._id,
      rating: Number(rating),
      comment,
      author_name: req.user.name,
      author_img: req.user.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmbY6KbVHXJIM2xtpUv36K0oSwYuA79IFrF5RRNxVhH0DBio88yS6KynheUec3ClrWr5EwmNP4ooVctPmCeyceCbM7BWvyY0yZzGVbR9vf4eq73yfr9w9-TVWTnWybXr6eNtTkK9A_fccZieogfbgz-LR1UEwA6fUBHAu601jzBSGqRWVoIWiEsQNvxdRb7ZyOUrP5oFbXgW424nF5_5qUTqCsl01du28FJ7EMDti4uY_7o4Pins-lROKMvHxX1ECMtDqVxOZVyuRT'
    });

    const savedReview = await review.save();
    res.status(201).json(savedReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getReviews,
  createReview
};
