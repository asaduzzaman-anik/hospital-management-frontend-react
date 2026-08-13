export function getApiError(error) {
  if (!error.response) {
    return error.message || 'Network error. Please check your connection and try again.'
  }

  const data = error.response.data
  if (!data) return 'Request failed.'

  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.detail)) return data.detail.map(stringifyError).join(' ')
  if (data.non_field_errors) {
    return Array.isArray(data.non_field_errors)
      ? data.non_field_errors.map(stringifyError).join(' ')
      : String(data.non_field_errors)
  }

  if (typeof data === 'object') {
    const parts = Object.entries(data)
      .filter(([key]) => key !== 'detail')
      .map(([key, value]) => `${formatField(key)}: ${stringifyError(value)}`)
    if (parts.length) return parts.join(' ')
  }

  return 'Request failed.'
}

export function getFieldErrors(error) {
  const data = error.response?.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}

  const out = {}
  for (const [key, value] of Object.entries(data)) {
    if (key === 'detail' || key === 'non_field_errors') continue
    out[key] = stringifyError(value)
  }
  return out
}

function stringifyError(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(stringifyError).join(' ')
  if (typeof value === 'object') return Object.values(value).map(stringifyError).join(' ')
  return String(value)
}

function formatField(key) {
  return key.replaceAll('_', ' ')
}
