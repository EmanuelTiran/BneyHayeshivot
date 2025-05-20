import PrayerList from '../components/Prayers/PrayerList';
import NewPrayerForm from '../components/Prayers/NewPrayerForm';
import { useState } from 'react';

export default function PrayersPage() {
  const [refresh, setRefresh] = useState(false);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <NewPrayerForm onAdd={() => setRefresh(!refresh)} />
      <PrayerList key={refresh} />
    </div>
  );
}
