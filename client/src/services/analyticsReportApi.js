import API from './api';

export async function fetchAnalyticsReport(
  params,
  options = {}
) {
  const response = await API.get(
    '/analytics/report',
    {
      params,
      signal: options.signal,
    }
  );

  return response.data;
}