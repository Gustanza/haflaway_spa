<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import {
    EnvelopeIcon,
    UsersIcon,
    ChatBubbleLeftRightIcon,
    QrCodeIcon,
    CurrencyDollarIcon,
    PhotoIcon,
    DevicePhoneMobileIcon,
    RocketLaunchIcon,
    MicrophoneIcon,
    SwatchIcon,
    BuildingLibraryIcon,
    MusicalNoteIcon,
    CameraIcon,
    CakeIcon,
    Bars3Icon,
    XMarkIcon,
    ArrowRightIcon,
    ArrowUpRightIcon,
    MapPinIcon,
    CalendarDaysIcon,
} from '@heroicons/vue/24/outline';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase';

// ── Motion preference ─────────────────────────────────────────────────────────
const reduceMotion = ref(false);

// ── Nav ───────────────────────────────────────────────────────────────────────
const navOpen = ref(false);
const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#process' },
    { label: 'Stories', href: '#stories' },
];

const goToSection = (href) => {
    navOpen.value = false;
    document.querySelector(href)?.scrollIntoView({
        behavior: reduceMotion.value ? 'auto' : 'smooth',
        block: 'start',
    });
};

// ── Data ──────────────────────────────────────────────────────────────────────
const occasions = ['Weddings', 'Kitchen parties', 'Sendoffs', 'Celebrations'];

const features = [
    {
        icon: EnvelopeIcon, title: 'Invitations worth keeping',
        desc: 'Choose a card, add your photograph and a QR code, and send it over WhatsApp or SMS. No printer, no courier, no reprints when the list changes.',
        tags: ['Card templates', 'QR codes', 'Save the date'],
    },
    {
        icon: UsersIcon, title: 'Your guest list, alive',
        desc: 'Import from Excel, CSV or your contacts. Every guest carries a status you can see at a glance — invited, confirmed, arrived.',
        tags: ['Excel & CSV', 'Live status', 'Bulk send'],
    },
    {
        icon: QrCodeIcon, title: 'A gate that flows',
        desc: 'Scan guests in at the door in real time, across as many entrances as the venue needs. Nobody queues, nobody argues about the list.',
        tags: ['Multi-entrance', 'Live count', 'Offline tolerant'],
    },
    {
        icon: CurrencyDollarIcon, title: 'Every contribution, counted',
        desc: 'Record pledges and payments as they arrive. The number stays right whether you are at the venue or three cities away.',
        tags: ['Pledges', 'Payments', 'Full summary'],
    },
    {
        icon: ChatBubbleLeftRightIcon, title: 'WhatsApp & SMS',
        desc: 'Invitations, reminders and thank-you notes go out together, on the channels your guests actually read. Email optional.',
        tags: ['Bulk send', 'Templates', 'Receipts'],
    },
    {
        icon: PhotoIcon, title: 'The day, kept',
        desc: 'Gather photographs and video from everyone who came, in one place, then share the whole set back with them.',
        tags: ['Photo & video', 'Guest uploads', 'Downloads'],
    },
];

const steps = [
    { n: 'I', icon: DevicePhoneMobileIcon, title: 'Create your event', desc: 'Name, date, venue and a cover photograph. A few minutes, no more.' },
    { n: 'II', icon: EnvelopeIcon, title: 'Design the invitation', desc: 'Pick a card, add the QR code, and it is ready for every guest.' },
    { n: 'III', icon: UsersIcon, title: 'Bring your guest list', desc: 'Excel, CSV or phone contacts. Send to everyone in one action.' },
    { n: 'IV', icon: QrCodeIcon, title: 'Welcome them at the gate', desc: 'Your team scans guests in live, at every entrance, as they arrive.' },
    { n: 'V', icon: CurrencyDollarIcon, title: 'Follow every contribution', desc: 'Pledges and payments, reconciled as they come in.' },
];

const services = [
    { icon: MicrophoneIcon, label: 'MCs' },
    { icon: SwatchIcon, label: 'Decorators' },
    { icon: BuildingLibraryIcon, label: 'Venues' },
    { icon: MusicalNoteIcon, label: 'Artists' },
    { icon: CameraIcon, label: 'Photographers' },
    { icon: CakeIcon, label: 'Catering' },
];

const stories = [
    {
        quote: 'We welcomed four hundred guests and not one paper card. The gate moved faster than any wedding I have been to.',
        name: 'Amina & Said Juma', role: 'Wedding · Dar es Salaam',
    },
    {
        quote: 'Contributions used to be a notebook and an argument. Now the number is simply there, and it is right.',
        name: 'Fatma Omar', role: 'Kitchen party · Arusha',
    },
    {
        quote: 'I ran the sendoff from Mwanza while the family was in Dodoma. Everyone was looking at the same list.',
        name: 'John Makwela', role: 'Sendoff · Mwanza',
    },
];

