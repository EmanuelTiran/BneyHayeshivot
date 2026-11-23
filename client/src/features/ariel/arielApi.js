import API from '../../services/api';

export async function getArielPublic() {
  return (await API.get('/ariel')).data;
}
export async function getArielBankDetails() {
  return (await API.get('/ariel/bank-details')).data;
}
export async function reportArielPayment(data) {
  return (await API.post('/ariel/reports', data)).data;
}
export async function getArielAdmin() {
  return (await API.get('/ariel/admin')).data;
}
export async function saveArielSettings(data) {
  return (await API.patch('/ariel/admin/settings', data)).data;
}
export async function createArielDonation(data) {
  return (await API.post('/ariel/admin/donations', data)).data;
}
export async function updateArielDonation(id, data) {
  return (await API.patch(`/ariel/admin/donations/${encodeURIComponent(id)}`, data)).data;
}
export async function deleteArielDonation(id, expectedVersion) {
  return (await API.delete(`/ariel/admin/donations/${encodeURIComponent(id)}`, { data: { expectedVersion } })).data;
}
export async function changeArielDonationStatus(id, status) {
  return (await API.patch(`/ariel/admin/donations/${encodeURIComponent(id)}/status`, { status })).data;
}
