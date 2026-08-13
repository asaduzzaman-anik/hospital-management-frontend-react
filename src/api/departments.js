import client from './client'

export const departmentsApi = {
  list: (params) => client.get('/departments/', { params }),
  get: (id) => client.get(`/departments/${id}/`),
  create: (payload) => client.post('/departments/', payload),
  update: (id, payload) => client.put(`/departments/${id}/`, payload),
  remove: (id) => client.delete(`/departments/${id}/`),
}
