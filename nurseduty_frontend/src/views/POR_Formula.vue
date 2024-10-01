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
                <tr v-for="(schedule, index) in computedSchedule" :key="index">
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
        <button @click="toggleSave" class="save-button" :disabled="isLoading">
            {{ isSaved ? '解除儲存' : '儲存' }}
        </button>
        <button @click="resetSchedule" class="reset-button" :disabled="isLoading">清空</button>
        <p v-if="error" class="error-message">{{ error }}</p>
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
        const isLoading = ref(false)
        const error = ref(null)
        const isSaved = ref(false)

        const groupCount = computed(() => store.getters['settings/porGroupCount'])
        const nurses = computed(() => store.getters['staff/activeNurses'].filter(nurse => nurse.role === 'POR'))
        const currentSchedule = computed(() => store.getters['schedule/getFormulaSchedule']('por') || { type: 'por', formula_data: [] })

        const initializeSchedules = () => {
            const newSchedule = Array(groupCount.value).fill(null).map(() => ({
                shifts: Array(7).fill('O'),
                nurses: []
            }))
            store.dispatch('schedule/updateFormulaSchedule', { type: 'por', formula_data: newSchedule })
        }

        const toggleShift = (scheduleIndex, dayIndex) => {
            if (!isSaved.value) {
                const newSchedule = JSON.parse(JSON.stringify(currentSchedule.value.formula_data))
                const currentShift = newSchedule[scheduleIndex].shifts[dayIndex]
                const nextShiftIndex = (shiftTypes.indexOf(currentShift) + 1) % shiftTypes.length
                newSchedule[scheduleIndex].shifts[dayIndex] = shiftTypes[nextShiftIndex]
                store.dispatch('schedule/updateFormulaSchedule', { type: 'por', formula_data: newSchedule })
            }
        }

        const calculateWorkHours = (shifts) => {
            const hourMapping = { 'A': 8, 'K': 8, 'C': 8, 'F': 8, 'O': 0 }
            return shifts.reduce((total, shift) => total + hourMapping[shift], 0)
        }

        const getDayName = (day) => dayNames[day - 1]

        const computedSchedule = computed(() => {
            const count = groupCount.value || 0;
            const baseSchedule = currentSchedule.value.formula_data || [];
            const newSchedule = [...baseSchedule];

            // 調整數組長度以匹配 groupCount
            while (newSchedule.length < count) {
                newSchedule.push({ shifts: Array(7).fill('O'), nurses: [] });
            }
            if (newSchedule.length > count) {
                newSchedule.length = count;
            }

            return newSchedule;
        });

        const toggleSave = async () => {
            try {
                isLoading.value = true
                error.value = null

                if (!isSaved.value) {
                    const formulaData = currentSchedule.value.formula_data.map((schedule, index) => ({
                        shifts: schedule.shifts,
                        nurses: nurses.value
                            .filter(nurse => nurse.group === index + 1 && nurse.active && nurse.role === 'POR')
                            .map(nurse => nurse.id)
                    }))

                    await store.dispatch('schedule/updateFormulaSchedule', {
                        type: 'por',
                        formula_data: formulaData
                    })

                    await store.dispatch('schedule/saveFullSchedule')
                    isSaved.value = true
                } else {
                    isSaved.value = false
                }
            } catch (err) {
                console.error('Error in toggleSave:', err)
                error.value = '保存失敗：' + (err.response?.data?.detail || err.message)
                isSaved.value = false
            } finally {
                isLoading.value = false
            }
        }

        const getNurseNames = (groupNumber) => {
            return nurses.value
                .filter(nurse => nurse.group === groupNumber)
                .map(nurse => nurse.name)
                .join(', ')
        }

        const resetSchedule = async () => {
            if (confirm('確定要清空所有POR排班嗎？')) {
                try {
                    isLoading.value = true
                    await store.dispatch('staff/resetGroups')
                    initializeSchedules()
                    isSaved.value = false
                } catch (err) {
                    console.error('Error in resetSchedule:', err)
                    error.value = '重置失敗：' + (err.response?.data?.detail || err.message)
                } finally {
                    isLoading.value = false
                }
            }
        }

        onMounted(async () => {
            try {
                isLoading.value = true
                await store.dispatch('staff/fetchNurses')
                await store.dispatch('schedule/loadFormulaSchedules')
                if (currentSchedule.value.formula_data.length === 0) {
                    initializeSchedules()
                } else {
                    isSaved.value = true
                }
            } catch (err) {
                console.error('Error loading data:', err)
                error.value = '載入數據失敗：' + (err.response?.data?.detail || err.message)
            } finally {
                isLoading.value = false
            }
        })

        watch(groupCount, (newCount, oldCount) => {
            if (oldCount && newCount !== oldCount) {
                store.dispatch('schedule/updateFormulaSchedule', {
                    type: 'por',
                    formula_data: computedSchedule.value
                });
                isSaved.value = false;
            }
        });

        return {
            computedSchedule,
            currentSchedule,
            toggleShift,
            calculateWorkHours,
            getDayName,
            isSaved,
            toggleSave,
            getNurseNames,
            groupCount,
            resetSchedule,
            isLoading,
            error
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