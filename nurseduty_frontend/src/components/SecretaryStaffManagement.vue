<template>
  <div class="secretary-staff-management">
    <h2>秘書 成員組別調整</h2>
    <div v-if="!isLoading">
      <div v-for="nurse in secretaryNurses" :key="nurse.id" class="nurse-item">
        <span>{{ nurse.name }}</span>
        <select v-model="nurse.group" @change="updateGroup(nurse.id, nurse.group)">
          <option value="0">未分組</option>
          <option v-for="n in groupCount" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
    </div>
    <div v-else>
      載入中...
    </div>
    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'SecretaryStaffManagement',
  setup() {
    const store = useStore()
    const isLoading = ref(true)
    const error = ref(null)

    const secretaryNurses = computed(() => 
      store.getters['staff/nursesByRole']('secretary')
    )
    const groupCount = computed(() => store.getters['settings/secretaryGroupCount'])

    const updateGroup = async (id, group) => {
      try {
        await store.dispatch('staff/updateNurseGroup', { id, group })
      } catch (err) {
        console.error('Failed to update nurse group:', err)
        error.value = '更新護士組別失敗：' + (err.response?.data?.detail || err.message)
      }
    }

    onMounted(async () => {
      try {
        await store.dispatch('staff/fetchNurses')
        isLoading.value = false
      } catch (err) {
        console.error('Failed to fetch nurses:', err)
        error.value = '獲取護士數據失敗：' + (err.response?.data?.detail || err.message)
        isLoading.value = false
      }
    })

    return {
      secretaryNurses,
      groupCount,
      updateGroup,
      isLoading,
      error
    }
  }
}
</script>

<style scoped>
.secretary-staff-management {
  padding: 20px;
}
.nurse-item {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}
.nurse-item span {
  margin-right: 10px;
  min-width: 100px;
}
select {
  padding: 5px;
}
.error-message {
  color: red;
  margin-top: 10px;
}
</style>