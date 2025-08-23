import { create } from "zustand"

interface SelectionStore {
	selectedDays: string[] // Format: "weekNumber-dayNumber"
	focusedDay: string | null
	setSelectedDays: (days: string[]) => void
	addSelectedDay: (day: string) => void
	removeSelectedDay: (day: string) => void
	toggleSelectedDay: (day: string) => void
	setFocusedDay: (day: string | null) => void
	clearSelection: () => void
	selectWeek: (weekNumber: number) => void
}

export const useSelectionStore = create<SelectionStore>((set, get) => ({
	selectedDays: [],
	focusedDay: null,
	setSelectedDays: (days) => set({ selectedDays: days }),
	addSelectedDay: (day) => {
		const { selectedDays } = get()
		if (!selectedDays.includes(day)) {
			set({ selectedDays: [...selectedDays, day] })
		}
	},
	removeSelectedDay: (day) => {
		const { selectedDays } = get()
		set({ selectedDays: selectedDays.filter((d) => d !== day) })
	},
	toggleSelectedDay: (day) => {
		const { selectedDays, addSelectedDay, removeSelectedDay } = get()
		if (selectedDays.includes(day)) {
			removeSelectedDay(day)
		} else {
			addSelectedDay(day)
		}
	},
	setFocusedDay: (day) => set({ focusedDay: day }),
	clearSelection: () => set({ selectedDays: [], focusedDay: null }),
	selectWeek: (weekNumber) => {
		// This will be implemented when we have the program data structure
		// For now, it's a placeholder
		console.log(`Select week ${weekNumber} functionality to be implemented`)
	},
}))
