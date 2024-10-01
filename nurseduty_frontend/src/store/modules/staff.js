import axios from 'axios';

// const API_URL = 'http://192.168.75.159:8000'
const API_URL = process.env.VUE_APP_API_URL;

export default {
  namespaced: true,
  state: {
    nurses: [],
    isLoading: false,
    error: null,
    lastUpdated: null
  },
  mutations: {
    setNurses(state, { nurses, lastUpdated }) {
      state.nurses = nurses;
      state.lastUpdated = lastUpdated;
    },
    setLoading(state, isLoading) {
      state.isLoading = isLoading;
    },
    setError(state, error) {
      state.error = error;
    },
    updateNurseGroup(state, { id, group }) {
      const nurse = state.nurses.find(n => n.id === id);
      if (nurse) {
        nurse.group = group;
      }
    },
    updateNurseActive(state, { id, active }) {
      const nurse = state.nurses.find(n => n.id === id);
      if (nurse) {
        nurse.active = active;
      }
    }
  },
  actions: {
    async fetchNurses({ commit }) {
      commit('setLoading', true);
      commit('setError', null);
      try {
        const response = await axios.get(`${API_URL}/api/nurses`);
        const { nurses, lastUpdated } = response.data;
        commit('setNurses', { nurses, lastUpdated });
      } catch (error) {
        console.error('Failed to fetch nurses:', error);
        commit('setError', 'Failed to load nurses. Please try again.');
      } finally {
        commit('setLoading', false);
      }
    },
    async updateNurseGroup({ commit }, { id, group }) {
      try {
        await axios.put(`${API_URL}/api/nurses/${id}`, { group });
        commit('updateNurseGroup', { id, group });
      } catch (error) {
        console.error('Failed to update nurse group:', error);
        throw error;
      }
    },
    async updateNurseActive({ commit }, { id, active }) {
      try {
        await axios.put(`${API_URL}/api/nurses/${id}`, { active });
        commit('updateNurseActive', { id, active });
      } catch (error) {
        console.error('Failed to update nurse active status:', error);
        throw error;
      }
    },
    async initializeNursesFromFormula({ dispatch }, type) {
      await dispatch('fetchNurses');
      const formulaData = this.getters['schedule/getFormulaSchedules'](type);
      if (formulaData) {
        for (const [index, groupData] of formulaData.entries()) {
          for (const nurseName of groupData.nurses) {
            const nurse = this.state.nurses.find(n => n.name === nurseName);
            if (nurse) {
              await dispatch('updateNurseGroup', { id: nurse.id, group: index + 1 });
            }
          }
        }
      }
    },
    async resetGroups({ dispatch }) {
      try {
        await axios.post(`${API_URL}/api/nurses/reset-groups`);
        await dispatch('fetchNurses');
      } catch (error) {
        console.error('Failed to reset nurse groups:', error);
        throw error;
      }
    }
  },
  getters: {
    allNurses: state => state.nurses,
    activeNurses: state => state.nurses.filter(nurse => nurse.active),
    nursesByRole: (state) => (role) => state.nurses.filter(nurse => nurse.role === role && nurse.active),
    nursesByGroup: (state) => (group) => state.nurses.filter(nurse => nurse.group === group && nurse.active),
    lastUpdateTime: state => state.lastUpdated
  }
};