const checkpoints = [
    { name: 'Main Entrance', scanned: 182, total: 247 },
    { name: 'VIP Entrance', scanned: 41, total: 60 },
];

const stats = ref([
    { key: 'guests', value: null, label: 'Guests welcomed' },
    { key: 'events', value: null, label: 'Events hosted' },
    { key: 'checkin', value: '98%', label: 'Check-in rate' },
    { key: 'paper', value: '0', label: 'Paper cards' },
]);

let observer = null;
let motionQuery = null;
const onMotionChange = (e) => { reduceMotion.value = e.matches; };

onMounted(async () => {
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduceMotion.value = motionQuery.matches;
    motionQuery.addEventListener('change', onMotionChange);

    observer = new IntersectionObserver(
        (entries) => entries.forEach((el) => {
            if (el.isIntersecting) {
                el.target.classList.add('is-visible');
                observer.unobserve(el.target);
            }
        }),
        { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    const fmt = (n) => n.toLocaleString();
    try {
        const [attendeesSnap, eventsSnap] = await Promise.all([
            getCountFromServer(collection(db, 'attendeeProfiles')),
            getCountFromServer(collection(db, 'events')),
        ]);
        stats.value[0].value = fmt(attendeesSnap.data().count);
        stats.value[1].value = fmt(eventsSnap.data().count);
    } catch (e) {
        stats.value[0].value = '10,000';
        stats.value[1].value = '500';
    }
});

onUnmounted(() => {
    observer?.disconnect();
    motionQuery?.removeEventListener('change', onMotionChange);
});
</script>

<template>
    <div class="hf">

        <a href="#main" class="skip">Skip to main content</a>

        <!-- ░░ NAV ░░ -->
        <header class="nav">
            <div class="shell nav-bar">
                <button class="mark" @click="$router.push('/')">
                    <img src="/src/assets/icon-512.png" alt="" width="30" height="30" />
                    <span>Haflaway</span>
                </button>

                <nav class="nav-links" aria-label="Primary">
                    <a v-for="l in navLinks" :key="l.href" :href="l.href" @click.prevent="goToSection(l.href)">{{ l.label }}</a>
                    <a @click="$router.push('/pricing')" class="is-link">Pricing</a>
                </nav>

                <div class="nav-end">
                    <a href="https://wa.me/255625689904" target="_blank" rel="noopener" class="btn btn-line btn-sm">
                        Contact us
                    </a>
                    <button class="nav-burger" :aria-expanded="navOpen" aria-controls="mnav"
                        :aria-label="navOpen ? 'Close menu' : 'Open menu'" @click="navOpen = !navOpen">
                        <XMarkIcon v-if="navOpen" class="size-5" />
                        <Bars3Icon v-else class="size-5" />
                    </button>
                </div>
            </div>

            <div v-show="navOpen" id="mnav" class="mnav">
                <a v-for="l in navLinks" :key="l.href" :href="l.href" @click.prevent="goToSection(l.href)">
                    {{ l.label }}<ArrowRightIcon class="size-4" aria-hidden="true" />
                </a>
                <a @click="navOpen = false; $router.push('/pricing')">
                    Pricing<ArrowRightIcon class="size-4" aria-hidden="true" />
                </a>
            </div>
        </header>

        <main id="main">

            <!-- ╔══════════════════════════════════════════════════════════╗ -->
            <!-- ║  HERO — centred and formal, the way an invitation is     ║ -->
            <!-- ╚══════════════════════════════════════════════════════════╝ -->
            <section class="shell hero">
                <p class="occasions">
                    <span v-for="(o, i) in occasions" :key="o">
                        {{ o }}<i v-if="i < occasions.length - 1" aria-hidden="true">·</i>
                    </span>
                </p>

                <h1 class="h-hero">
                    Every guest
                    <span class="script">remembered</span>
                </h1>

                <!-- Ornamental rule — an SVG motif, so it scales and takes theme
                     colour. Decorative only, hidden from assistive tech. -->
                <svg class="orn" viewBox="0 0 200 14" aria-hidden="true" focusable="false">
                    <line x1="0" y1="7" x2="78" y2="7" />
                    <circle cx="85" cy="7" r="2" />
                    <path d="M100 1.5 L105.5 7 L100 12.5 L94.5 7 Z" />
                    <circle cx="115" cy="7" r="2" />
                    <line x1="122" y1="7" x2="200" y2="7" />
                </svg>

                <p class="lede">
                    Haflaway carries the whole occasion — invitations with QR codes, the guest list,
                    a gate that flows, and every contribution counted — from one place.
                </p>

                <div class="actions actions-center">
                    <button class="btn btn-solid" @click="$router.push('/events')">
                        Start planning
                        <ArrowRightIcon class="size-4" aria-hidden="true" />
                    </button>
                    <a href="https://wa.me/255625689904" target="_blank" rel="noopener" class="btn btn-line">
                        <ChatBubbleLeftRightIcon class="size-4" aria-hidden="true" />
                        Talk to us
                    </a>
                </div>

                <!-- The product, dressed as the thing it makes: an invitation card -->
                <aside class="invite reveal" aria-label="Example event dashboard">
                    <div class="invite-inner">
                        <p class="invite-kicker">Live event</p>
                        <h2 class="invite-title">Amina <span class="amp">&amp;</span> Said Juma</h2>

                        <svg class="orn orn-sm" viewBox="0 0 200 14" aria-hidden="true" focusable="false">
                            <line x1="20" y1="7" x2="86" y2="7" />
                            <path d="M100 2 L105 7 L100 12 L95 7 Z" />
                            <line x1="114" y1="7" x2="180" y2="7" />
                        </svg>

                        <p class="invite-meta">
                            <span><CalendarDaysIcon class="size-4" aria-hidden="true" />Ijumaa, 14 June · 14:00</span>
                            <span><MapPinIcon class="size-4" aria-hidden="true" />Dar es Salaam</span>
                        </p>

                        <div class="invite-figures">
                            <div class="fig">
                                <p class="fig-label">Contributions</p>
                                <p class="figure">2,400,000<span class="unit">TZS</span></p>
                                <div class="bar"><span style="width:75%"></span></div>
                                <p class="fine">75% of the 3,200,000 goal</p>
                            </div>
                            <div class="fig">
                                <p class="fig-label">Invitations</p>
                                <p class="figure">247</p>
                                <div class="bar"><span style="width:100%"></span></div>
                                <p class="fine">Delivered over WhatsApp</p>
                            </div>
                        </div>

                        <div class="invite-cp">
                            <p class="fig-label">At the gate</p>
                            <ul>
                                <li v-for="cp in checkpoints" :key="cp.name">
                                    <span>{{ cp.name }}</span>
                                    <span class="cp-count">{{ cp.scanned }}<i>/{{ cp.total }}</i></span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </aside>
            </section>

            <!-- ── STATS ────────────────────────────────────────────────── -->
            <section class="shell band">
                <dl class="stats">
                    <div v-for="s in stats" :key="s.key" class="stat reveal">
                        <dd class="figure figure-lg">
                            <span v-if="s.value">{{ s.value }}</span>
                            <span v-else class="skel" aria-label="Loading"></span>
                        </dd>
                        <dt class="stat-label">{{ s.label }}</dt>
                    </div>
                </dl>
            </section>

            <!-- ╔══════════════════════════════════════════════════════════╗ -->
            <!-- ║  FEATURES                                                ║ -->
            <!-- ╚══════════════════════════════════════════════════════════╝ -->
            <section id="features" class="shell sec">
                <div class="sec-head">
                    <p class="kicker">What Haflaway carries</p>
                    <h2 class="h-sec">Everything the day asks of you,<br /><span class="script script-inline">in one place</span></h2>
                </div>

                <ul class="cards">
                    <li v-for="(f, i) in features" :key="f.title" class="card reveal" :style="{ '--d': `${i * 60}ms` }">
                        <span class="card-badge"><component :is="f.icon" class="size-6" aria-hidden="true" /></span>
                        <h3 class="h-item">{{ f.title }}</h3>
                        <p class="body">{{ f.desc }}</p>
                        <ul class="tags">
                            <li v-for="t in f.tags" :key="t">{{ t }}</li>
                        </ul>
                    </li>
                </ul>
            </section>

            <!-- ╔══════════════════════════════════════════════════════════╗ -->
            <!-- ║  PROCESS                                                 ║ -->
            <!-- ╚══════════════════════════════════════════════════════════╝ -->
            <section id="process" class="shell sec">
                <div class="sec-head">
                    <p class="kicker">How it works</p>
                    <h2 class="h-sec">Five steps,<br /><span class="script script-inline">start to gate</span></h2>
                </div>

                <ol class="steps">
                    <li v-for="(s, i) in steps" :key="s.n" class="step reveal" :style="{ '--d': `${i * 60}ms` }">
                        <span class="step-n">{{ s.n }}</span>
                        <div class="step-body">
                            <h3 class="h-item step-title">{{ s.title }}</h3>
                            <p class="body">{{ s.desc }}</p>
                        </div>
                        <component :is="s.icon" class="size-5 step-icon" aria-hidden="true" />
                    </li>
                </ol>
            </section>

            <!-- ╔══════════════════════════════════════════════════════════╗ -->
            <!-- ║  STORIES                                                 ║ -->
            <!-- ╚══════════════════════════════════════════════════════════╝ -->
            <section id="stories" class="shell sec">
                <div class="sec-head">
                    <p class="kicker">Stories</p>
                    <h2 class="h-sec">The people who<br /><span class="script script-inline">ran the day</span></h2>
                </div>

                <ul class="stories">
                    <li v-for="(t, i) in stories" :key="t.name">
                        <figure class="story reveal" :style="{ '--d': `${i * 70}ms` }">
                            <span class="quote-glyph" aria-hidden="true">&rdquo;</span>
                            <blockquote><p class="story-text">{{ t.quote }}</p></blockquote>
                            <figcaption class="story-by">
                                <span class="avatar" aria-hidden="true">{{ t.name[0] }}</span>
                                <span>
                                    <span class="story-name">{{ t.name }}</span>
                                    <span class="story-role">{{ t.role }}</span>
                                </span>
                            </figcaption>
                        </figure>
                    </li>
                </ul>

                <!-- Service providers -->
                <div class="svc reveal">
                    <div class="svc-copy">
                        <span class="card-badge"><RocketLaunchIcon class="size-6" aria-hidden="true" /></span>
                        <h3 class="h-item">Hands you can trust</h3>
                        <p class="body">We connect you with MCs, decorators, venues, artists, photographers and
                            caterers we have already worked with.</p>
                    </div>
                    <ul class="svc-grid">
                        <li v-for="s in services" :key="s.label">
                            <component :is="s.icon" class="size-5" aria-hidden="true" />
                            <span>{{ s.label }}</span>
                        </li>
                    </ul>
                </div>
            </section>

            <!-- ── CTA ──────────────────────────────────────────────────── -->
            <section class="shell sec">
                <div class="cta reveal">
                    <p class="invite-kicker">Your turn</p>
                    <h2 class="h-hero cta-title">
                        Let us carry
                        <span class="script">the day</span>
                    </h2>
                    <svg class="orn orn-sm" viewBox="0 0 200 14" aria-hidden="true" focusable="false">
                        <line x1="20" y1="7" x2="86" y2="7" />
                        <path d="M100 2 L105 7 L100 12 L95 7 Z" />
                        <line x1="114" y1="7" x2="180" y2="7" />
                    </svg>
                    <p class="lede">Join the organisers using Haflaway to make their weddings, sendoffs and
                        kitchen parties worth remembering.</p>
                    <div class="actions actions-center">
                        <button class="btn btn-solid btn-lg" @click="$router.push('/events')">
                            Start free today
                            <ArrowRightIcon class="size-4" aria-hidden="true" />
                        </button>
                        <a href="https://wa.me/255625689904" target="_blank" rel="noopener" class="btn btn-line btn-lg">
                            <ChatBubbleLeftRightIcon class="size-4" aria-hidden="true" />
                            WhatsApp us
                        </a>
                    </div>
                </div>
            </section>
        </main>

        <!-- ░░ FOOTER ░░ -->
        <footer class="foot">
            <div class="shell foot-grid">
                <div class="foot-brand">
                    <button class="mark" @click="$router.push('/')">
                        <img src="/src/assets/icon-512.png" alt="" width="30" height="30" />
                        <span>Haflaway</span>
                    </button>
                    <p class="fine">Invitations, guests and contributions,<br />carried from one place.</p>
                </div>

                <nav class="foot-col" aria-label="Product">
                    <p class="foot-head">Product</p>
                    <a href="#features" @click.prevent="goToSection('#features')">Features</a>
                    <a href="#process" @click.prevent="goToSection('#process')">How it works</a>
                    <a @click="$router.push('/pricing')">Pricing</a>
                </nav>

                <nav class="foot-col" aria-label="Company">
                    <p class="foot-head">Company</p>
                    <a href="/privacy">Privacy</a>
                    <a href="/terms">Terms</a>
                    <a href="https://wa.me/255625689904" target="_blank" rel="noopener">
                        Support <ArrowUpRightIcon class="size-3" aria-hidden="true" />
                    </a>
                </nav>

                <p class="foot-note">© 2026 Haflaway<br />Dar es Salaam, Tanzania</p>
            </div>
        </footer>
    </div>
</template>

<style scoped>
/* ══════════════════════════════════════════════════════════════════════════════
   BURGUNDY & CHAMPAGNE
   Ivory stock, deep wine accent, champagne ornament — the evening-wedding
   register. Symmetric and centred rather than asymmetric: an invitation is a
   formal object, and the layout borrows that posture.

   Scoped to .hf so none of it reaches the ~24 views still reading the
   gold/navy tokens in style.css.

   Contrast, measured not assumed — on ivory #FAF7F2:
     ink       #2A1F22 → 14.9:1  (AAA)
     muted     #6E5D62 →  5.8:1
     burgundy  #7A2233 →  9.3:1   white on burgundy → 10.0:1
     gold      #8A6420 →  5.0:1   white on gold      →  7.2:1
   --champagne #B08A3E is 3.0:1 — ornament and large display only, never body
   text. Keep it out of anything under 24px.
   ══════════════════════════════════════════════════════════════════════════════ */
.hf {
    --ivory: #FAF7F2;
    --ivory-2: #F3EDE4;
    --card: #FFFFFF;
    --ink: #2A1F22;
    --muted: #6E5D62;
    --burgundy: #7A2233;
    --burgundy-deep: #5E1A27;
    --gold: #8A6420;
    --champagne: #B08A3E;
    --line: #EAE0D4;
    --line-strong: #DCCDBA;

    --u: 8px;
    --sec-y: 104px;

    --serif: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
    --script: 'Great Vibes', 'Cormorant Garamond', cursive;
    --sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

    --shadow: 0 1px 2px rgba(74, 52, 40, .05), 0 8px 28px rgba(74, 52, 40, .07);
    --shadow-lift: 0 2px 4px rgba(74, 52, 40, .06), 0 16px 44px rgba(74, 52, 40, .12);

    min-height: 100vh;
    min-height: 100dvh;
    overflow-x: hidden;
    background: var(--ivory);
    color: var(--ink);
    font-family: var(--sans);
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
}
@media (min-width: 768px) { .hf { --sec-y: 136px; } }

.hf :focus-visible { outline: 2px solid var(--burgundy); outline-offset: 3px; border-radius: 4px; }

.shell { max-width: 1140px; margin-inline: auto; padding-inline: 20px; }
@media (min-width: 768px) { .shell { padding-inline: 40px; } }

.skip {
    position: absolute; left: -9999px; top: var(--u); z-index: 200;
    padding: 12px 20px; border-radius: 999px;
    background: var(--burgundy); color: #fff; font-weight: 600;
}
.skip:focus { left: 20px; }

/* ── Type ─────────────────────────────────────────────────────────────────── */
.h-hero {
    margin: 0;
    font-family: var(--serif);
    font-size: clamp(2.75rem, 7vw, 5rem);
    font-weight: 500;
    letter-spacing: -.015em;
    line-height: 1.05;
    text-wrap: balance;
}
.h-sec {
    margin: 0;
    font-family: var(--serif);
    font-size: clamp(2rem, 4.4vw, 3.125rem);
    font-weight: 500;
    letter-spacing: -.01em;
    line-height: 1.12;
}
.h-item {
    margin: 0 0 calc(var(--u) * 1.5);
    font-family: var(--serif);
    font-size: 1.5rem; font-weight: 600; letter-spacing: -.005em; line-height: 1.2;
}

/* Great Vibes is a script. It appears only at display size, never in UI, never
   in body copy, and never below 2rem — below that it stops being readable. */
.script {
    display: block;
    font-family: var(--script);
    font-weight: 400;
    font-size: 1.32em;
    line-height: 1.25;
    letter-spacing: .01em;
    color: var(--burgundy);
    /* Script ascenders and descenders overrun the em box — this keeps the
       flourishes from being clipped by the parent's overflow. */
    padding: .08em .12em .18em;
    margin-top: -.06em;
}
.script-inline { display: inline-block; font-size: 1.18em; }

.lede {
    margin: 0 auto calc(var(--u) * 4);
    font-size: 1.125rem; line-height: 1.7; color: var(--muted);
    max-width: 52ch;
}
.body { margin: 0; font-size: .9688rem; line-height: 1.7; color: var(--muted); }
.fine { margin: 0; font-size: .8125rem; line-height: 1.6; color: var(--muted); }

.kicker, .invite-kicker, .foot-head {
    margin: 0 0 calc(var(--u) * 2);
    font-family: var(--sans);
    font-size: .75rem; font-weight: 600;
    letter-spacing: .2em; text-transform: uppercase;
    color: var(--gold);
}

.figure {
    margin: 0;
    font-family: var(--serif);
    font-size: 2.25rem; font-weight: 600; letter-spacing: -.01em; line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--ink);
}
.figure-lg { font-size: clamp(2.75rem, 5.5vw, 4rem); }
.unit {
    margin-left: 8px;
    font-family: var(--sans); font-size: .75rem; font-weight: 600;
    letter-spacing: .12em; color: var(--gold);
}

/* ── Ornament ─────────────────────────────────────────────────────────────── */
.orn {
    display: block; width: 100%; max-width: 260px; height: auto;
    margin: calc(var(--u) * 3) auto;
    stroke: var(--champagne); stroke-width: 1;
    fill: var(--champagne);
}
.orn line { stroke: var(--champagne); }
.orn-sm { max-width: 180px; margin-block: calc(var(--u) * 2.5); }

/* ── Nav ──────────────────────────────────────────────────────────────────── */
.nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(250, 247, 242, .9);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--line);
}
.nav-bar { display: flex; align-items: center; justify-content: space-between; gap: 24px; min-height: 76px; }

