// src/store/modules/schedule.js
export default {
  namespaced: true,
  state: {
    formulaSchedules: [],
    porFormulaSchedules: []
  },
  mutations: {
    setFormulaSchedules(state, schedules) {
      state.formulaSchedules = schedules
    },
    setPORFormulaSchedules(state, schedules) {
      state.porFormulaSchedules = schedules
    }
  },
  actions: {
    saveFormulaSchedules({ commit }, schedules) {
      commit('setFormulaSchedules', schedules)
      localStorage.setItem('formulaSchedules', JSON.stringify(schedules))
    },
    savePORFormulaSchedules({ commit }, schedules) {
      commit('setPORFormulaSchedules', schedules)
      localStorage.setItem('porFormulaSchedules', JSON.stringify(schedules))
    },
    fetchFormulaSchedules({ commit }) {
      const schedules = JSON.parse(localStorage.getItem('formulaSchedules')) || []
      commit('setFormulaSchedules', schedules)
    },
    fetchPORFormulaSchedules({ commit }) {
      const schedules = JSON.parse(localStorage.getItem('porFormulaSchedules')) || []
      commit('setPORFormulaSchedules', schedules)
    }
  },
  getters: {
    getFormulaSchedules: state => state.formulaSchedules,
    getPORFormulaSchedules: state => state.porFormulaSchedules
  }
}