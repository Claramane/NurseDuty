<template>
  <div class="leader-staff-management">
    <h2>Leader 成員組別調整</h2>
    <div class="group-control">
      <button @click="adjustAllGroups(-1)" :disabled="isLoading">-</button>
      <button @click="adjustAllGroups(1)" :disabled="isLoading">+</button>
    </div>
    <div v-if="!isLoading">
      <div v-for="nurse in leaderNurses" :key="nurse.id" class="nurse-item">
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
  name: 'LeaderStaffManagement',
  setup() {
    const store = useStore()
    const isLoading = ref(true)
    const error = ref(null)

    const leaderNurses = computed(() => 
      store.getters['staff/nursesByRole']('leader')
    )
    const groupCount = computed(() => store.getters['settings/leaderGroupCount'])

    const updateGroup = async (id, group) => {
      try {
        await store.dispatch('staff/updateNurseGroup', { id, group })
      } catch (err) {
        console.error('Failed to update nurse group:', err)
        error.value = '更新護士組別失敗：' + (err.response?.data?.detail || err.message)
      }
    }

    const adjustAllGroups = async (adjustment) => {
      try {
        isLoading.value = true
        const updatedNurses = leaderNurses.value.map(nurse => {
          if (nurse.group === 0) {
            return nurse
          }
          let newGroup = nurse.group + adjustment
          if (newGroup > groupCount.value) {
            newGroup = 1
          } else if (newGroup < 1) {
            newGroup = groupCount.value
          }
          return { ...nurse, group: newGroup }
        })

        for (const nurse of updatedNurses) {
          if (nurse.group !== 0) {
            await store.dispatch('staff/updateNurseGroup', {
              id: nurse.id,
              group: nurse.group
            })
          }
        }

        await store.dispatch('staff/fetchNurses')
      } catch (err) {
        console.error('Failed to adjust groups:', err)
        error.value = '調整組別失敗：' + (err.response?.data?.detail || err.message)
      } finally {
        isLoading.value = false
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
      leaderNurses,
      groupCount,
      updateGroup,
      adjustAllGroups,
      isLoading,
      error
    }
  }
}
</script>

<style scoped>
.staff-management {
  padding: 20px;
}
.group-control {
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
}
.group-control button {
  padding: 5px 10px;
  font-size: 16px;
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