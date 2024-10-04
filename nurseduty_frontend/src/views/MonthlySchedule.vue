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
    
    <!-- 隱藏的完整內容，用於 PDF 生成 -->
    <div id="pdf-content" style="display: none;">
      <h2 class="pdf-title">恩主公麻醉科護理人員{{ formattedDate }}班表</h2>
      <table>
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
            <td v-for="(shift, shiftIndex) in nurse.shifts" :key="shiftIndex"
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
  </div>
</template>

<script>
import { computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import DatePicker from 'vue-datepicker-next'
import 'vue-datepicker-next/index.css'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export default {
  name: 'MonthlySchedule',
  components: { DatePicker },
  setup() {
    const store = useStore()

    const selectedDate = computed({
      get: () => store.getters['schedule/getSelectedDate'],
      set: (value) => store.dispatch('schedule/updateSelectedDate', value)
    })
    const monthlySchedule = computed(() => store.getters['schedule/getMonthlySchedule'])
    const error = computed(() => store.getters['schedule/error'])
    const isLoading = computed(() => store.getters['schedule/getIsLoading'])
    const isDataReady = computed(() => store.getters['schedule/getFormulaSchedule']('regular') !== null)

    const dayNames = ['日', '一', '二', '三', '四', '五', '六']
    const daysInMonth = computed(() => new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth() + 1, 0).getDate())

    const formattedDate = computed(() => {
      const year = selectedDate.value.getFullYear()
      const month = selectedDate.value.getMonth() + 1
      return `${year}年${month}月`
    })

    const generateMonthlySchedule = async () => {
      if (!isDataReady.value) {
        store.commit('schedule/setError', '數據尚未準備就緒，請稍後再試。')
        return
      }

      await store.dispatch('schedule/generateMonthlySchedule')
    }

    const saveMonthlySchedule = () => {
      store.dispatch('schedule/saveMonthlySchedule')
    }

    const loadSavedSchedule = () => {
      store.dispatch('schedule/fetchMonthlySchedule')
    }

    const toggleShift = (nurseIndex, shiftIndex) => {
      const currentShift = monthlySchedule.value[nurseIndex].shifts[shiftIndex]
      const shiftTypes = ['D', 'A', 'N', 'O', 'K', 'C', 'F', 'E', 'B']
      const nextShiftIndex = (shiftTypes.indexOf(currentShift) + 1) % shiftTypes.length
      const newShift = shiftTypes[nextShiftIndex]
      store.dispatch('schedule/updateShift', { nurseIndex, dayIndex: shiftIndex, newShift })
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

    const generatePDF = async () => {
      const element = document.getElementById('pdf-content');
      const pdfContent = element.cloneNode(true);
      document.body.appendChild(pdfContent);
      pdfContent.style.display = 'block';

      // 臨時調整 CSS 以確保 PDF 中的比例正確
      pdfContent.style.width = '1500px';  // 設置一個固定寬度，由於月表較寬，我們增加了寬度
      pdfContent.querySelector('table').style.width = '100%';
      pdfContent.querySelector('table').style.tableLayout = 'fixed';
      pdfContent.querySelectorAll('th, td').forEach(cell => {
        cell.style.width = 'auto';  // 重置寬度，讓單元格自動調整
      });

      pdfContent.querySelector('.pdf-title').style.textAlign = 'center';
      pdfContent.querySelector('.pdf-title').style.marginBottom = '20px';

      const pdf = new jsPDF('l', 'mm', 'a3');  // 使用 A3 橫向以適應更多列
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 5;  // 減少邊距以允許更大的內容區域

      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        width: 1500,  // 確保與設置的固定寬度一致
        height: pdfContent.offsetHeight,
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

      document.body.removeChild(pdfContent);
      pdf.save(`恩主公麻醉科護理人員${formattedDate.value}班表.pdf`);
    };

    onMounted(async () => {
      try {
        await store.dispatch('schedule/loadFormulaSchedules')
        await store.dispatch('staff/fetchNurses')
        await loadSavedSchedule()
      } catch (e) {
        console.error('初始化數據時發生錯誤:', e)
        store.commit('schedule/setError', '載入數據失敗，請刷新頁面重試')
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