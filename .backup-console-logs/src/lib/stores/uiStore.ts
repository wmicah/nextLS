import { create } from "zustand"

export interface Toast {
  id: string
  type: "success" | "error" | "info" | "warning"
  title: string
  message: string
}

interface UIStore {
  // Toast notifications
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
  clearToasts: () => void

  // Saving states
  isSaving: boolean
  lastSaved: Date | null
  setSaving: (saving: boolean) => void
  setLastSaved: (date: Date | null) => void

  // Modal states
  showAssignProgramModal: boolean
  showAddExerciseModal: boolean
  showAddWarmupModal: boolean
  setShowAssignProgramModal: (show: boolean) => void
  setShowAddExerciseModal: (show: boolean) => void
  setShowAddWarmupModal: (show: boolean) => void

  // Loading states
  isLoading: boolean
  setLoading: (loading: boolean) => void
}

export const useUIStore = create<UIStore>((set, get) => ({
  // Toast notifications
  toasts: [],
  addToast: (toast) => {
    // Generate a more unique ID to prevent duplicates
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    const id = `toast-${timestamp}-${random}`
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      get().removeToast(id)
    }, 5000)
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }))
  },
  clearToasts: () => {
    set({ toasts: [] })
  },

  // Saving states
  isSaving: false,
  lastSaved: null,
  setSaving: (saving) => {
    set({ isSaving: saving })
  },
  setLastSaved: (date) => {
    set({ lastSaved: date })
  },

  // Modal states
  showAssignProgramModal: false,
  showAddExerciseModal: false,
  showAddWarmupModal: false,
  setShowAssignProgramModal: (show) => {
    set({ showAssignProgramModal: show })
  },
  setShowAddExerciseModal: (show) => {
    set({ showAddExerciseModal: show })
  },
  setShowAddWarmupModal: (show) => {
    set({ showAddWarmupModal: show })
  },

  // Loading states
  isLoading: false,
  setLoading: (loading) => {
    set({ isLoading: loading })
  },
}))
