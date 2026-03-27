const mongoose = require('mongoose');

const cmsSchema = new mongoose.Schema({
  key: { type: String, default: 'global_config', unique: true },
  data: {
    heroTitle_en: String,
    heroTitle_ar: String,
    heroBadge_en: String,
    heroBadge_ar: String,
    heroDesc_en: String,
    heroDesc_ar: String,
    heroCTA1_en: String,
    heroCTA1_ar: String,
    heroCTA2_en: String,
    heroCTA2_ar: String,
    heroImg: String,
    logoUrl: String,
    logoType: { type: String, enum: ['text', 'image'], default: 'text' },
    brandName_en: String,
    brandName_ar: String,
    verdictTitle_en: String,
    verdictTitle_ar: String,
    verdictSubtitle_en: String,
    verdictSubtitle_ar: String,
    featuredBadge_en: String,
    featuredBadge_ar: String,
    featuredTitle_en: String,
    featuredTitle_ar: String,
    featuredDesc_en: String,
    featuredDesc_ar: String,
    featuredProductIds: [String],
    // Newsletter Section
    newsletterTitle_en: String,
    newsletterTitle_ar: String,
    newsletterDesc_en: String,
    newsletterDesc_ar: String,
    newsletterCTA_en: String,
    newsletterCTA_ar: String,
    // Footer Section
    footerHeading_en: String,
    footerHeading_ar: String,
    footerDesc_en: String,
    footerDesc_ar: String,
    footerCopyright_en: String,
    footerCopyright_ar: String,
    // Loyalty Tiers Thresholds
    tierPlatinumThreshold: { type: Number, default: 1000 },
    tierGoldThreshold: { type: Number, default: 500 },
    // Shipping
    shippingFee: { type: Number, default: 15 }
  }
}, { timestamps: true });

module.exports = mongoose.model('CMS', cmsSchema);
