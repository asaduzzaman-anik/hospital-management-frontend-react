import client from './client'

export const medicinesApi = {
  list: (params) => client.get('/medicines/', { params }),
  get: (id) => client.get(`/medicines/${id}/`),
  create: (payload) => client.post('/medicines/', payload),
  update: (id, payload) => client.put(`/medicines/${id}/`, payload),
  remove: (id) => client.delete(`/medicines/${id}/`),
}
