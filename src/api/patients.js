import client from './client'

export const patientsApi = {
  list: (params) => client.get('/patients/', { params }),
  get: (id) => client.get(`/patients/${id}/`),
  create: (payload) => client.post('/patients/', payload),
  update: (id, payload) => client.patch(`/patients/${id}/`, payload),
  remove: (id) => client.delete(`/patients/${id}/`),
}
