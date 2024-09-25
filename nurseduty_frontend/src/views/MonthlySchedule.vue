<template>
  <div class="monthly-schedule">
    <h1>{{ formattedDate }}工作表</h1>
    <DatePicker v-model:value="selectedDate" type="month" :clearable="false" />
    <button @click="generateMonthlySchedule" class="generate-button" :disabled="!isDataReady">生成月班表</button>
    <button @click="submitSchedule" class="submit-button" :disabled="!monthlySchedule.length">提交班表</button>
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="isLoading" class="loading-message">加載中...</div>
    <table v-if="monthlySchedule.length">
      <thead>
        <tr>
          <th>姓名</th>
          <th v-for="day in daysInMonth" :key="day">
            {{ day }}
            <br>
            {{ getDayName(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day).getDay()) }}
          </th>
          <th>D</th>
          <th>V</th>
          <th>H</th>
          <th>總時數</th>
          <th>積借休</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(nurse, nurseIndex) in monthlySchedule" :key="nurse.name">
          <td>{{ nurse.name }}</td>
          <td v-for="(shift, shiftIndex) in nurse.shifts" :key="shiftIndex" @click="toggleShift(nurseIndex, shiftIndex)"
            :class="getShiftClass(shift)">
            {{ shift }}
          </td>
          <td>{{ countShifts(nurse.shifts, 'D') }}</td>
          <td>{{ countShifts(nurse.shifts, 'V') }}</td>
          <td>{{ countShifts(nurse.shifts, 'H') }}</td>
          <td>{{ calculateTotalHours(nurse.shifts) }}</td>
          <td>{{ countShifts(nurse.shifts, '積借休') }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr v-for="shiftType in ['A', 'E', 'N', 'D']" :key="shiftType">
          <td>{{ shiftType }}</td>
          <td v-for="day in daysInMonth" :key="day">{{ countDailyShifts(day, shiftType) }}</td>
          <td colspan="3"></td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import DatePicker from 'vue-datepicker-next'
import 'vue-datepicker-next/index.css'

export default {
  name: 'MonthlySchedule',
  components: { DatePicker },
  setup() {
    const store = useStore()
    const selectedDate = ref(new Date())
    const monthlySchedule = ref([])
    const error = ref('')
    const isLoading = ref(false)
    const isDataReady = ref(false)

    const dayNames = ['日', '一', '二', '三', '四', '五', '六']
    const daysInMonth = computed(() => new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth() + 1, 0).getDate())

    const formattedDate = computed(() => {
      const year = selectedDate.value.getFullYear()
      const month = selectedDate.value.getMonth() + 1
      return `${year}年${month}月`
    })

    // 保存到 localStorage
    const saveToLocalStorage = () => {
      const scheduleData = {
        date: selectedDate.value.toISOString(),  // 保存為 ISO 日期字符串
        monthlySchedule: monthlySchedule.value,
        timestamp: new Date().toISOString()  // 保存時間戳
      }
      let savedSchedules = JSON.parse(localStorage.getItem('monthlySchedules') || '[]')

      // 檢查是否已存在相同月份的班表
      const existingIndex = savedSchedules.findIndex(s => {
        const savedDate = new Date(s.date)  // 將字符串轉換為 Date 對象
        return savedDate.getFullYear() === selectedDate.value.getFullYear() &&
          savedDate.getMonth() === selectedDate.value.getMonth()
      })

      if (existingIndex !== -1) {
        savedSchedules[existingIndex] = scheduleData
      } else {
        savedSchedules.push(scheduleData)
      }

      localStorage.setItem('monthlySchedules', JSON.stringify(savedSchedules))
    }


    // 生成月班表
    const generateMonthlySchedule = async () => {
      if (!isDataReady.value) {
        error.value = '數據尚未準備就緒，請稍後再試。'
        return
      }

      isLoading.value = true
      error.value = ''

      try {
        const formulaSchedules = store.getters['schedule/getFormulaSchedules']
        const porFormulaSchedules = store.getters['schedule/getPORFormulaSchedules']
        const allNurses = store.getters['staff/allNurses']

        if (!formulaSchedules || formulaSchedules.length === 0 || !porFormulaSchedules || porFormulaSchedules.length === 0) {
          throw new Error('沒有可用的公式班表數據')
        }

        const year = selectedDate.value.getFullYear()
        const month = selectedDate.value.getMonth()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const firstDayOfMonth = new Date(year, month, 1).getDay()

        monthlySchedule.value = allNurses.map(nurse => {
          const shifts = []
          for (let i = 0; i < daysInMonth; i++) {
            const dayOfWeek = (firstDayOfMonth + i) % 7
            const weekNumber = Math.floor(i / 7)

            if (nurse.role === 'member' && nurse.group !== 0) {
              const rotatedIndex = (nurse.group - 1 + weekNumber) % formulaSchedules.length
              const formula = formulaSchedules[rotatedIndex]
              if (formula && formula.shifts && formula.shifts[dayOfWeek] !== undefined) {
                shifts.push(formula.shifts[dayOfWeek])
              } else {
                shifts.push('O')
              }
            } else if (nurse.role === 'POR' && nurse.group !== 0) {
              const rotatedIndex = (nurse.group - 1 + weekNumber) % porFormulaSchedules.length
              const formula = porFormulaSchedules[rotatedIndex]
              if (formula && formula.shifts && formula.shifts[dayOfWeek] !== undefined) {
                shifts.push(formula.shifts[dayOfWeek])
              } else {
                shifts.push('O')
              }
            } else {
              shifts.push('O')
            }
          }
          return { name: nurse.name, role: nurse.role, shifts }
        })
        saveToLocalStorage()
      } catch (e) {
        console.error('生成月班表時發生錯誤:', e)
        error.value = e.message || '生成月班表時發生錯誤'
      } finally {
        isLoading.value = false
         // 保存生成的班表到 localStorage
      }
    }

    // 提交班表，並保存到 localStorage
    const submitSchedule = () => {
      if (monthlySchedule.value.length === 0) {
        error.value = '沒有可提交的班表數據'
        return
      }
      saveToLocalStorage()
    }

    // 切換班次，並保存到 localStorage
    const toggleShift = (nurseIndex, shiftIndex) => {
      const currentShift = monthlySchedule.value[nurseIndex].shifts[shiftIndex]
      const shiftTypes = ['D', 'A', 'N', 'O', 'K', 'C', 'F', 'E']
      const nextShiftIndex = (shiftTypes.indexOf(currentShift) + 1) % shiftTypes.length
      monthlySchedule.value[nurseIndex].shifts[shiftIndex] = shiftTypes[nextShiftIndex]
      saveToLocalStorage()  // 編輯後即時保存到 localStorage
    }

    // 獲取班次的樣式
    const getShiftClass = (shift) => {
      return {
        'shift-d': shift === 'D',
        'shift-a': shift === 'A',
        'shift-n': shift === 'N',
        'shift-k': shift === 'K',
        'shift-c': shift === 'C',
        'shift-f': shift === 'F',
        'shift-e': shift === 'E',
        'shift-o': shift === 'O'
      }
    }

    // 轉換星期的顯示名稱
    const getDayName = (day) => dayNames[day]

    // 計算每個護理人員的特定班次總數
    const countShifts = (shifts, type) => shifts.filter(shift => shift === type).length

    // 計算每位護理人員的總時數
    const calculateTotalHours = (shifts) => {
      const hourMapping = { 'D': 8, 'A': 8, 'N': 10, 'O': 0 , 'K': 8, 'C': 8, 'F': 8, 'E': 4}
      return shifts.reduce((total, shift) => total + (hourMapping[shift] || 0), 0)
    }

    // 計算每天的班次總數
    const countDailyShifts = (day, type) => {
      return monthlySchedule.value.filter(nurse => nurse.shifts[day - 1] === type).length
    }

    // 從 localStorage 加載班表
    const loadFromLocalStorage = () => {
      const savedSchedules = JSON.parse(localStorage.getItem('monthlySchedules') || '[]')
      const existingSchedule = savedSchedules.find(s => {
        const savedDate = new Date(s.date)  // 將字符串轉換為 Date 對象
        return savedDate.getFullYear() === selectedDate.value.getFullYear() &&
          savedDate.getMonth() === selectedDate.value.getMonth()
      })

      if (existingSchedule) {
        monthlySchedule.value = existingSchedule.monthlySchedule
        error.value = '' // 清除錯誤信息
      } else {
        monthlySchedule.value = [] // 如果沒有找到對應的班表，清空班表
        error.value = '該月份暫無班表'
      }
    }

    // 組件掛載時從 localStorage 加載數據
    onMounted(async () => {
      try {
        await store.dispatch('schedule/fetchFormulaSchedules')
        await store.dispatch('schedule/fetchPORFormulaSchedules')
        await store.dispatch('staff/initializeNurses')
        loadFromLocalStorage()
        isDataReady.value = true
      } catch (e) {
        console.error('初始化數據時發生錯誤:', e)
        error.value = '載入數據失敗，請刷新頁面重試'
      }
    })

    // 監聽日期變化，當日期變化時重新加載對應月份的班表
    watch(selectedDate, () => {
      loadFromLocalStorage()
    })

    return {
      selectedDate,
      monthlySchedule,
      daysInMonth,
      formattedDate,
      error,
      isLoading,
      isDataReady,
      generateMonthlySchedule,
      submitSchedule,
      toggleShift,
      getShiftClass,
      getDayName,
      countShifts,
      calculateTotalHours,
      countDailyShifts
    }
  }
}
</script>

<style scoped>
.monthly-schedule {
  padding: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  font-size: 12px;
}

th,
td {
  border: 1px solid #ddd;
  padding: 4px;
  text-align: center;
}

th {
  background-color: #f2f2f2;
}

.shift-d {
  background-color: #FFCCCB;
}

.shift-a {
  background-color: #FFFFCC;
}

.shift-n {
  background-color: #E6E6FA;
}

.shift-o {
  background-color: #E0FFFF;
}

.shift-k {
  background-color: #8AA6C1;
}

.shift-c {
  background-color: #FFD700;
}

.shift-f {
  background-color: #FFA07A;
}

.shift-e {
  background-color: #FFB6C1;
}

.generate-button,
.submit-button {
  margin: 10px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

.generate-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
}

.submit-button {
  background-color: #008CBA;
  color: white;
  border: none;
  border-radius: 4px;
}
</style>