.mark {
    display: inline-flex; align-items: center; gap: 11px;
    padding: 6px; margin-left: -6px;
    background: none; border: 0; cursor: pointer;
    font-family: var(--serif); font-size: 1.375rem; font-weight: 600;
    letter-spacing: .005em; color: var(--ink);
}
.mark img { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; border: 1px solid var(--line-strong); }

.nav-links { display: none; align-items: center; gap: 4px; }
@media (min-width: 900px) { .nav-links { display: flex; } }
.nav-links a {
    display: inline-flex; align-items: center; min-height: 44px; padding: 0 15px;
    border-radius: 999px;
    font-size: .9375rem; font-weight: 500; color: var(--muted);
    cursor: pointer; transition: color .2s ease, background .2s ease;
}
.nav-links a:hover { color: var(--ink); background: var(--ivory-2); }
.nav-links .is-link { color: var(--burgundy); }

.nav-end { display: flex; align-items: center; gap: var(--u); }
.nav-burger {
    display: inline-flex; align-items: center; justify-content: center;
    width: 44px; height: 44px; border-radius: 999px;
    border: 1px solid var(--line-strong); background: transparent; color: var(--ink);
    cursor: pointer;
}
@media (min-width: 900px) { .nav-burger { display: none; } }

.mnav { border-top: 1px solid var(--line); padding: 0 20px 8px; }
@media (min-width: 900px) { .mnav { display: none !important; } }
.mnav a {
    display: flex; align-items: center; justify-content: space-between;
    min-height: 56px; border-bottom: 1px solid var(--line);
    font-size: 1.0625rem; font-weight: 500; color: var(--ink); cursor: pointer;
}
.mnav a:last-child { border-bottom: 0; }

