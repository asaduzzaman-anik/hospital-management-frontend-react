import client from './client'

export const prescriptionsApi = {
  list: (params) => client.get('/prescriptions/', { params }),
  get: (id) => client.get(`/prescriptions/${id}/`),
  create: (payload) => client.post('/prescriptions/', payload),
  update: (id, payload) => client.put(`/prescriptions/${id}/`, payload),
  remove: (id) => client.delete(`/prescriptions/${id}/`),
}
