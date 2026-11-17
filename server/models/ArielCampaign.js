'use strict';
const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'ariel', immutable: true },
  published: { type: Boolean, default: false },
  title: { type: String, default: 'משפחה אחת, לב אחד' },
  subtitle: { type: String, default: 'מתגייסים יחד לסייע בהשלמת הבית' },
  storyShort: { type: String, default: 'יוזמה משפחתית לסיוע בהשלמת בית ובהוצאות הנלוות.' },
  storyFull: { type: String, default: 'נשמח להשתתפותכם, איש כפי יכולתו. התשלומים מועברים למארגן הגיוס לשם מימון מטרות הקמפיין.' },
  beneficiaryName: { type: String, default: '' },
  showBeneficiaryName: { type: Boolean, default: false },
  showPersonalStory: { type: Boolean, default: false },
  organizerName: { type: String, default: '' },
  initialGoal: { type: Number, default: 15000 },
  extendedGoal: { type: Number, default: 20000 },
  extendedPurpose: { type: String, default: '' },
  privacyNotice: { type: String, default: '' },
  deadlineAt: { type: Date, default: null },
  allowReports: { type: Boolean, default: true },
  bitPhone: { type: String, default: '' },
  bitLink: { type: String, default: '' },
  bankName: { type: String, default: '' },
  bankBranch: { type: String, default: '' },
  bankAccount: { type: String, default: '' },
  bankHolder: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ArielCampaign', campaignSchema);
