<template>
    <div class="schedule-builder">
      <h2>公式班表建構器</h2>
      <table>
        <thead>
          <tr>
            <th>組別</th>
            <th v-for="day in 7" :key="day">星期{{ dayNames[day - 1] }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(group, groupIndex) in formulaSchedule" :key="groupIndex">
            <td>組別 {{ groupIndex + 1 }}</td>
            <td v-for="(shift, dayIndex) in group" :key="dayIndex">
              <select v-model="formulaSchedule[groupIndex][dayIndex]" @change="updateFormulaSchedule">
                <option v-for="type in settings.shiftTypes" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script>
  import { mapState, mapMutations } from 'vuex';
  
  export default {
    name: 'ScheduleBuilder',
    data() {
      return {
        dayNames: ['一', '二', '三', '四', '五', '六', '日']
      }
    },
    computed: {
      ...mapState('settings', ['settings']),
      ...mapState('schedule', ['formulaSchedule'])
    },
    methods: {
      ...mapMutations('schedule', ['updateFormulaSchedule']),
      initializeFormulaSchedule() {
        const { groupCount, shiftsPerWeek, shiftTypes } = this.settings;
        const newSchedule = Array(groupCount).fill().map(() => 
          Array(shiftsPerWeek).fill(shiftTypes[0])
        );
        this.updateFormulaSchedule(newSchedule);
      }
    },
    watch: {
      'settings': {
        handler: 'initializeFormulaSchedule',
        deep: true,
        immediate: true
      }
    }
  }
  </script>
  
  <style scoped>
  .schedule-builder table {
    border-collapse: collapse;
    width: 100%;
  }
  .schedule-builder th, .schedule-builder td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
  }
  </style>