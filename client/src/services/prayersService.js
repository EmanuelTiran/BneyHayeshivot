import { fetchPrayers, updatePrayers } from './api';

export const getPrayers = async () => {
  const res = await fetchPrayers();
  return res.data;
};

export const savePrayers = async (prayers, prayerSectionTitle) => {
  // api.js כבר עוטף נכון — שלח את המערך והכותרת בנפרד
  const res = await updatePrayers(prayers, prayerSectionTitle);
  return res.data;
};