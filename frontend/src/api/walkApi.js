import client from './axiosClient';

export const walkApi = {
  start: (body) => client.post('/walks/start', body || {}),
  addPoint: (body) => client.post('/walks/point', body),
  end: (body) => client.post('/walks/end', body),
  list: (page = 0, size = 20) => client.get('/walks', { params: { page, size } }),
  get: (id) => client.get(`/walks/${id}`),
  getPoints: (id) => client.get(`/walks/${id}/points`),
};
