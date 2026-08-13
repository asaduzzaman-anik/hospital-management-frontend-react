const ACCESS_KEY = 'hms_access_token'
const REFRESH_KEY = 'hms_refresh_token'

export const storage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setTokens: (access, refresh) => {
    if (access) localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  },
  setAccess: (access) => {
    if (access) localStorage.setItem(ACCESS_KEY, access)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}
