import API from './api';

export async function fetchAnalyticsReport(
  params,
  options = {}
) {
  const response = await API.get('/analytics/report', {
    params,
    signal: options.signal,
  });

  return response.data;
}

export async function fetchActiveAnalyticsUsers(
  options = {}
) {
  const response = await API.get(
    '/analytics/active-users',
    {
      signal: options.signal,
    }
  );

  return response.data;
}