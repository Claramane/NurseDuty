import axios from "axios";

const API_URL = process.env.VUE_APP_API_URL;

export default {
  namespaced: true,
  state: {
    formulaSchedules: [
      { type: "regular", formula_data: [] },
      { type: "por", formula_data: [] },
      { type: "leader", formula_data: [] },
      { type: "secretary", formula_data: [] }
    ],
    monthlySchedule: [],
    selectedDate: new Date(),
    error: null,
    isLoading: false,
  },
  mutations: {
    setFormulaSchedules(state, schedules) {
      if (Array.isArray(schedules)) {
        state.formulaSchedules = schedules;
      } else {
        console.error('Attempting to set formulaSchedules with non-array value:', schedules);
      }
    },
    updateFormulaSchedule(state, { type, formula_data }) {
      const index = state.formulaSchedules.findIndex(schedule => schedule.type === type);
      if (index !== -1) {
        state.formulaSchedules[index].formula_data = formula_data;
      } else {
        console.error(`Formula schedule of type ${type} not found`);
      }
    },
    setError(state, error) {
      state.error = error;
    },
    setMonthlySchedule(state, schedule) {
      state.monthlySchedule = schedule;
    },
    setSelectedDate(state, date) {
      state.selectedDate = date;
    },
    setIsLoading(state, isLoading) {
      state.isLoading = isLoading;
    },
    updateShift(state, { nurseIndex, dayIndex, newShift }) {
      state.monthlySchedule[nurseIndex].shifts[dayIndex] = newShift;
    },
  },
  actions: {
    async saveFullSchedule({ state, commit }) {
      try {
        console.log("Saving all formula schedules");
        console.log("Current formulaSchedules:", state.formulaSchedules);
    
        const response = await axios.post(`${API_URL}/api/formula`, state.formulaSchedules, {
          headers: {
            "Content-Type": "application/json",
          },
        });
    
        console.log("All schedules saved:", response.data);
        commit("setFormulaSchedules", response.data);
        commit("setError", null);
      } catch (error) {
        console.error("Failed to save formula schedules:", error);
        commit("setError", `Failed to save formula schedules. ${error.message}`);
      }
    },

    async loadFormulaSchedules({ commit }) {
      try {
        const response = await axios.get(`${API_URL}/api/formula`);
        if (response.status === 200) {
          console.log("Loaded formula schedules:", response.data);
          commit("setFormulaSchedules", response.data);
          commit("setError", null);
        } else {
          throw new Error("Failed to load formula schedules");
        }
      } catch (error) {
        console.error("Failed to load formula schedules:", error);
        commit("setError", "Failed to load formula schedules. Please try again.");
      }
    },

    updateFormulaSchedule({ commit }, { type, formula_data }) {
      commit("updateFormulaSchedule", { type, formula_data });
    },

    async fetchMonthlySchedule({ commit, state }) {
      commit('setIsLoading', true);
      commit('setError', null);
      try {
        const year = state.selectedDate.getFullYear();
        const month = state.selectedDate.getMonth() + 1;
        const response = await axios.get(`${API_URL}/api/monthly-schedule/${year}/${month}`);
        commit('setMonthlySchedule', response.data.schedule);
      } catch (error) {
        console.error('Error fetching monthly schedule:', error);
        commit('setError', 'Failed to load monthly schedule. Please try again.');
      } finally {
        commit('setIsLoading', false);
      }
    },

    updateSelectedDate({ commit }, date) {
      commit('setSelectedDate', date);
    },

    updateShift({ commit }, payload) {
      commit('updateShift', payload);
    },

    async generateMonthlySchedule({ commit, getters, rootGetters, state }) {
      commit('setIsLoading', true);
      commit('setError', null);
      try {
        const formulaSchedules = getters.getFormulaSchedule('regular');
        const porFormulaSchedules = getters.getFormulaSchedule('por');
        const leaderFormulaSchedules = getters.getFormulaSchedule('leader');
        const secretaryFormulaSchedules = getters.getFormulaSchedule('secretary');
        const allNurses = rootGetters['staff/activeNurses'];

        if (!formulaSchedules || !porFormulaSchedules || !leaderFormulaSchedules || !secretaryFormulaSchedules || !allNurses) {
          throw new Error('缺少公式班表或護士數據');
        }

        const year = state.selectedDate.getFullYear();
        const month = state.selectedDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const formulaStartDay = (firstDayOfMonth + 6) % 7;

        const generatedSchedule = allNurses.map(nurse => {
          const shifts = [];
          let nurseFormulas;
          let formulaGroupCount;

          switch (nurse.role) {
            case 'POR':
              nurseFormulas = porFormulaSchedules.formula_data;
              formulaGroupCount = porFormulaSchedules.formula_data.length;
              break;
            case 'leader':
              nurseFormulas = leaderFormulaSchedules.formula_data;
              formulaGroupCount = leaderFormulaSchedules.formula_data.length;
              break;
            case 'secretary':
              nurseFormulas = secretaryFormulaSchedules.formula_data;
              formulaGroupCount = secretaryFormulaSchedules.formula_data.length;
              break;
            default:
              nurseFormulas = formulaSchedules.formula_data;
              formulaGroupCount = formulaSchedules.formula_data.length;
          }

          let currentFormulaGroup = nurse.group - 1;
          if (currentFormulaGroup < 0) currentFormulaGroup = 0;

          for (let i = 0; i < daysInMonth; i++) {
            let shift = 'O';
            const dayInFormula = (formulaStartDay + i) % 7;

            if (nurse.role === 'boss') {
              const dayOfWeek = (firstDayOfMonth + i) % 7;
              shift = (dayOfWeek >= 1 && dayOfWeek <= 5) ? 'A' : 'O';
            } else if (nurse.group !== 0) {
              if (dayInFormula === 0 && i !== 0) {
                currentFormulaGroup = (currentFormulaGroup + 1) % formulaGroupCount;
              }

              const formula = nurseFormulas[currentFormulaGroup];
              if (formula && formula.shifts) {
                shift = formula.shifts[dayInFormula] || 'O';
              }
            }
            shifts.push(shift);
          }

          return {
            name: nurse.name,
            role: nurse.role,
            group: nurse.group,
            shifts
          };
        });

        commit('setMonthlySchedule', generatedSchedule);
      } catch (e) {
        console.error('生成月班表時發生錯誤:', e);
        commit('setError', e.message || '生成月班表時發生錯誤');
      } finally {
        commit('setIsLoading', false);
      }
    },

    async saveMonthlySchedule({ state, commit }) {
      commit('setIsLoading', true);
      commit('setError', null);
      try {
        const scheduleData = {
          year: state.selectedDate.getFullYear(),
          month: state.selectedDate.getMonth() + 1,
          schedule: state.monthlySchedule
        };

        const response = await axios.post(`${API_URL}/api/monthly-schedule`, scheduleData);

        if (response.status === 200) {
          console.log('班表成功保存到伺服器');
          commit('setError', '班表已成功保存');
        } else {
          throw new Error('保存失敗');
        }
      } catch (err) {
        console.error('保存班表時發生錯誤:', err);
        commit('setError', '保存班表失敗，請稍後再試');
      } finally {
        commit('setIsLoading', false);
      }
    },
  },
  getters: {
    getFormulaSchedule: (state) => (type) => {
      return state.formulaSchedules.find(schedule => schedule.type === type) || null;
    },
    allFormulaSchedules: (state) => state.formulaSchedules,
    error: (state) => state.error,
    getMonthlySchedule: (state) => state.monthlySchedule,
    getSelectedDate: (state) => state.selectedDate,
    getIsLoading: (state) => state.isLoading,
  },
};