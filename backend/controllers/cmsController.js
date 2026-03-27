const CMS = require('../models/CMS');
const { getIO } = require('../utils/socket');

// @desc    Get website CMS configuration
// @route   GET /api/cms
// @access  Public
exports.getCMS = async (req, res) => {
  try {
    const config = await CMS.findOne({ key: 'global_config' });
    if (!config) {
      return res.status(200).json(null);
    }
    res.status(200).json(config.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update website CMS configuration
// @route   POST /api/cms
// @access  Private/Admin
exports.updateCMS = async (req, res) => {
  try {
    const newData = req.body;
    const config = await CMS.findOneAndUpdate(
      { key: 'global_config' },
      { data: newData },
      { upsert: true, new: true }
    );

    // Emit socket event for real-time update
    try {
      getIO().emit('cms_updated', config.data);
    } catch (err) {
      console.error('Socket emit failed:', err.message);
    }

    res.status(200).json(config.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
