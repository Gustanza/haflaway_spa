import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../firebase'

// Every route below is lazy-loaded (dynamic import) so Vite code-splits each
// one into its own chunk. Public, guest-facing routes (Event_Landing chief
// among them) used to be bundled statically alongside the entire admin app —
// including heavy admin-only deps like exceljs pulled in by EventMessages —
// forcing guests to download and parse the whole thing before the page could
// even mount. Lazy routes mean a guest opening an invite link only fetches
// the Event_Landing chunk.
const Ahadi_Mchango = () => import('../views/Ahadi_Mchango.vue')
const Landing_Page = () => import('../views/Landing_Page.vue')
const Event_Landing = () => import('../views/Event_Landing.vue')
const InvitationsReport = () => import('../views/InvitationsReport.vue')
const CardTemplateGallery = () => import('../views/CardTemplateGallery.vue')
const Pricing = () => import('../views/Pricing.vue')
const Login = () => import('../views/Login.vue')
const Register = () => import('../views/Register.vue')
const SelectOrganization = () => import('../views/SelectOrganization.vue')
const OrganizationSettings = () => import('../views/OrganizationSettings.vue')
const CreateEvent = () => import('../views/CreateEvent.vue')
const MyEvents = () => import('../views/MyEvents.vue')
const EventLayout = () => import('../views/event/EventLayout.vue')
const EventOverview = () => import('../views/event/EventOverview.vue')
const EventAttendees = () => import('../views/event/EventAttendees.vue')
const EventMessages = () => import('../views/event/EventMessages.vue')
const EventTemplates = () => import('../views/event/EventTemplates.vue')
const EventCampaigns = () => import('../views/event/EventCampaigns.vue')
const EventCheckins = () => import('../views/event/EventCheckins.vue')
const EventCards = () => import('../views/event/EventCards.vue')
const EventGallery = () => import('../views/event/EventGallery.vue')
const EventZawadi = () => import('../views/event/EventZawadi.vue')
const EventSettings = () => import('../views/event/EventSettings.vue')
const EventTeam = () => import('../views/event/EventTeam.vue')
const EventPayments = () => import('../views/event/EventPayments.vue')
const EventBudget = () => import('../views/event/EventBudget.vue')
const EditEvent = () => import('../views/EditEvent.vue')

// Resolves once Firebase has restored the persisted session (or confirmed no user)
let authResolved = false
const waitForAuth = new Promise(resolve => {
    const unsub = auth.onAuthStateChanged(user => {
        unsub()
        authResolved = true
        resolve(user)
    })
})

const PROTECTED = ['/create-event', '/edit-event', '/event/', '/dashboard', '/organization', '/select-org']
const PROTECTED_EXACT = ['/events']

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
        path: '/select-org',
        name: 'SelectOrganization',
        component: SelectOrganization,
        meta: { title: 'Select Organization' },
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
        path: '/invitations-report/:eventId/:token',
        name: 'InvitationsReport',
        component: InvitationsReport,
    },
    {
        path: '/',
        name: 'Landing',
        component: Landing_Page,
        meta: { title: 'Haflaway' },
    },
    {
        path: '/events',
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
            { path: 'attendees', name: 'EventAttendees', component: EventAttendees, meta: { title: 'Guest List' } },
            { path: 'contacts', name: 'EventContacts', component: EventAttendees, meta: { title: 'Contact List' } },
            { path: 'checkins', name: 'EventCheckins', component: EventCheckins, meta: { title: 'Check-ins' } },
            { path: 'cards', name: 'EventCards', component: EventCards, meta: { title: 'Cards' } },
            { path: 'invitations', name: 'EventMessages', component: EventMessages, meta: { title: 'Invitations' } },
            { path: 'bulk-messages', name: 'EventCampaigns', component: EventCampaigns, meta: { title: 'Bulk Messages' } },
            { path: 'templates', name: 'EventTemplates', component: EventTemplates, meta: { title: 'Templates' } },
            { path: 'gallery', name: 'EventGallery', component: EventGallery, meta: { title: 'Gallery' } },
            { path: 'zawadi', name: 'EventZawadi', component: EventZawadi, meta: { title: 'Zawadi' } },
            { path: 'payments', name: 'EventPayments', component: EventPayments, meta: { title: 'Payments' } },
            { path: 'budget', name: 'EventBudget', component: EventBudget, meta: { title: 'Budget' } },
            { path: 'team', name: 'EventTeam', component: EventTeam, meta: { title: 'Team' } },
            { path: 'settings', name: 'EventSettings', component: EventSettings, meta: { title: 'Settings' } },
        ],
    },
    {
        path: '/card-templates',
        name: 'CardTemplates',
        component: CardTemplateGallery,
    },
    // Old split URLs now resolve into the merged gallery, preserving type via query.
    { path: '/invitation-card-templates', redirect: () => ({ path: '/card-templates', query: { type: 'invitation' } }) },
    { path: '/contribution-card-templates', redirect: () => ({ path: '/card-templates', query: { type: 'contribution' } }) },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

router.beforeEach(async (to) => {
    const needsAuth = PROTECTED.some(prefix => to.path.startsWith(prefix)) || PROTECTED_EXACT.includes(to.path)
    const isGuestOnly = to.meta.guestOnly

    // Fully public routes (e.g. the guest event page) don't consult `user` at
    // all — skip waiting on Firebase Auth's session restore so they aren't
    // blocked behind it on first load.
    if (!needsAuth && !isGuestOnly) return

    // Wait for Firebase to restore the session on first navigation
    const user = authResolved ? auth.currentUser : await waitForAuth

    if (needsAuth && !user) {
        return { name: 'Login', query: { redirect: to.fullPath } }
    }

    if (isGuestOnly && user) {
        return { name: 'MyEvents' }
    }
})

export default router