/* ── Buttons ──────────────────────────────────────────────────────────────── */
.btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    min-height: 52px; padding: 0 28px;
    border: 1px solid transparent; border-radius: 999px;
    font-family: var(--sans); font-size: .9375rem; font-weight: 600; line-height: 1;
    cursor: pointer; white-space: nowrap;
    transition: background .2s ease, color .2s ease, border-color .2s ease,
                box-shadow .25s ease, transform .15s ease;
}
.btn:active { transform: scale(.98); }

/* White on burgundy = 10.0:1 */
.btn-solid { background: var(--burgundy); color: #fff; box-shadow: 0 6px 20px rgba(122, 34, 51, .24); }
.btn-solid:hover { background: var(--burgundy-deep); box-shadow: 0 10px 30px rgba(122, 34, 51, .32); }

.btn-line { border-color: var(--line-strong); color: var(--ink); background: transparent; }
.btn-line:hover { border-color: var(--burgundy); color: var(--burgundy); background: var(--card); }

.btn-sm { min-height: 44px; padding: 0 20px; font-size: .875rem; }
.btn-lg { min-height: 58px; padding: 0 34px; font-size: 1rem; }

.actions { display: flex; flex-direction: column; gap: 12px; }
@media (min-width: 480px) { .actions { flex-direction: row; } }
.actions-center { justify-content: center; }

/* ── Hero ─────────────────────────────────────────────────────────────────── */
.hero { padding-top: calc(var(--u) * 9); padding-bottom: var(--sec-y); text-align: center; }

.occasions {
    display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;
    margin: 0 0 calc(var(--u) * 3);
    font-size: .8125rem; font-weight: 500; letter-spacing: .16em; text-transform: uppercase;
    color: var(--muted);
}
.occasions i { margin-left: 10px; font-style: normal; color: var(--champagne); }

/* ── Invitation card ──────────────────────────────────────────────────────── */
.invite {
    max-width: 620px;
    margin: calc(var(--u) * 8) auto 0;
    padding: 6px;
    border: 1px solid var(--line-strong);
    border-radius: 4px;
    background: var(--card);
    box-shadow: var(--shadow-lift);
    text-align: left;
}
/* The inner hairline gives the double-rule of an engraved card */
.invite-inner {
    padding: calc(var(--u) * 5) calc(var(--u) * 3);
    border: 1px solid var(--line);
    border-radius: 2px;
}
@media (min-width: 640px) { .invite-inner { padding: calc(var(--u) * 6) calc(var(--u) * 5); } }

.invite-kicker { text-align: center; }
.invite-title {
    margin: 0; text-align: center;
    font-family: var(--serif);
    font-size: clamp(1.875rem, 4.5vw, 2.625rem);
    font-weight: 500; letter-spacing: -.005em; line-height: 1.15;
}
.invite-title .amp { font-family: var(--script); font-size: 1.15em; color: var(--burgundy); padding-inline: 2px; }

.invite-meta {
    display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 24px;
    margin: 0 0 calc(var(--u) * 5);
    font-size: .875rem; color: var(--muted);
}
.invite-meta span { display: inline-flex; align-items: center; gap: 7px; }
.invite-meta svg { color: var(--champagne); }

.invite-figures {
    display: grid; grid-template-columns: 1fr; gap: calc(var(--u) * 4);
    padding-block: calc(var(--u) * 4);
    border-block: 1px solid var(--line);
}
@media (min-width: 560px) { .invite-figures { grid-template-columns: 1fr 1fr; gap: calc(var(--u) * 5); } }
.fig { display: flex; flex-direction: column; gap: 10px; }
.fig-label {
    margin: 0;
    font-size: .75rem; font-weight: 600; letter-spacing: .18em; text-transform: uppercase;
    color: var(--muted);
}
.bar { height: 3px; border-radius: 999px; background: var(--ivory-2); overflow: hidden; }
.bar span { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--burgundy), var(--champagne)); }

