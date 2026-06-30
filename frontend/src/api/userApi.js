import client from './axiosClient';

export const userApi = {
  me: () => client.get('/users/me'),
  profile: () => client.get('/users/profile'),
};
