import client from './client'

export const billsApi = {
  list: (params) => client.get('/bills/', { params }),
  get: (id) => client.get(`/bills/${id}/`),
  create: (payload) => client.post('/bills/', payload),
  update: (id, payload) => client.patch(`/bills/${id}/`, payload),
  remove: (id) => client.delete(`/bills/${id}/`),
  markAsPaid: (id) => client.patch(`/bills/${id}/mark_as_paid/`),
}
