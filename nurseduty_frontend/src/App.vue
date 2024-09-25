<template>
  <div class="app-container">
    <aside class="sidebar">
      <div class="sidebar-top">
        <button @click="showSettings = true" class="settings-button">
          <i class="fas fa-cog"></i>
        </button>
      </div>
      <nav>
        <router-link to="/">首頁</router-link>
        <router-link to="/formula-schedule">麻醉staff公式班表調整</router-link>
        <router-link to="/por-formula">POR公式班表調整</router-link>
        <router-link to="/monthly-schedule">月班表生成區</router-link>
        <router-link to="/monthly-schedule-results">月班表生成結果</router-link>
      </nav>
      <StaffManagement v-if="$route.path === '/formula-schedule'" />
      <PORStaffManagement v-if="$route.path === '/por-formula'" />
    </aside>
    <main class="main-content">
      <router-view></router-view>
    </main>

    <div v-if="showSettings" class="settings-modal">
      <div class="settings-content">
        <button @click="closeSettings" class="close-button">&times;</button>
        <SettingsPanel @save="closeSettings" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import SettingsPanel from '@/components/SettingsPanel.vue'
import StaffManagement from '@/components/StaffManagement.vue'
import PORStaffManagement from '@/components/PORStaffManagement.vue'

export default {
  name: 'App',
  components: {
    SettingsPanel,
    StaffManagement,
    PORStaffManagement
  },
  setup() {
    const store = useStore()
    const showSettings = ref(false)

    const closeSettings = () => {
      showSettings.value = false
    }

    onMounted(async () => {
      try {
        await store.dispatch('staff/initializeNurses')
        await store.dispatch('schedule/fetchFormulaSchedules')
        await store.dispatch('schedule/fetchPORFormulaSchedules')
        await store.dispatch('settings/loadSettings')
      } catch (error) {
        console.error('Failed to initialize app data:', error)
      }
    })

    return {
      showSettings,
      closeSettings
    }
  }
}
</script>

<style>
.app-container {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 300px;
  background-color: #f0f0f0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-top {
  padding: 20px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.settings-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

nav {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

nav a {
  margin-bottom: 10px;
  text-decoration: none;
  color: #333;
  cursor: pointer;
}

.main-content {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
}

.settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.settings-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  position: relative;
  max-width: 500px;
  width: 90%;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}
</style>