const initialNurses = [
  { name: "王子夙", group: 0, role: "leader" },
  { name: "莊佩慧", group: 0, role: "leader" },
  { name: "黃靜玲", group: 0, role: "leader" },
  { name: "洪秀玲", group: 0, role: "member" },
  { name: "蔡秀金", group: 0, role: "member" },
  { name: "張慈珮", group: 0, role: "member" },
  { name: "許舒惠", group: 0, role: "member" },
  { name: "何瑩慧", group: 0, role: "member" },
  { name: "林雪美", group: 0, role: "member" },
  { name: "謝佩陵", group: 0, role: "member" },
  { name: "陳稚平", group: 0, role: "member" },
  { name: "李相君", group: 0, role: "member" },
  { name: "顧心如", group: 0, role: "member" },
  { name: "葉朝菩", group: 0, role: "member" },
  { name: "石育菁", group: 0, role: "member" },
  { name: "王姿惠", group: 0, role: "member" },
  { name: "李宥蓁", group: 0, role: "member" },
  { name: "魏凡雅", group: 0, role: "member" },
  { name: "周穎昇", group: 0, role: "member" },
  { name: "趙仁傑", group: 0, role: "member" },
  { name: "施瑩瑩", group: 0, role: "member" },
  { name: "葉怡彣", group: 0, role: "member" },
  { name: "邱卉羚", group: 0, role: "member" },
  { name: "王釋璞", group: 0, role: "member" },
  { name: "游佳蓁", group: 0, role: "member" },
  { name: "張育蓉", group: 0, role: "member" },
  { name: "戴培雅", group: 0, role: "member" },
  { name: "李佳欣", group: 0, role: "member" },
  { name: "王欣媚", group: 0, role: "member" },
  { name: "游芷欣", group: 0, role: "member" },
  { name: "林蓁", group: 0, role: "member" },
  { name: "洪玉晶", group: 0, role: "POR" },
  { name: "劉宸君", group: 0, role: "POR" },
  { name: "蔡惠婷", group: 0, role: "POR" },
  { name: "陳聿均", group: 0, role: "POR" },
  { name: "李孟亭", group: 0, role: "POR" },
  { name: "潘靜怡", group: 0, role: "POR" },
  { name: "陳盈蓓", group: 0, role: "POR" },
  { name: "郭淑慧", group: 0, role: "POR" },
];

export default {
    namespaced: true,
    state: {
      nurses: []
    },
    mutations: {
      setNurses(state, nurses) {
        state.nurses = nurses;
      },
      updateNurseGroup(state, { name, group }) {
        const nurse = state.nurses.find(n => n.name === name);
        if (nurse) {
          nurse.group = group;
        }
      }
    },
    actions: {
      initializeNurses({ commit, dispatch }) {
        const savedNurses = JSON.parse(localStorage.getItem('nurses'));
        if (savedNurses && savedNurses.length > 0) {
          commit('setNurses', savedNurses);
        } else {
          commit('setNurses', initialNurses);
          dispatch('saveNurses');
        }
      },
      saveNurses({ state }) {
        localStorage.setItem('nurses', JSON.stringify(state.nurses));
      },
      updateNurseGroup({ commit, dispatch }, payload) {
        commit('updateNurseGroup', payload);
        dispatch('saveNurses');
      }
    },
    getters: {
      allNurses: state => state.nurses,
      memberNurses: state => state.nurses.filter(nurse => nurse.role === 'member')
    }
  };