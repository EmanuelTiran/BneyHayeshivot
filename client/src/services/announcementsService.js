import { fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from './api';

export const getAnnouncements = async () => {
  const res = await fetchAnnouncements();
  return res.data; // [{ _id, title, content, date }, ...]
};

export const saveAnnouncement = async (announcement) => {
  if (announcement._id) {
    const res = await updateAnnouncement(announcement._id, announcement);
    return res.data;
  }
  const res = await createAnnouncement(announcement);
  return res.data;
};

export const removeAnnouncement = async (id) => {
  await deleteAnnouncement(id);
};