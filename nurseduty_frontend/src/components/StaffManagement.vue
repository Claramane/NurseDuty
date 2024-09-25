<template>
  <div class="staff-management">
    <h2>公式班成員組別調整</h2>
    <div v-if="isLoaded">
      <div v-for="nurse in memberNurses" :key="nurse.name" class="nurse-item">
        <span>{{ nurse.name }}</span>
        <select v-model="nurse.group" @change="updateGroup(nurse.name, nurse.group)">
          <option value="0">未分組</option>
          <option v-for="n in groupCount" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
    </div>
    <div v-else>
      載入中...
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'StaffManagement',
  setup() {
    const store = useStore()
    const isLoaded = ref(false)

    const memberNurses = computed(() => 
      store.getters['staff/memberNurses'].filter(nurse => nurse.role === 'member')
    )
    const groupCount = computed(() => store.getters['settings/regularGroupCount'])

    const updateGroup = (name, group) => {
      store.dispatch('staff/updateNurseGroup', { name, group })
    }

    onMounted(async () => {
      try {
        await store.dispatch('staff/initializeNurses')
        isLoaded.value = true
      } catch (error) {
        console.error('Failed to initialize nurses:', error)
      }
    })

    return {
      memberNurses,
      groupCount,
      updateGroup,
      isLoaded
    }
  }
}
</script>

<style scoped>
.staff-management {
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
</style>