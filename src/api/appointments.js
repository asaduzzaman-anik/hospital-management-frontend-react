import client from './client'

export const appointmentsApi = {
  list: (params) => client.get('/appointments/', { params }),
  get: (id) => client.get(`/appointments/${id}/`),
  create: (payload) => client.post('/appointments/', payload),
  update: (id, payload) => client.patch(`/appointments/${id}/`, payload),
  remove: (id) => client.delete(`/appointments/${id}/`),
  approve: (id) => client.patch(`/appointments/${id}/approve/`),
  complete: (id) => client.patch(`/appointments/${id}/complete/`),
  cancel: (id) => client.patch(`/appointments/${id}/cancel/`),
}
