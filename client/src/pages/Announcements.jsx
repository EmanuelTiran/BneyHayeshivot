import AnnouncementList from '../components/Announcements/AnnouncementList';
import NewAnnouncementForm from '../components/Announcements/NewAnnouncementForm';
import { useState } from 'react';

export default function AnnouncementsPage() {
  const [listChanged, setListChanged] = useState(false);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <NewAnnouncementForm onAdd={() => setListChanged(!listChanged)} />
      <AnnouncementList key={listChanged} />
    </div>
  );
}
