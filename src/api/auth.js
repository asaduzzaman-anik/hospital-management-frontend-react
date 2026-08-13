import client from './client'

export const authApi = {
  login: (payload) => client.post('/auth/login/', payload),
  refresh: (refresh) => client.post('/auth/refresh/', { refresh }),
}
