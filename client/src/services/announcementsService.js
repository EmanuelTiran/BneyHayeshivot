import { fetchAnnouncements, createAnnouncement, updateAnnouncement } from './api';

export const getAnnouncements = async () => {
  const res = await fetchAnnouncements();
  return res.data; // [{_id, title, content, date}, ...]
};

export const saveAnnouncement = async (announcement) => {
  if (announcement._id) {
    // Existing — update
    const res = await updateAnnouncement(announcement._id, announcement);
    return res.data;
  }
  // New — create
  const res = await createAnnouncement(announcement);
  return res.data;
};