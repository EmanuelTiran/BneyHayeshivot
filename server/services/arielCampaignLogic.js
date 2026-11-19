'use strict';

const DEFAULT_GOAL = 15000;
const DEFAULT_EXTENDED_GOAL = 20000;
const METHODS = Object.freeze(['bit', 'bank']);

function validAmount(amount) {
  return Number.isSafeInteger(amount) && amount > 0 && amount <= 1000000;
}

function cleanText(value, max = 200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function paymentMethod(method) {
  return METHODS.includes(method) ? method : null;
}

function statsFromDonations(donations, config = {}) {
  const confirmed = donations.filter((d) => d.status === 'confirmed');
  const amount = confirmed.reduce((sum, d) => sum + d.amount, 0);
  const goal = amount > (config.initialGoal || DEFAULT_GOAL)
    ? (config.extendedGoal || DEFAULT_EXTENDED_GOAL)
    : (config.initialGoal || DEFAULT_GOAL);
  return {
    total: amount,
    count: confirmed.length,
    goal,
    initialGoal: config.initialGoal || DEFAULT_GOAL,
    extendedGoal: config.extendedGoal || DEFAULT_EXTENDED_GOAL,
    goalExtended: amount > (config.initialGoal || DEFAULT_GOAL),
    remaining: Math.max(0, goal - amount),
    progress: goal > 0 ? Math.round((amount / goal) * 1000) / 10 : 0,
  };
}

function publicRecent(donations) {
  return donations
    .filter((d) => d.status === 'confirmed')
    .sort((a, b) => new Date(b.confirmedAt || b.createdAt) - new Date(a.confirmedAt || a.createdAt))
    .map((d) => ({
      id: String(d._id || d.id),
      amount: d.amount,
      name: d.displayName === true && d.donorName ? d.donorName : null,
      confirmedAt: d.confirmedAt || d.createdAt,
    }));
}

function isSafePaymentUrl(value) {
  if (value === '') return true;
  if (typeof value !== 'string') return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password;
  } catch { return false; }
}

module.exports = {
  DEFAULT_GOAL, DEFAULT_EXTENDED_GOAL, METHODS,
  validAmount, cleanText, paymentMethod,
  statsFromDonations, publicRecent, isSafePaymentUrl,
};
