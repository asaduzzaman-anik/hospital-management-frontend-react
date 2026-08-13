import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../api/auth'
import { usersApi } from '../api/users'
import { patientsApi } from '../api/patients'
import { doctorsApi } from '../api/doctors'
import { fetchAllPages } from '../api/client'
import { decodeJwt } from '../utils/jwt'
import { storage } from '../utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [patientProfile, setPatientProfile] = useState(null)
  const [doctorProfile, setDoctorProfile] = useState(null)
  const [ready, setReady] = useState(false)

  const loadRelatedProfiles = useCallback(async (account) => {
    if (!account) {
      setPatientProfile(null)
      setDoctorProfile(null)
      return
    }

    if (account.role === 'patient') {
      const patients = await fetchAllPages(patientsApi.list)
      setPatientProfile(
        patients.find((item) => item.user === account.id || item.user_detail?.id === account.id) || null,
      )
      setDoctorProfile(null)
      return
    }

    if (account.role === 'doctor') {
      const doctors = await fetchAllPages(doctorsApi.list)
      setDoctorProfile(
        doctors.find((item) => item.user === account.id || item.user_detail?.id === account.id) || null,
      )
      setPatientProfile(null)
      return
    }

    setPatientProfile(null)
    setDoctorProfile(null)
  }, [])

  const bootstrap = useCallback(async () => {
    const access = storage.getAccess()
    if (!access) {
      setUser(null)
      setPatientProfile(null)
      setDoctorProfile(null)
      setReady(true)
      return
    }

    try {
      const payload = decodeJwt(access)
      if (!payload?.user_id) throw new Error('Invalid token')
      const account = await usersApi.getById(payload.user_id)
      setUser(account)
      await loadRelatedProfiles(account)
    } catch {
      storage.clear()
      setUser(null)
      setPatientProfile(null)
      setDoctorProfile(null)
    } finally {
      setReady(true)
    }
  }, [loadRelatedProfiles])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const login = useCallback(async (credentials) => {
    const tokens = await authApi.login(credentials)
    storage.setTokens(tokens.access, tokens.refresh)
    const payload = decodeJwt(tokens.access)
    const account = await usersApi.getById(payload.user_id)
    setUser(account)
    await loadRelatedProfiles(account)
    return account
  }, [loadRelatedProfiles])

  const register = useCallback(async (payload) => {
    const created = await usersApi.register({ ...payload, role: 'patient' })
    await login({ username: payload.username, password: payload.password })
    return created
  }, [login])

  const logout = useCallback(() => {
    storage.clear()
    setUser(null)
    setPatientProfile(null)
    setDoctorProfile(null)
  }, [])

  const refreshProfiles = useCallback(async () => {
    if (user) await loadRelatedProfiles(user)
  }, [loadRelatedProfiles, user])

  const value = useMemo(
    () => ({
      user,
      ready,
      patientProfile,
      doctorProfile,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshProfiles,
      setPatientProfile,
    }),
    [user, ready, patientProfile, doctorProfile, login, register, logout, refreshProfiles],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
