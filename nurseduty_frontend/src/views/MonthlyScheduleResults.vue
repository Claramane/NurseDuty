<template>
  <div class="monthly-schedule-results">
    <h1>月班表生成結果</h1>
    <div v-if="schedules.length === 0">暫無保存的月班表</div>
    <div v-else>
      <select v-model="selectedSchedule">
        <option v-for="schedule in schedules" :key="schedule.date" :value="schedule">
          {{ formatDate(new Date(schedule.date)) }}
        </option>
      </select>
      <button @click="generatePDF" class="generate-pdf-button">生成 PDF</button>
      <div id="pdf-content">
        <h2 class="pdf-title">恩主公麻醉科{{ formatMonthYear(selectedSchedule?.date) }}月班表</h2>
        <table v-if="selectedSchedule">
          <thead>
            <tr>
              <th>姓名</th>
              <th v-for="day in getDaysInMonth(selectedSchedule.date)" :key="day">
                {{ day }}<br>{{ getDayName(new Date(selectedSchedule.date).getDay(day - 1)) }}
              </th>
              <th>總時數</th> 
            </tr>
          </thead>
          <tbody>
            <tr v-for="nurse in selectedSchedule.monthlySchedule" :key="nurse.name">
              <td>{{ nurse.name }}</td>
              <td v-for="(shift, index) in nurse.shifts" :key="index" :class="getShiftClass(shift)">
                {{ shift }}
              </td>
              <td>{{ calculateTotalHours(nurse.shifts) }}</td> <!-- 計算並顯示每位護理人員的總時數 -->
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default {
  name: 'MonthlyScheduleResults',
  setup() {
    const schedules = ref([])
    const selectedSchedule = ref(null)

    const formatDate = (date) => {
      return `${date.getFullYear()}年${date.getMonth() + 1}月`
    }

    const getDaysInMonth = (dateString) => {
      const date = new Date(dateString)
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    }

    const getShiftClass = (shift) => {
      return {
        'shift-d': shift === 'D',
        'shift-a': shift === 'A',
        'shift-n': shift === 'N',
        'shift-k': shift === 'K',
        'shift-c': shift === 'C',
        'shift-f': shift === 'F',
        'shift-o': shift === 'O'
      }
    }

    const calculateTotalHours = (shifts) => {
      const hourMapping = { 'D': 8, 'A': 8, 'N': 10, 'O': 0, 'K': 8, 'C': 8, 'F': 8 }
      return shifts.reduce((total, shift) => total + (hourMapping[shift] || 0), 0)
    }

    const getDayName = (day) => {
      const dayNames = ['日', '一', '二', '三', '四', '五', '六']
      return dayNames[day]
    }

    const generatePDF = async () => {
      const element = document.getElementById('pdf-content')
      const canvas = await html2canvas(element, {
        scale: 2,  // 提高清晰度
        logging: false,  // 關閉日誌
        onclone: (clonedDoc) => {
          clonedDoc.getElementById('pdf-content').style.width = '2000px'
          Array.from(clonedDoc.getElementsByClassName('shift-d')).forEach(el => el.style.backgroundColor = '#FFCCCB')
          Array.from(clonedDoc.getElementsByClassName('shift-a')).forEach(el => el.style.backgroundColor = '#FFFFCC')
          Array.from(clonedDoc.getElementsByClassName('shift-n')).forEach(el => el.style.backgroundColor = '#E6E6FA')
          Array.from(clonedDoc.getElementsByClassName('shift-o')).forEach(el => el.style.backgroundColor = '#E0FFFF')
        }
      })

      const imgData = canvas.toDataURL('image/png')

      // 創建一個適應內容大小的 PDF
      const pdf = new jsPDF({
        orientation: 'l',  // 橫向
        unit: 'px',
        format: [canvas.width, canvas.height]
      })

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`恩主公麻醉科${formatMonthYear(selectedSchedule.value.date)}月班表.pdf`)
    }

    const formatMonthYear = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}年${date.getMonth() + 1}`
}


    onMounted(() => {
      const savedSchedules = JSON.parse(localStorage.getItem('monthlySchedules') || '[]')
      schedules.value = savedSchedules.map(schedule => ({
        ...schedule,
        date: new Date(schedule.date)
      }))
      if (schedules.value.length > 0) {
        selectedSchedule.value = schedules.value[schedules.value.length - 1]
      }
    })

    return {
      schedules,
      selectedSchedule,
      formatDate,
      getDaysInMonth,
      getShiftClass,
      calculateTotalHours,
      getDayName,
      generatePDF,
      formatMonthYear
    }
  }
}
</script>

<style scoped>
.monthly-schedule-results {
  padding: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
.pdf-title {
  text-align: center;
  font-size: 24px;
  margin-bottom: 20px;
}

th,
td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
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

.generate-pdf-button {
  margin-left: 10px;
  padding: 5px 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>