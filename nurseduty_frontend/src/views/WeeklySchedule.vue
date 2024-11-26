<template>
  <div class="weekly-schedule">
    <h1>{{ formattedDate }}週班表</h1>
    <div class="controls">
      <DatePicker v-model:value="selectedDate" type="month" :clearable="false" />
      <div class="buttons-container">
        <button v-for="week in weeksInMonth" :key="week" @click="selectWeek(week)"
          :class="{ active: currentWeek === week }" class="week-button">
          第{{ week }}週
        </button>
        <button @click="generatePDF" class="action-button generate-pdf-button">生成 PDF</button>
        <button @click="toggleShiftDisplay" class="action-button toggle-display-button">
          {{ showShiftTime ? '顯示班次代碼' : '顯示班次時間' }}
        </button>
      </div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="isLoading" class="loading-message">加載中...</div>
    </div>


    <div v-if="currentWeekSchedule.length" class="current-week-container">
      <div class="year-month">{{ formattedDate }}</div>
      <table>
        <thead>
          <tr>
            <th class="name-column">姓名</th>
            <th v-for="day in 7" :key="day">
              {{ getDayName(day - 1) }}
              <br>
              {{ getDateOfWeek(currentWeek - 1, day) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="nurse in currentWeekSchedule" :key="nurse.name">
            <td class="name-column">{{ nurse.name }}</td>
            <td v-for="(shift, dayIndex) in nurse.shifts" :key="dayIndex" :class="getShiftClass(shift)">
              {{ showShiftTime ? convertShiftToTime(shift) : shift }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 隱藏的完整內容，用於 PDF 生成 -->
    <div id="pdf-content" style="display: none;">
      <div v-for="(week, weekIndex) in weeklySchedule" :key="weekIndex" class="week-container">
        <h2 class="week-title">麻醉科護理人員值班週表</h2>
        <div class="year-month">{{ formattedDate }}</div>
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th v-for="day in 7" :key="day">
                {{ getDayName(day - 1) }}
                <br>
                {{ getDateOfWeek(weekIndex, day) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="nurse in week" :key="nurse.name">
              <td>{{ nurse.name }}</td>
              <td v-for="(shift, dayIndex) in nurse.shifts" :key="dayIndex" :class="getShiftClass(shift)">
                {{ showShiftTime ? convertShiftToTime(shift) : shift }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import DatePicker from 'vue-datepicker-next'
import 'vue-datepicker-next/index.css'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export default {
  name: 'WeeklySchedule',
  components: { DatePicker },
  setup() {
    const store = useStore()
    const selectedDate = ref(new Date())
    const currentWeek = ref(1)
    const error = computed(() => store.getters['schedule/error'])
    const isLoading = computed(() => store.getters['schedule/getIsLoading'])
    const showShiftTime = ref(false)

    const dayNames = ['一', '二', '三', '四', '五', '六', '日']
    const monthlySchedule = computed(() => store.getters['schedule/getMonthlySchedule'])

    const formattedDate = computed(() => {
      const year = selectedDate.value.getFullYear()
      const month = selectedDate.value.getMonth() + 1
      return `${year}年${month}月`
    })

    const daysInMonth = computed(() => new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth() + 1, 0).getDate())
    const firstDayOfMonth = computed(() => {
      const day = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), 1).getDay()
      return day === 0 ? 7 : day // 將週日(0)轉換為7，以便於計算
    })
    const weeksInMonth = computed(() => Math.ceil((daysInMonth.value + firstDayOfMonth.value - 1) / 7))

    const weeklySchedule = computed(() => {
      if (!monthlySchedule.value.length) return []

      const weeks = []
      for (let week = 0; week < weeksInMonth.value; week++) {
        const weekSchedule = monthlySchedule.value.map(nurse => {
          const startIndex = week * 7 - (firstDayOfMonth.value - 1)
          const endIndex = startIndex + 7
          const weekShifts = nurse.shifts.slice(Math.max(0, startIndex), endIndex)

          while (weekShifts.length < 7) {
            if (week === 0) {
              weekShifts.unshift('')
            } else {
              weekShifts.push('')
            }
          }
          return {
            name: nurse.name,
            shifts: weekShifts
          }
        })
        weeks.push(weekSchedule)
      }
      return weeks
    })

    const currentWeekSchedule = computed(() => {
      return weeklySchedule.value[currentWeek.value - 1] || []
    })

    const getDayName = (day) => dayNames[day]

    const getDateOfWeek = (weekIndex, day) => {
      const date = weekIndex * 7 + day - (firstDayOfMonth.value - 1)
      if (date < 1 || date > daysInMonth.value) return ''
      return date
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

    const convertShiftToTime = (shift) => {
      const shiftTimes = {
        'A': '8-16',
        'B': '8-17',
        'N': '14-22',
        'D': '22-08',
        'E': '8-12',
        'K': '9-17',
        'C': '10-18',
        'F': '12-20',
        'O': 'OFF'
      }
      return shiftTimes[shift] || shift
    }

    const toggleShiftDisplay = () => {
      showShiftTime.value = !showShiftTime.value
    }

    const loadSchedule = async () => {
      await store.dispatch('schedule/updateSelectedDate', selectedDate.value)
      await store.dispatch('schedule/fetchMonthlySchedule')
    }

    const selectWeek = (week) => {
      currentWeek.value = week
    }

    const generatePDF = async () => {
      const element = document.getElementById('pdf-content');
      const pdfContent = element.cloneNode(true);
      document.body.appendChild(pdfContent);
      pdfContent.style.display = 'block';

      // 臨時調整 CSS 以確保 PDF 中的比例正確
      pdfContent.style.width = '1000px';  // 設置一個固定寬度，與網頁版本一致
      pdfContent.querySelectorAll('table').forEach(table => {
        table.style.width = '100%';
        table.style.tableLayout = 'fixed';
      });
      pdfContent.querySelectorAll('th, td').forEach(cell => {
        cell.style.width = 'auto';  // 重置寬度，讓單元格自動調整
      });


      pdfContent.querySelectorAll('.week-container h2').forEach(title => {
        title.style.textAlign = 'center';
        title.style.width = '100%';
        title.style.position = 'relative';
        title.style.left = '0';
        title.style.right = '0';
      });

      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 5;  // 減少邊距以允許更大的內容區域

      const weekContainers = pdfContent.querySelectorAll('.week-container');

      for (let i = 0; i < weekContainers.length; i++) {
        const weekContainer = weekContainers[i];

        const canvas = await html2canvas(weekContainer, {
          scale: 2,
          width: 1000,  // 確保與設置的固定寬度一致
          height: weekContainer.offsetHeight,
          useCORS: true,
          allowTaint: true,
        });

        let imgData = canvas.toDataURL('image/jpeg', 1.0);

        // 計算適當的圖片尺寸，保持原始比例
        let imgWidth = pdfWidth - 2 * margin;
        let imgHeight = (canvas.height / canvas.width) * imgWidth;

        if (imgHeight > pdfHeight - 2 * margin) {
          imgHeight = pdfHeight - 2 * margin;
          imgWidth = (canvas.width / canvas.height) * imgHeight;
        }

        // 計算居中位置
        const xPosition = (pdfWidth - imgWidth) / 2;
        const yPosition = (pdfHeight - imgHeight) / 2;

        pdf.addImage(imgData, 'JPEG', xPosition, yPosition, imgWidth, imgHeight);

        if (i < weekContainers.length - 1) {
          pdf.addPage();
        }
      }

      document.body.removeChild(pdfContent);
      pdf.save(`麻醉科護理人員值班週表_${formattedDate.value}.pdf`);
    };

    onMounted(() => {
      loadSchedule()
    })

    watch(selectedDate, () => {
      loadSchedule()
      currentWeek.value = 1
    })

    return {
      selectedDate,
      currentWeek,
      weeksInMonth,
      weeklySchedule,
      currentWeekSchedule,
      formattedDate,
      error,
      isLoading,
      showShiftTime,
      getDayName,
      getDateOfWeek,
      getShiftClass,
      convertShiftToTime,
      toggleShiftDisplay,
      loadSchedule,
      selectWeek,
      generatePDF
    }
  }
}
</script>

<style scoped>
.weekly-schedule {
  padding: 20px;
  max-width: 1000px;
  /* 限制最大寬度 */
  margin: 0 auto;
  /* 居中顯示 */
}

.controls {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.buttons-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-left: 10px;
}

.week-button,
.action-button {
  margin: 5px;
  padding: 10px 15px;
  font-size: 14px;
  cursor: pointer;
  color: white;
  border: none;
  border-radius: 4px;
  background-color: #2196F3;
}

.week-button.active {
  background-color: #4CAF50;
}

.generate-pdf-button {
  background-color: #FF9800;
}

.toggle-display-button {
  background-color: #9C27B0;
}

.week-container {
  margin-bottom: 30px;
  position: relative;
  page-break-after: always;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
}

th,
td {
  border: 1px solid #ddd;
  padding: 4px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

th {
  background-color: #f2f2f2;
}

.name-column {
  width: 80px;
  /* 調整姓名列的寬度 */
}


th:not(.name-column),
td:not(.name-column) {
  width: calc((100% - 80px) / 7);
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

.error-message {
  color: red;
  margin-top: 10px;
}

.loading-message {
  color: blue;
  margin-top: 10px;
}

.year-month {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 14px;
}

#pdf-content {
  display: none;
}

@media print {
  .weekly-schedule {
    max-width: none;
    /* 取消最大寬度限制，以適應打印 */
    margin: 0;
    /* 取消內邊距，以避免空白邊距 */
  }

  .hide-for-pdf {
    display: none !important;
  }

  .week-container {
    display: block;
    page-break-after: always;
  }
}
</style>