.invite-cp { padding-top: calc(var(--u) * 4); }
.invite-cp ul { list-style: none; margin: calc(var(--u) * 1.5) 0 0; padding: 0; }
.invite-cp li {
    display: flex; align-items: center; justify-content: space-between;
    padding: calc(var(--u) * 1.5) 0;
    border-bottom: 1px solid var(--line);
    font-size: .9375rem;
}
.invite-cp li:last-child { border-bottom: 0; padding-bottom: 0; }
.cp-count { font-variant-numeric: tabular-nums; font-weight: 600; }
.cp-count i { font-style: normal; font-weight: 400; color: var(--muted); }

/* ── Stats ────────────────────────────────────────────────────────────────── */
.band { padding-block: var(--sec-y); border-top: 1px solid var(--line); }
.stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: calc(var(--u) * 6) calc(var(--u) * 3); margin: 0; }
@media (min-width: 768px) { .stats { grid-template-columns: repeat(4, 1fr); } }
.stat { text-align: center; }
.stat-label {
    margin-top: 10px;
    font-size: .75rem; font-weight: 600; letter-spacing: .16em; text-transform: uppercase;
    color: var(--muted);
}
.skel {
    display: inline-block; width: 4ch; height: .7em; border-radius: 999px;
    background: linear-gradient(90deg, var(--ivory-2) 25%, #E8DCCB 50%, var(--ivory-2) 75%);
    background-size: 200% 100%;
    animation: skel 1.4s linear infinite;
}
@keyframes skel { to { background-position: -200% 0; } }

/* ── Sections ─────────────────────────────────────────────────────────────── */
.sec { padding-block: var(--sec-y); border-top: 1px solid var(--line); }
.sec-head { max-width: 40ch; margin: 0 auto calc(var(--u) * 8); text-align: center; }

/* ── Feature cards ────────────────────────────────────────────────────────── */
.cards {
    list-style: none; margin: 0; padding: 0;
    display: grid; grid-template-columns: 1fr; gap: calc(var(--u) * 3);
}
@media (min-width: 640px) { .cards { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .cards { grid-template-columns: repeat(3, 1fr); } }

.card {
    display: flex; flex-direction: column;
    padding: calc(var(--u) * 4);
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--card);
    box-shadow: var(--shadow);
    transition: box-shadow .3s ease, transform .3s ease, border-color .3s ease;
}
.card:hover { box-shadow: var(--shadow-lift); transform: translateY(-3px); border-color: var(--line-strong); }

.card-badge {
    display: inline-flex; align-items: center; justify-content: center;
    width: 54px; height: 54px; margin-bottom: calc(var(--u) * 3);
    border-radius: 50%;
    background: var(--ivory); border: 1px solid var(--line);
    color: var(--burgundy);
}

.tags { list-style: none; margin: calc(var(--u) * 3) 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.tags li {
    padding: 5px 12px; border-radius: 999px;
    background: var(--ivory); border: 1px solid var(--line);
    font-size: .75rem; font-weight: 600; letter-spacing: .05em; color: var(--gold);
}

/* ── Steps ────────────────────────────────────────────────────────────────── */
.steps { list-style: none; margin: 0 auto; padding: 0; max-width: 780px; }
.step {
    display: flex; align-items: flex-start; gap: calc(var(--u) * 3);
    padding: calc(var(--u) * 3.5) 0;
    border-bottom: 1px solid var(--line);
}
.step:first-child { border-top: 1px solid var(--line); }
.step-n {
    flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    width: 52px; height: 52px; border-radius: 50%;
    background: var(--card); border: 1px solid var(--line-strong);
    font-family: var(--serif); font-size: 1.0625rem; font-weight: 600; letter-spacing: .04em;
    color: var(--burgundy);
}
.step-body { flex: 1; }
.step-title { font-size: 1.25rem; margin-bottom: 6px; }
.step-icon { flex-shrink: 0; margin-top: 14px; color: var(--champagne); }
@media (max-width: 639px) { .step-icon { display: none; } }

/* ── Stories ──────────────────────────────────────────────────────────────── */
.stories {
    list-style: none; margin: 0 0 calc(var(--u) * 10); padding: 0;
    display: grid; grid-template-columns: 1fr; gap: calc(var(--u) * 3);
}
@media (min-width: 900px) { .stories { grid-template-columns: repeat(3, 1fr); } }

.story {
    position: relative; height: 100%; margin: 0;
    display: flex; flex-direction: column; justify-content: space-between; gap: calc(var(--u) * 4);
    padding: calc(var(--u) * 4);
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--card);
    box-shadow: var(--shadow);
}
.quote-glyph {
    position: absolute; top: 10px; right: 22px;
    font-family: var(--serif); font-size: 4.5rem; line-height: 1;
    color: var(--line-strong);
}
.story blockquote { position: relative; margin: 0; }
.story-text {
    margin: 0;
    font-family: var(--serif);
    font-size: 1.3125rem; font-weight: 400; line-height: 1.45;
    color: var(--ink); text-wrap: pretty;
}
.story-by { display: flex; align-items: center; gap: 12px; }
.avatar {
    display: inline-flex; align-items: center; justify-content: center;
    width: 42px; height: 42px; flex-shrink: 0; border-radius: 50%;
    background: var(--ivory); border: 1px solid var(--line);
    font-family: var(--serif); font-size: 1.125rem; font-weight: 600; color: var(--burgundy);
}
.story-name { display: block; font-size: .9375rem; font-weight: 600; }
.story-role { display: block; font-size: .75rem; letter-spacing: .06em; color: var(--muted); }

/* ── Service providers ────────────────────────────────────────────────────── */
.svc {
    display: grid; grid-template-columns: 1fr; gap: calc(var(--u) * 5); align-items: center;
    padding: calc(var(--u) * 5);
    border: 1px solid var(--line);
    border-radius: 20px;
    background: var(--card);
    box-shadow: var(--shadow);
}
@media (min-width: 900px) { .svc { grid-template-columns: 5fr 7fr; gap: calc(var(--u) * 7); } }

.svc-grid {
    list-style: none; margin: 0; padding: 0;
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
}
@media (min-width: 560px) { .svc-grid { grid-template-columns: repeat(3, 1fr); } }
.svc-grid li {
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    padding: calc(var(--u) * 2.5) 12px;
    border: 1px solid var(--line); border-radius: 12px;
    background: var(--ivory);
    font-size: .8125rem; font-weight: 600; text-align: center;
    transition: border-color .2s ease, background .2s ease;
}
.svc-grid li:hover { border-color: var(--line-strong); background: var(--ivory-2); }
.svc-grid svg { color: var(--champagne); }

/* ── CTA ──────────────────────────────────────────────────────────────────── */
.cta {
    max-width: 760px; margin-inline: auto;
    padding: calc(var(--u) * 8) calc(var(--u) * 3);
    border: 1px solid var(--line-strong);
    border-radius: 24px;
    background: var(--card);
    box-shadow: var(--shadow-lift);
    text-align: center;
}
@media (min-width: 768px) { .cta { padding: calc(var(--u) * 11) calc(var(--u) * 8); } }
.cta-title { margin-bottom: 0; }

/* ── Footer ───────────────────────────────────────────────────────────────── */
.foot { padding-block: calc(var(--u) * 8); border-top: 1px solid var(--line); }
.foot-grid {
    display: grid; grid-template-columns: 1fr; gap: calc(var(--u) * 5);
}
@media (min-width: 768px) { .foot-grid { grid-template-columns: 2fr 1fr 1fr 1.4fr; gap: calc(var(--u) * 4); } }
.foot-brand .fine { margin-top: 12px; }
.foot-col { display: flex; flex-direction: column; }
.foot-col a {
    display: inline-flex; align-items: center; gap: 4px;
    min-height: 40px;
    font-size: .9375rem; color: var(--muted); cursor: pointer;
    transition: color .2s ease;
}
.foot-col a:hover { color: var(--burgundy); }
.foot-note { margin: 0; font-size: .8125rem; line-height: 1.7; color: var(--muted); }
@media (min-width: 768px) { .foot-note { text-align: right; } }

/* ══════════════════════════════════════════════════════════════════════════════
   MOTION — a soft settle, nothing more. No parallax: it is decorative, and the
   DB flags scroll-driven effects as a High-severity motion-sensitivity issue.
   ══════════════════════════════════════════════════════════════════════════════ */
.reveal {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity .7s cubic-bezier(.16, 1, .3, 1), transform .7s cubic-bezier(.16, 1, .3, 1);
    transition-delay: var(--d, 0ms);
}
.reveal.is-visible { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
    .hf *, .hf *::before, .hf *::after {
        animation-duration: .001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: .001ms !important;
    }
    .reveal { opacity: 1 !important; transform: none !important; }
}
</style>
