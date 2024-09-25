<template>
    <div class="por-formula-schedule">
        <h1>恩主公麻醉護理POR公式排班神器</h1>
        <table>
            <thead>
                <tr>
                    <th>組別</th>
                    <th>護理人員</th>
                    <th v-for="day in 7" :key="day">{{ getDayName(day) }}</th>
                    <th>工時/H</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(schedule, index) in schedules" :key="index">
                    <td>{{ index + 1 }}</td>
                    <td>{{ getNurseNames(index + 1) }}</td>
                    <td v-for="(shift, dayIndex) in schedule.shifts" :key="dayIndex"
                        @click="toggleShift(index, dayIndex)" :data-shift="shift">
                        <span class="shift-letter" :class="{ 'disabled': isSaved }">{{ shift }}</span>
                    </td>
                    <td>{{ calculateWorkHours(schedule.shifts) }}</td>
                </tr>
            </tbody>
        </table>
        <button @click="toggleSave" class="save-button">
            {{ isSaved ? '解除儲存' : '儲存' }}
        </button>
        <button @click="resetSchedule" class="reset-button">清空</button>
    </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
    name: 'POR_Formula',
    setup() {
        const store = useStore()
        const dayNames = ['一', '二', '三', '四', '五', '六', '日']
        const shiftTypes = ['A', 'K', 'C', 'F', 'O']
        const schedules = ref([])
        const isSaved = ref(false)

        const groupCount = computed(() => store.getters['settings/porGroupCount'])        
        const nurses = computed(() => store.state.staff.nurses.filter(nurse => nurse.role === 'POR'))

        const initializeSchedules = () => {
            schedules.value = Array(groupCount.value).fill(null).map(() => ({
                shifts: Array(7).fill('O')
            }))
        }
        
        const toggleShift = (scheduleIndex, dayIndex) => {
            if (!isSaved.value) {
                const currentShift = schedules.value[scheduleIndex].shifts[dayIndex]
                const nextShiftIndex = (shiftTypes.indexOf(currentShift) + 1) % shiftTypes.length
                schedules.value[scheduleIndex].shifts[dayIndex] = shiftTypes[nextShiftIndex]
            }
        }

        const calculateWorkHours = (shifts) => {
            const hourMapping = { 'A': 8, 'K': 8, 'C': 8, 'F': 8, 'O': 0 }
            return shifts.reduce((total, shift) => total + hourMapping[shift], 0)
        }


        const getDayName = (day) => dayNames[day - 1]

        const toggleSave = () => {
            isSaved.value = !isSaved.value
            if (isSaved.value) {
                store.dispatch('schedule/savePORFormulaSchedules', schedules.value)
            }
        }

        const getNurseNames = (groupNumber) => {
            return nurses.value
                .filter(nurse => nurse.group === groupNumber)
                .map(nurse => nurse.name)
                .join(', ')
        }

        const resetSchedule = () => {
            if (confirm('確定要清空所有POR排班嗎？')) {
                initializeSchedules()
                isSaved.value = false
            }
        }

        onMounted(() => {
            store.dispatch('schedule/porFormulaSchedules')
            const savedSchedules = store.getters['schedule/getPORFormulaSchedules']
            if (savedSchedules && savedSchedules.length > 0) {
                schedules.value = savedSchedules
                isSaved.value = true
            } else {
                initializeSchedules()
            }
        })

        watch(groupCount, (newCount, oldCount) => {
            if (oldCount && newCount !== oldCount) {
                const currentCount = schedules.value.length
                if (newCount > currentCount) {
                    const newGroups = Array(newCount - currentCount).fill().map(() => ({
                        shifts: Array(7).fill('O')
                    }))
                    schedules.value = [...schedules.value, ...newGroups]
                } else if (newCount < currentCount) {
                    schedules.value = schedules.value.slice(0, newCount)
                }
                isSaved.value = false
            }
        })

        return {
            schedules,
            toggleShift,
            calculateWorkHours,
            getDayName,
            isSaved,
            toggleSave,
            getNurseNames,
            groupCount,
            resetSchedule
        }
    }
}
</script>

<style scoped>
.por-formula-schedule {
    padding: 20px;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
}

th,
td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
}

th {
    background-color: #f2f2f2;
}

.shift-letter {
    font-size: 24px;
    font-weight: bold;
    cursor: pointer;
}

.shift-letter.disabled {
    cursor: not-allowed;
    opacity: 0.6;
}


td[data-shift="K"] {
    background-color: #8AA6C1;
    color: black;
}


td[data-shift="A"] {
    background-color: #9ABCA7;
    color: black;
}


td[data-shift="C"] {
    background-color: #D7A084;
    color: black;
}


td[data-shift="F"] {
    background-color: #d897d2;
    color: black;
}


td[data-shift="O"] {
    background-color: #eddcd7;
    color: black;
}

.save-button {
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

.save-button:hover {
    background-color: #45a049;
}

.button-group {
    margin-top: 20px;
    display: flex;
    justify-content: flex-start;
    gap: 10px;
}

.reset-button {
    padding: 10px 20px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

.reset-button:hover {
    background-color: #d32f2f;
}
</style>