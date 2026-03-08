import type { CampusName } from '@/api/shared/transforms'
import type { AdminRole } from '@/constants/admin-access'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface LoginPayload {
  campus: CampusName | null
  employeeNo: string
  token: string
  userId: number
  role: AdminRole
}

interface AuthStore {
  campus: CampusName | null
  employeeNo: string
  hasHydrated: boolean
  isLoggedIn: boolean
  login: (payload: LoginPayload) => void
  logout: () => void
  role: AdminRole | null
  setHasHydrated: (value: boolean) => void
  token: string
  userId: number | null
}

export const useAuthStore = create<AuthStore>()(
  persist(
    set => ({
      campus: null,
      employeeNo: '',
      hasHydrated: false,
      isLoggedIn: false,
      role: null,
      token: '',
      userId: null,
      setHasHydrated: (value) => {
        set({ hasHydrated: value })
      },
      login: ({ campus, employeeNo, role, token, userId }) => {
        set({
          campus,
          employeeNo,
          hasHydrated: true,
          isLoggedIn: true,
          role,
          token,
          userId,
        })
      },
      logout: () => {
        set({
          campus: null,
          employeeNo: '',
          isLoggedIn: false,
          role: null,
          token: '',
          userId: null,
        })
      },
    }),
    {
      name: 'lost-found-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
