import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../firebase'
import Ahadi_Mchango from '../views/Ahadi_Mchango.vue'
import Landing_Page from '../views/Landing_Page.vue'
import Event_Landing from '../views/Event_Landing.vue'
// import DashboardLayout from '../views/dashboard/DashboardLayout.vue'
// import ManageEvents from '../views/dashboard/ManageEvents.vue'
// import ManageUsers from '../views/dashboard/ManageUsers.vue'
// import ManageCardTemplates from '../views/dashboard/ManageCardTemplates.vue'
// import DashSettings from '../views/dashboard/DashSettings.vue'
import CardTemplateGallery from '../views/CardTemplateGallery.vue'
import Pricing from '../views/Pricing.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import OrganizationSettings from '../views/OrganizationSettings.vue'
import CreateEvent from '../views/CreateEvent.vue'
import MyEvents from '../views/MyEvents.vue'
import EventLayout from '../views/event/EventLayout.vue'
import EventOverview from '../views/event/EventOverview.vue'
import EventAttendees from '../views/event/EventAttendees.vue'
import EventMessages from '../views/event/EventMessages.vue'
import EventCampaigns from '../views/event/EventCampaigns.vue'
import EventCheckins from '../views/event/EventCheckins.vue'
import EventCards from '../views/event/EventCards.vue'
import EventGallery from '../views/event/EventGallery.vue'
import EventZawadi from '../views/event/EventZawadi.vue'
import EventSettings from '../views/event/EventSettings.vue'
import EventTeam from '../views/event/EventTeam.vue'
import EventPayments from '../views/event/EventPayments.vue'
import EventBudget from '../views/event/EventBudget.vue'
import EditEvent from '../views/EditEvent.vue'

// Resolves once Firebase has restored the persisted session (or confirmed no user)
let authResolved = false
const waitForAuth = new Promise(resolve => {
    const unsub = auth.onAuthStateChanged(user => {
        unsub()
        authResolved = true
        resolve(user)
    })
})

const PROTECTED = ['/create-event', '/edit-event', '/event/', '/dashboard', '/organization']
const PROTECTED_EXACT = ['/']

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { guestOnly: true },
    },
    {
        path: '/register',
        name: 'Register',
        component: Register,
        meta: { guestOnly: true },
    },
    {
        path: '/organization',
        name: 'Organization',
        component: OrganizationSettings,
        meta: { title: 'Organization' },
    },
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
        name: 'MyEvents',
        component: MyEvents,
        meta: { title: 'My Events' },
    },
    {
        path: '/pricing',
        name: 'Pricing',
        component: Pricing,
    },
    // {
    //     path: '/dashboard',
    //     component: DashboardLayout,
    //     redirect: '/dashboard/events',
    //     children: [
    //         { path: 'events', name: 'DashEvents', component: ManageEvents, meta: { title: 'Manage Events' } },
    //         { path: 'users', name: 'DashUsers', component: ManageUsers, meta: { title: 'Manage Users' } },
    //         { path: 'card-templates', name: 'DashCardTemplates', component: ManageCardTemplates, meta: { title: 'Manage Card Templates' } },
    //         { path: 'settings', name: 'DashSettings', component: DashSettings, meta: { title: 'Settings' } },
    //     ],
    // },
    {
        path: '/create-event',
        name: 'CreateEvent',
        component: CreateEvent,
        meta: { title: 'Create Event' },
    },
    {
        path: '/edit-event/:eventId',
        name: 'EditEvent',
        component: EditEvent,
        meta: { title: 'Edit Event' },
    },
    {
        path: '/event/:eventId',
        component: EventLayout,
        redirect: to => `/event/${to.params.eventId}/overview`,
        children: [
            { path: 'overview', name: 'EventOverview', component: EventOverview, meta: { title: 'Overview' } },
            { path: 'attendees', name: 'EventAttendees', component: EventAttendees, meta: { title: 'Invitees' } },
            { path: 'contacts', name: 'EventContacts', component: EventAttendees, meta: { title: 'Contacts' } },
            { path: 'checkins', name: 'EventCheckins', component: EventCheckins, meta: { title: 'Check-ins' } },
            { path: 'cards', name: 'EventCards', component: EventCards, meta: { title: 'Cards' } },
            { path: 'invitations', name: 'EventMessages', component: EventMessages, meta: { title: 'Invitations' } },
            { path: 'bulk-messages', name: 'EventCampaigns', component: EventCampaigns, meta: { title: 'Bulk Messages' } },
            { path: 'gallery', name: 'EventGallery', component: EventGallery, meta: { title: 'Gallery' } },
            { path: 'zawadi', name: 'EventZawadi', component: EventZawadi, meta: { title: 'Zawadi' } },
            { path: 'payments', name: 'EventPayments', component: EventPayments, meta: { title: 'Payments' } },
            { path: 'budget', name: 'EventBudget', component: EventBudget, meta: { title: 'Budget' } },
            { path: 'team', name: 'EventTeam', component: EventTeam, meta: { title: 'Team' } },
            { path: 'settings', name: 'EventSettings', component: EventSettings, meta: { title: 'Settings' } },
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

router.beforeEach(async (to) => {
    // Wait for Firebase to restore the session on first navigation
    const user = authResolved ? auth.currentUser : await waitForAuth

    const needsAuth = PROTECTED.some(prefix => to.path.startsWith(prefix)) || PROTECTED_EXACT.includes(to.path)
    const isGuestOnly = to.meta.guestOnly

    if (needsAuth && !user) {
        return { name: 'Login', query: { redirect: to.fullPath } }
    }

    if (isGuestOnly && user) {
        return { name: 'MyEvents' }
    }
})

export default router