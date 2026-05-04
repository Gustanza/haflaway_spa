import { createRouter, createWebHistory } from 'vue-router'
import Ahadi_Mchango from '../views/Ahadi_Mchango.vue'
import Landing_Page from '../views/Landing_Page.vue'
import Event_Landing from '../views/Event_Landing.vue'
import DashboardLayout from '../views/dashboard/DashboardLayout.vue'
import ManageEvents from '../views/dashboard/ManageEvents.vue'
import ManageUsers from '../views/dashboard/ManageUsers.vue'
import ManageCardTemplates from '../views/dashboard/ManageCardTemplates.vue'
import DashSettings from '../views/dashboard/DashSettings.vue'
import CardTemplateGallery from '../views/CardTemplateGallery.vue'

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
    {
        path: '/dashboard',
        component: DashboardLayout,
        redirect: '/dashboard/events',
        children: [
            { path: 'events', name: 'DashEvents', component: ManageEvents, meta: { title: 'Manage Events' } },
            { path: 'users', name: 'DashUsers', component: ManageUsers, meta: { title: 'Manage Users' } },
            { path: 'card-templates', name: 'DashCardTemplates', component: ManageCardTemplates, meta: { title: 'Manage Card Templates' } },
            { path: 'settings', name: 'DashSettings', component: DashSettings, meta: { title: 'Settings' } },
        ],
    },
    {
        path: '/invitation-card-templates',
        name: 'InvitationTemplates',
        component: CardTemplateGallery,
        props: { type: 'invitation' },
    },
    {
        path: '/contribution-card-templates',
        name: 'ContributionTemplates',
        component: CardTemplateGallery,
        props: { type: 'contribution' },
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

export default router