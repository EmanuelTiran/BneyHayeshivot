import { fetchPrayers, updatePrayers } from './api';

export const getPrayers = async () => {
  const res = await fetchPrayers();
  return res.data; // [{_id, title, time}, ...]
};

// Send the full edited list back to the server
export const savePrayers = async (prayers) => {
  const res = await updatePrayers(prayers);
  return res.data;
};