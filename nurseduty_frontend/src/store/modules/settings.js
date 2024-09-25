// src/store/modules/settings.js
export default {
  namespaced: true,
  state: {
    regularGroupCount: 1,
    porGroupCount: 1
  },
  mutations: {
    setRegularGroupCount(state, count) {
      state.regularGroupCount = count;
    },
    setPorGroupCount(state, count) {
      state.porGroupCount = count;
    }
  },
  actions: {
    updateSettings({ commit }, { regularGroupCount, porGroupCount }) {
      commit('setRegularGroupCount', regularGroupCount);
      commit('setPorGroupCount', porGroupCount);
      localStorage.setItem('settings', JSON.stringify({ regularGroupCount, porGroupCount }));
    },
    loadSettings({ commit }) {
      const settings = JSON.parse(localStorage.getItem('settings'));
      if (settings) {
        commit('setRegularGroupCount', settings.regularGroupCount || 1);
        commit('setPorGroupCount', settings.porGroupCount || 1);
      }
    },
    updatePORGroupCount({ commit, state }, newCount) {
      commit('updatePORSchedulesCount', newCount)
      localStorage.setItem('porFormulaSchedules', JSON.stringify(state.porFormulaSchedules))
    }
    
  },
  getters: {
    regularGroupCount: state => state.regularGroupCount,
    porGroupCount: state => state.porGroupCount
  }
};