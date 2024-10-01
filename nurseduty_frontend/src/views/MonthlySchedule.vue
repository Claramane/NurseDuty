<template>
  <div class="monthly-schedule" id="avoid-split">
    <h1>{{ formattedDate }}工作表</h1>
    <div class="hide-for-pdf">
      <DatePicker v-model:value="selectedDate" type="month" :clearable="false" />
      <button @click="generateMonthlySchedule" class="generate-button" :disabled="!isDataReady">生成月班表</button>
      <button @click="saveMonthlySchedule" class="save-button" :disabled="!monthlySchedule.length">儲存班表</button>
      <button @click="generatePDF" class="generate-pdf-button">生成 PDF</button>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="isLoading" class="loading-message">加載中...</div>
    </div>
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
          <th>總時數</th>
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
          <td>{{ calculateTotalHours(nurse.shifts) }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr v-for="shiftType in ['A', 'E', 'N', 'D']" :key="shiftType">
          <td>{{ shiftType }}</td>
          <td v-for="day in daysInMonth" :key="day">{{ countDailyShifts(day - 1, shiftType) }}</td>
          <td colspan="2"></td>
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
import html2pdf from 'html2pdf.js'
import axios from 'axios'

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

    const API_URL = process.env.VUE_APP_API_URL
    // const API_URL = 'http://192.168.75.159:8000'

    const dayNames = ['日', '一', '二', '三', '四', '五', '六']
    const daysInMonth = computed(() => new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth() + 1, 0).getDate())

    const formattedDate = computed(() => {
      const year = selectedDate.value.getFullYear()
      const month = selectedDate.value.getMonth() + 1
      return `${year}年${month}月`
    })

    const generateMonthlySchedule = async () => {
      if (!isDataReady.value) {
        error.value = '數據尚未準備就緒，請稍後再試。'
        return
      }

      isLoading.value = true
      error.value = ''

      try {
        const formulaSchedules = store.getters['schedule/getFormulaSchedule']('regular')
        const porFormulaSchedules = store.getters['schedule/getFormulaSchedule']('por')
        const leaderFormulaSchedules = store.getters['schedule/getFormulaSchedule']('leader')
        const secretaryFormulaSchedules = store.getters['schedule/getFormulaSchedule']('secretary')
        const allNurses = store.getters['staff/activeNurses']

        if (!formulaSchedules || !porFormulaSchedules || !leaderFormulaSchedules || !secretaryFormulaSchedules || !allNurses) {
          throw new Error('缺少公式班表或麻護數據')
        }

        const year = selectedDate.value.getFullYear()
        const month = selectedDate.value.getMonth()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const firstDayOfMonth = new Date(year, month, 1).getDay()
        const formulaStartDay = (firstDayOfMonth + 6) % 7

        monthlySchedule.value = allNurses.map(nurse => {
          const shifts = []
          let nurseFormulas
          let formulaGroupCount

          switch (nurse.role) {
            case 'POR':
              nurseFormulas = porFormulaSchedules.formula_data
              formulaGroupCount = porFormulaSchedules.formula_data.length
              break
            case 'leader':
              nurseFormulas = leaderFormulaSchedules.formula_data
              formulaGroupCount = leaderFormulaSchedules.formula_data.length
              break
            case 'secretary':
              nurseFormulas = secretaryFormulaSchedules.formula_data
              formulaGroupCount = secretaryFormulaSchedules.formula_data.length
              break
            default:
              nurseFormulas = formulaSchedules.formula_data
              formulaGroupCount = formulaSchedules.formula_data.length
          }

          let currentFormulaGroup = nurse.group - 1
          if (currentFormulaGroup < 0) currentFormulaGroup = 0

          for (let i = 0; i < daysInMonth; i++) {
            let shift = 'O'
            const dayInFormula = (formulaStartDay + i) % 7

            if (nurse.role === 'boss') {
              const dayOfWeek = (firstDayOfMonth + i) % 7
              shift = (dayOfWeek >= 1 && dayOfWeek <= 5) ? 'A' : 'O'
            } else if (nurse.group !== 0) {
              if (dayInFormula === 0 && i !== 0) {
                // 當新的一週開始時，移動到下一個公式組
                currentFormulaGroup = (currentFormulaGroup + 1) % formulaGroupCount
              }

              const formula = nurseFormulas[currentFormulaGroup]
              if (formula && formula.shifts) {
                shift = formula.shifts[dayInFormula] || 'O'
              }
            }
            shifts.push(shift)
          }

          return {
            name: nurse.name,
            role: nurse.role,
            group: nurse.group,
            shifts
          }
        })

      } catch (e) {
        console.error('生成月班表時發生錯誤:', e)
        error.value = e.message || '生成月班表時發生錯誤'
      } finally {
        isLoading.value = false
      }
    }


    const saveMonthlySchedule = async () => {
      if (monthlySchedule.value.length === 0) {
        error.value = '沒有可提交的班表數據'
        return
      }

      isLoading.value = true
      error.value = ''

      try {
        const scheduleData = {
          year: selectedDate.value.getFullYear(),
          month: selectedDate.value.getMonth() + 1,
          schedule: monthlySchedule.value
        }

        const response = await axios.post(`${API_URL}/api/monthly-schedule`, scheduleData)

        if (response.status === 200) {
          console.log('班表成功保存到伺服器')
          error.value = '班表已成功保存'
        } else {
          throw new Error('保存失敗')
        }
      } catch (err) {
        console.error('保存班表時發生錯誤:', err)
        error.value = '保存班表失敗，請稍後再試'
      } finally {
        isLoading.value = false
      }
    }

    const loadSavedSchedule = async () => {
      isLoading.value = true
      error.value = ''

      try {
        const year = selectedDate.value.getFullYear()
        const month = selectedDate.value.getMonth() + 1
        const response = await axios.get(`${API_URL}/api/monthly-schedule/${year}/${month}`)

        if (response.status === 200 && response.data) {
          monthlySchedule.value = response.data.schedule
          error.value = ''
        } else {
          monthlySchedule.value = []
          error.value = '該月份暫無班表'
        }
      } catch (e) {
        console.error('從數據庫加載班表時發生錯誤:', e)
        if (e.response && e.response.status === 404) {
          error.value = '該月份暫無班表'
          monthlySchedule.value = []
        } else {
          error.value = '加載班表失敗，請稍後再試'
        }
      } finally {
        isLoading.value = false
      }
    }

    const toggleShift = (nurseIndex, shiftIndex) => {
      const currentShift = monthlySchedule.value[nurseIndex].shifts[shiftIndex]
      const shiftTypes = ['D', 'A', 'N', 'O', 'K', 'C', 'F', 'E', 'B']
      const nextShiftIndex = (shiftTypes.indexOf(currentShift) + 1) % shiftTypes.length
      monthlySchedule.value[nurseIndex].shifts[shiftIndex] = shiftTypes[nextShiftIndex]
    }

    const getShiftClass = (shift) => {
      return {
        'shift-d': shift === 'D',
        'shift-a': shift === 'A',
        'shift-n': shift === 'N',
        'shift-k': shift === 'K',
        'shift-c': shift === 'C',
        'shift-f': shift === 'F',
        'shift-e': shift === 'E',
        'shift-b': shift === 'B',
        'shift-o': shift === 'O'
      }
    }

    const getDayName = (day) => dayNames[day]

    const countShifts = (shifts, type) => shifts.filter(shift => shift === type).length

    const calculateTotalHours = (shifts) => {
      const hourMapping = { 'D': 10, 'A': 8, 'N': 8, 'O': 0, 'K': 8, 'C': 8, 'F': 8, 'E': 4, 'B': 8 }
      return shifts.reduce((total, shift) => total + (hourMapping[shift] || 0), 0)
    }

    const countDailyShifts = (day, type) => {
      return monthlySchedule.value.filter(nurse => nurse.shifts[day] === type).length
    }


    const generatePDF = () => {
      const element = document.querySelector('.monthly-schedule');

      const elementsToHide = element.querySelectorAll('.hide-for-pdf');
      elementsToHide.forEach(el => el.style.display = 'none');

      const titleElement = element.querySelector('h1');
      const originalTitle = titleElement.innerText;

      const year = selectedDate.value.getFullYear();
      const month = selectedDate.value.getMonth() + 1;
      titleElement.innerText = `恩主公麻醉科護理人員${year}年${month}月班表`;

      const opt = {
        margin: 10,
        filename: `${formattedDate.value}班表.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        elementsToHide.forEach(el => el.style.display = '');
        titleElement.innerText = originalTitle;
      });
    };

    onMounted(async () => {
      try {
        await store.dispatch('schedule/loadFormulaSchedules')
        await store.dispatch('staff/fetchNurses')
        await loadSavedSchedule()
        isDataReady.value = true
      } catch (e) {
        console.error('初始化數據時發生錯誤:', e)
        error.value = '載入數據失敗，請刷新頁面重試'
      }
    })

    watch(selectedDate, () => {
      loadSavedSchedule()
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
      saveMonthlySchedule,
      generatePDF,
      toggleShift,
      getShiftClass,
      getDayName,
      countShifts,
      calculateTotalHours,
      countDailyShifts,
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
  background-color: #a08887;
}

.shift-a {
  background-color: #d9d06e;
}

.shift-n {
  background-color: #8387da;
}

.shift-o {
  background-color: #E0FFFF;
}

.shift-k {
  background-color: #8AA6C1;
}

.shift-c {
  background-color: #67dcbd;
}

.shift-f {
  background-color: #FFA07A;
}

.shift-e {
  background-color: #FFB6C1;
}

.shift-b {
  background-color: #FFDAB9;
}

.generate-button,
.save-button,
.generate-pdf-button {
  margin: 10px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  color: white;
  border: none;
  border-radius: 4px;
}

.generate-button {
  background-color: #4CAF50;
}

.save-button {
  background-color: #008CBA;
}

.generate-pdf-button {
  background-color: #FF9800;
}

.error-message {
  color: red;
  margin-top: 10px;
}

@media print {
  .hide-for-pdf {
    display: none !important;
  }

  body,
  html {
    margin: 0;
    padding: 0;
  }

  .monthly-schedule {
    page-break-inside: avoid;
    page-break-before: avoid;
  }
}
</style>