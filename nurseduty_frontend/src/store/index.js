import { createStore } from "vuex";
import settings from "./modules/settings";
import schedule from "./modules/schedule";
import staff from "./modules/staff";

export default createStore({
  modules: {
    settings,
    schedule,
    staff,
  },
  actions: {
    notifyGroupCountChanged() {
      console.log("設置已更新");
    },
  },
});
