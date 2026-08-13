import client from './client'

export const doctorsApi = {
  list: (params) => client.get('/doctors/', { params }),
  available: () => client.get('/doctors/available/'),
  get: (id) => client.get(`/doctors/${id}/`),
  create: (payload) => client.post('/doctors/', payload),
  update: (id, payload) => client.patch(`/doctors/${id}/`, payload),
  remove: (id) => client.delete(`/doctors/${id}/`),
}
