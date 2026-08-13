import client from './client'

export const usersApi = {
  list: (params) => client.get('/users/', { params }),
  getById: (id) => client.get(`/users/${id}/`),
  register: (payload) => client.post('/users/', payload),
  update: (id, payload) => client.patch(`/users/${id}/`, payload),
  remove: (id) => client.delete(`/users/${id}/`),
}
