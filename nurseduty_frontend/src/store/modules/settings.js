import axios from 'axios';

// const API_URL = 'http://192.168.75.159:8000'
const API_URL = process.env.VUE_APP_API_URL;

export default {
  namespaced: true,
  state: {
    regularGroupCount: 1,
    porGroupCount: 1,
    leaderGroupCount: 1,
    secretaryGroupCount: 1,
    error: null
  },
  mutations: {
    setRegularGroupCount(state, count) {
      state.regularGroupCount = count;
    },
    setPorGroupCount(state, count) {
      state.porGroupCount = count;
    },
    setLeaderGroupCount(state, count) {
      state.leaderGroupCount = count;
    },
    setSecretaryGroupCount(state, count) {
      state.secretaryGroupCount = count;
    },
    setError(state, error) {
      state.error = error;
    }
  },
  actions: {
    async updateSettings({ commit }, { regularGroupCount, porGroupCount, leaderGroupCount, secretaryGroupCount }) {
      try {
        const response = await axios.post(`${API_URL}/api/settings`, {
          regularGroupCount,
          porGroupCount,
          leaderGroupCount,
          secretaryGroupCount
        });
        
        if (response.status === 200) {
          commit('setRegularGroupCount', regularGroupCount);
          commit('setPorGroupCount', porGroupCount);
          commit('setLeaderGroupCount', leaderGroupCount);
          commit('setSecretaryGroupCount', secretaryGroupCount);
          commit('setError', null);
        } else {
          throw new Error('Failed to update settings');
        }
      } catch (error) {
        console.error('Error updating settings:', error);
        commit('setError', 'Failed to update settings. Please try again.');
      }
    },
    async loadSettings({ commit }) {
      try {
        const response = await axios.get(`${API_URL}/api/settings`);
        
        if (response.status === 200) {
          const settings = response.data;
          commit('setRegularGroupCount', settings.regularGroupCount || 1);
          commit('setPorGroupCount', settings.porGroupCount || 1);
          commit('setLeaderGroupCount', settings.leaderGroupCount || 1);
          commit('setSecretaryGroupCount', settings.secretaryGroupCount || 1);
          commit('setError', null);
        } else {
          throw new Error('Failed to load settings');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        commit('setError', 'Failed to load settings. Please try again.');
      }
    },
  },
  getters: {
    regularGroupCount: state => state.regularGroupCount,
    porGroupCount: state => state.porGroupCount,
    leaderGroupCount: state => state.leaderGroupCount,
    secretaryGroupCount: state => state.secretaryGroupCount,
    error: state => state.error
  }
};