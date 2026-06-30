import client from './axiosClient';

export const leaderboardApi = {
  get: (page = 0, size = 50) => client.get('/leaderboard', { params: { page, size } }),
};
