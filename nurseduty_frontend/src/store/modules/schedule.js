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

    async saveMonthlySchedule({ state, commit }) {
      commit('setIsLoading', true);
      commit('setError', null);
      try {
        const year = state.selectedDate.getFullYear();
        const month = state.selectedDate.getMonth() + 1;
        const scheduleData = {
          year,
          month,
          schedule: state.monthlySchedule
        };
        const response = await axios.post(`${API_URL}/api/monthly-schedule`, scheduleData);
        if (response.status === 200) {
          console.log('Monthly schedule successfully saved');
        } else {
          throw new Error('Failed to save monthly schedule');
        }
      } catch (error) {
        console.error('Error saving monthly schedule:', error);
        commit('setError', 'Failed to save monthly schedule. Please try again.');
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