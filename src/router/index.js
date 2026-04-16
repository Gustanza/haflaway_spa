import { createRouter, createWebHistory } from 'vue-router'
import Ahadi_Mchango from '../views/Ahadi_Mchango.vue'
import Landing_Page from '../views/Landing_Page.vue'
import Event_Landing from '../views/Event_Landing.vue'

const routes = [
    {
        path: '/changia/:eventId/:userId',
        name: 'Changia',
        component: Ahadi_Mchango,
    },
    {
        path: '/events/:eventId/:userId',
        name: 'EventLanding',
        component: Event_Landing,
    },
    {
        path: '/',
        name: 'Nyumbani',
        component: Landing_Page,
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

export default router