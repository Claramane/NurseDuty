import axios from "axios";

const API_URL = process.env.VUE_APP_API_URL
  ? process.env.VUE_APP_API_URL.replace(/"/g, "")
  : "http://localhost:8000";

export default {
  namespaced: true,
  state: {
    formulaSchedules: [
      { type: "regular", formula_data: [] },
      { type: "por", formula_data: [] },
      { type: "leader", formula_data: [] },
      { type: "secretary", formula_data: [] }
    ],
    error: null,
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
  },
  getters: {
    getFormulaSchedule: (state) => (type) => {
      return state.formulaSchedules.find(schedule => schedule.type === type) || null;
    },
    allFormulaSchedules: (state) => state.formulaSchedules,
    error: (state) => state.error,
  },
};