import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import FormulaSchedule from '../views/FormulaSchedule.vue'
import POR_Formula from '@/views/POR_Formula.vue'
import MonthlySchedule from '../views/MonthlySchedule.vue'
import MonthlyScheduleResults from '../views/MonthlyScheduleResults.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
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
    path: '/monthly-schedule',
    name: 'MonthlySchedule',
    component: MonthlySchedule
  },
  {
    path: '/monthly-schedule-results',
    name: 'MonthlyScheduleResults',
    component: MonthlyScheduleResults
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router