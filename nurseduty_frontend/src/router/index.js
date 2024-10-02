import { createRouter, createWebHistory } from 'vue-router'
import FormulaSchedule from '../views/FormulaSchedule.vue'
import POR_Formula from '@/views/POR_Formula.vue'
import leader_Formula from '@/views/Leader_Formula.vue'
import Secreatary_Formula from '@/views/Secretary_Formula.vue'
import MonthlySchedule from '../views/MonthlySchedule.vue'
import WeeklySchedule from '../views/WeeklySchedule.vue'

const routes = [
  {
    path: '/formula-schedule',
    name: 'FormulaSchedule',
    component: FormulaSchedule
  },
  {
    path: '/por-formula',
    name: 'POR_Formula',
    component: POR_Formula
  },
  {
    path: '/leader-formula',
    name: 'leader_Formula',
    component: leader_Formula
  },
  {
    path: '/secretary-formula',
    name: 'Secretary_Formula',
    component: Secreatary_Formula
  },
  {
    path: '/monthly-schedule',
    name: 'MonthlySchedule',
    component: MonthlySchedule
  },
  {
    path: '/weekly-schedule',
    name: 'WeeklySchedule',
    component: WeeklySchedule
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router