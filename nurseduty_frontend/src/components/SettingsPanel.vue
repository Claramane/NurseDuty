<template>
  <div class="settings-panel">
    <h2>系統設置</h2>
    <div class="form-group">
      <label for="regularGroupCount">一般公式班組數：</label>
      <button @click="decreaseGroup('regular')" :disabled="settings.regularGroupCount <= 1">-</button>
      <span>{{ settings.regularGroupCount }}</span>
      <button @click="increaseGroup('regular')">+</button>
    </div>
    <div class="form-group">
      <label for="porGroupCount">POR公式班組數：</label>
      <button @click="decreaseGroup('por')" :disabled="settings.porGroupCount <= 1">-</button>
      <span>{{ settings.porGroupCount }}</span>
      <button @click="increaseGroup('por')">+</button>
    </div>
    <div class="form-group">
      <label for="porGroupCount">Leader公式班組數：</label>
      <button @click="decreaseGroup('leader')" :disabled="settings.leaderGroupCount <= 1">-</button>
      <span>{{ settings.leaderGroupCount }}</span>
      <button @click="increaseGroup('leader')">+</button>
    </div>
    <div class="form-group">
      <label for="secretaryGroupCount">秘書公式班組數：</label>
      <button @click="decreaseGroup('secretary')" :disabled="settings.secretaryGroupCount <= 1">-</button>
      <span>{{ settings.secretaryGroupCount }}</span>
      <button @click="increaseGroup('secretary')">+</button>
    </div>
    <button @click="saveSettings" class="save-button">儲存設置</button>
  </div>
</template>

<script>
import { reactive, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'SettingsPanel',
  emits: ['save'],
  setup(props, { emit }) {
    const store = useStore()
    const settings = reactive({
      regularGroupCount: store.state.settings.regularGroupCount,
      porGroupCount: store.state.settings.porGroupCount,
      leaderGroupCount: store.state.settings.leaderGroupCount,
      secretaryGroupCount: store.state.settings.secretaryGroupCount
    })

    onMounted(() => {
      settings.regularGroupCount = store.state.settings.regularGroupCount
      settings.porGroupCount = store.state.settings.porGroupCount
      settings.leaderGroupCount = store.state.settings.leaderGroupCount
      settings.secretaryGroupCount = store.state.settings.secretaryGroupCount
    })

    const increaseGroup = (type) => {
      if (type === 'regular') {
        settings.regularGroupCount++
      } else if (type === 'por') {
        settings.porGroupCount++
      } else if (type === 'leader') {
        settings.leaderGroupCount++
      } else if (type === 'secretary') {
        settings.secretaryGroupCount++
      }
    }

    const decreaseGroup = (type) => {
      if (type === 'regular' && settings.regularGroupCount > 1) {
        settings.regularGroupCount--
      } else if (type === 'por' && settings.porGroupCount > 1) {
        settings.porGroupCount--
      } else if (type === 'leader' && settings.leaderGroupCount > 1) {
        settings.leaderGroupCount--
      } else if (type === 'secretary' && settings.secretaryGroupCount > 1) {
        settings.secretaryGroupCount--
      }
    }

    const saveSettings = () => {
      store.dispatch('settings/updateSettings', settings)
      emit('save')
    }

    return {
      settings,
      increaseGroup,
      decreaseGroup,
      saveSettings
    }
  }
}
</script>
  
  
  <style scoped>
  .settings-panel {
    background-color: white;
    padding: 20px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  .form-group {
    margin-bottom: 15px;
  }
  .save-button {
    background-color: #4CAF50;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  </style>