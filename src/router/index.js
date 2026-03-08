import { createRouter, createWebHistory } from 'vue-router'
import Ahadi_Mchango from '../views/Ahadi_Mchango.vue'

const routes = [
    {
        path: '/changia/:eventId/:userId',
        name: 'Changia',
        component: Ahadi_Mchango,
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

export default router