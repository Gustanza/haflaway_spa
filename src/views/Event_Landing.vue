<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '@/firebase';
import { doc, onSnapshot, updateDoc, collection, addDoc, getDocs, serverTimestamp, query, where, orderBy, increment, limit, startAfter, arrayUnion, arrayRemove } from 'firebase/firestore';
import QRCode from 'qrcode';

const route = useRoute();
const eventId = computed(() => route.params.eventId);
const userId = computed(() => route.params.userId);

const eventData = ref(null);
const attendeeData = ref(null);
const loading = ref(true);
const hasError = ref(false);

// Toggle the falling-petals hero effect. One-line flag until it's worth an event setting.
const ENABLE_PETALS = true;

let unsubEvent = null, unsubAttendee = null, unsubComments = null, unsubMediaComments = null;

const startSync = () => {
    if (unsubEvent) unsubEvent();
    if (unsubAttendee) unsubAttendee();
    if (!eventId.value || !userId.value) return;

    unsubEvent = onSnapshot(doc(db, 'events', eventId.value), snap => {
        if (snap.exists()) eventData.value = { id: snap.id, ...snap.data() };
        else hasError.value = true;
        loading.value = false;
    }, () => { hasError.value = true; loading.value = false; });

    unsubAttendee = onSnapshot(doc(db, 'events', eventId.value, 'attendees', userId.value), snap => {
        if (snap.exists()) attendeeData.value = { id: snap.id, ...snap.data() };
    });

    if (unsubComments) unsubComments();
    const q = query(collection(db, 'events', eventId.value, 'comments'), orderBy('createdAt', 'desc'));
    unsubComments = onSnapshot(q, snap => {
        comments.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    });
};

// ── Hero background image (single photo — event thumbnail, else first gallery photo) ──
const heroSlides = ref([]);

const fetchHeroSlides = async () => {
    if (!eventId.value) return;
    heroSlides.value = [];
    try {
        const folderSnap = await getDocs(
            query(collection(db, 'events', eventId.value, 'galleryFolders'), orderBy('createdAt', 'asc'), limit(4))
        );
        const slides = [];
        for (const fd of folderSnap.docs) {
            if (slides.length >= 8) break;
            const mediaSnap = await getDocs(
                query(
                    collection(db, 'events', eventId.value, 'galleryFolders', fd.id, 'media'),
                    orderBy('uploadedAt', 'desc'),
                    limit(8 - slides.length)
                )
            );
            for (const d of mediaSnap.docs) {
                if (!d.data().type || d.data().type === 'image') {
                    slides.push({ id: d.id, url: d.data().url });
                }
            }
        }
        heroSlides.value = slides;
    } catch (e) { console.error('hero_fetch', e); }
};

const heroImage = computed(() => eventData.value?.heroImageUrl || eventData.value?.eventThumbnail || heroSlides.value[0]?.url || null);

// ── Hero intro video + background music (organizer-configured, optional) ──
const heroVideoEnabled = computed(() => !!(eventData.value?.heroVideoEnabled && eventData.value?.heroVideoUrl));
const heroVideoUrl = computed(() => eventData.value?.heroVideoUrl || '');
const heroMusicConfigured = computed(() => !!(eventData.value?.heroMusicEnabled && eventData.value?.heroMusicUrl));
const heroMusicUrl = computed(() => eventData.value?.heroMusicUrl || '');

// ── Scroll-reveal / parallax / petals — initialized once the page content mounts ──
let revealObserver = null;
let scrollHandler = null;
let petalInterval = null;
let introTimer = null;
let decorInited = false;
const backToTopVisible = ref(false);

// ── Video intro — only intro the page has now; nothing shows without one ───
const showVideoIntro = ref(true);
const videoIntroRef = ref(null);
const videoIntroTapHint = ref(false);
const introActive = computed(() => heroVideoEnabled.value && showVideoIntro.value);

// ── Background music (starts once the intro finishes) ──────────────────────
const heroMusicRef = ref(null);
const musicPlaying = ref(false);

const initRevealObserver = () => {
    revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('reveal-active'); });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
};

const initScrollEffects = () => {
    scrollHandler = () => {
        const bg = document.getElementById('elHeroBg');
        if (bg) bg.style.transform = `scale(1.08) translateY(${window.scrollY * 0.35}px)`;
        backToTopVisible.value = window.scrollY > 400;
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });
};

const spawnPetal = () => {
    const container = document.getElementById('elPetals');
    if (!container) return;
    if (window.scrollY > window.innerHeight) return;
    if (container.children.length > 30) return;
    const p = document.createElement('div');
    p.className = 'petal';
    const size = (Math.random() * 14 + 8) + 'px';
    p.style.width = size;
    p.style.height = size;
    p.style.left = (Math.random() * 100) + 'vw';
    p.style.opacity = Math.random() * 0.4 + 0.25;
    const fallDur = (Math.random() * 4 + 6).toFixed(2);
    const swayDur = (Math.random() * 2 + 3).toFixed(2);
    p.style.animation = `elPetalFall ${fallDur}s linear infinite, elPetalSway ${swayDur}s ease-in-out infinite`;
    container.appendChild(p);
    p.addEventListener('animationiteration', (e) => {
        if (e.animationName === 'elPetalFall') p.style.left = (Math.random() * 100) + 'vw';
    });
};

const initPetals = () => {
    for (let i = 0; i < 18; i++) spawnPetal();
    petalInterval = setInterval(spawnPetal, 900);
};

function startHeroMusic() {
    if (!heroMusicConfigured.value) return;
    const a = heroMusicRef.value;
    if (!a) return;
    a.play().then(() => { musicPlaying.value = true; }).catch(() => { musicPlaying.value = false; });
}

function toggleHeroMusic() {
    const a = heroMusicRef.value;
    if (!a) return;
    if (a.paused) {
        a.play().then(() => { musicPlaying.value = true; }).catch(() => {});
    } else {
        a.pause();
        musicPlaying.value = false;
    }
}

function revealFromIntro() {
    if (introTimer) { clearTimeout(introTimer); introTimer = null; }
    showVideoIntro.value = false;
    document.body.style.overflow = '';
    startHeroMusic();
}

function onVideoIntroEnded() {
    revealFromIntro();
}

function onVideoIntroTap() {
    const v = videoIntroRef.value;
    if (v && v.paused) {
        v.play().then(() => { videoIntroTapHint.value = false; }).catch(() => {});
    }
}

watch(eventData, async (val) => {
    if (!val || decorInited) return;
    decorInited = true;
    if (heroVideoEnabled.value) {
        document.body.style.overflow = 'hidden';
        // Safety net — reveal anyway if the video never fires `ended` (stuck
        // load, decode error, or a genuinely blocked/never-resolving play()).
        introTimer = setTimeout(revealFromIntro, 15000);
        await nextTick();
        const v = videoIntroRef.value;
        // play()'s promise is the real signal for an autoplay-policy block —
        // it resolves once playback is permitted to start, regardless of how
        // long the video takes to actually buffer, so this doesn't false-flag
        // on a slow network the way a fixed timeout + `.paused` check would.
        v?.play().catch(() => { videoIntroTapHint.value = true; });
    } else {
        await nextTick();
        startHeroMusic();
    }
    await nextTick();
    initRevealObserver();
    initScrollEffects();
    if (ENABLE_PETALS) initPetals();
});

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

// ── Countdown ────────────────────────────────────────────────────────────────
const countdown = ref({ days: '00', hours: '00', mins: '00', secs: '00' });
let countdownTimer = null;

const updateCountdown = () => {
    const target = eventData.value?.startDate ? new Date(eventData.value.startDate).getTime() : null;
    if (!target) return;
    const diff = target - Date.now();
    if (diff <= 0) {
        countdown.value = { days: '00', hours: '00', mins: '00', secs: '00' };
        return;
    }
    countdown.value = {
        days: String(Math.floor(diff / 86400000)).padStart(2, '0'),
        hours: String(Math.floor(diff / 3600000) % 24).padStart(2, '0'),
        mins: String(Math.floor(diff / 60000) % 60).padStart(2, '0'),
        secs: String(Math.floor(diff / 1000) % 60).padStart(2, '0'),
    };
};

onMounted(() => {
    // Global body background is dark (admin theme) — this page is a light,
    // ivory theme, so pin body to match while mounted or the dark color
    // flashes through on load and during elastic overscroll at the top.
    document.body.style.background = '#FAF6EF';
    startSync(); startZawadiSync(); startAllContribsSync(); fetchHeroSlides(); fetchGallery(true);
    updateCountdown();
    countdownTimer = setInterval(updateCountdown, 1000);
    // Detect return from Pesapal payment page
    if (route.query.OrderTrackingId && route.query.OrderMerchantReference) {
        giftReturnBanner.value = true;
    }
    window.addEventListener('resize', locResizeHandler);
});
watch([eventId, userId], () => {
    startSync(); startZawadiSync(); startAllContribsSync(); fetchHeroSlides(); fetchGallery(true);
});
onUnmounted(() => {
    window.removeEventListener('resize', locResizeHandler);
    if (unsubEvent) unsubEvent();
    if (unsubAttendee) unsubAttendee();
    if (unsubComments) unsubComments();
    if (unsubMediaComments) unsubMediaComments();
    if (unsubZawadi) unsubZawadi();
    if (unsubAllContribs) unsubAllContribs();
    if (unsubItemContribs) unsubItemContribs();
    if (countdownTimer) clearInterval(countdownTimer);
    if (petalInterval) clearInterval(petalInterval);
    if (introTimer) clearTimeout(introTimer);
    if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
    if (revealObserver) revealObserver.disconnect();
    document.body.style.overflow = '';
    document.body.style.background = '';
});

// ── i18n ─────────────────────────────────────────────────────────────────────
const lang = computed(() => eventData.value?.language === 'en' ? 'en' : 'sw');

const i18n = {
    en: {
        loading: 'Loading', notFound: 'Not Found',
        linkInvalid: 'This event link is invalid or expired.',
        rsvpQuestion: 'Will you be attending?',
        rsvpSub: 'Please confirm your attendance so the host can plan accordingly.',
        saving: 'Saving…', confirmAttendance: 'Confirm Attendance', decline: 'Decline',
        published: 'Published', draft: 'Draft', until: 'until',
        guestPass: 'Guest Pass', invitedGuest: 'Invited Guest', attendee: 'Attendee',
        confirmed: 'Confirmed', declined: 'Declined', pendingRsvp: 'Pending RSVP',
        tapToChange: 'Tap to change', viewCard: 'View Card',
        comments: 'Comments', reply: 'Reply', hideReplies: 'Hide replies',
        replies: n => `${n} ${n === 1 ? 'reply' : 'replies'}`,
        replyPlaceholder: 'Write a reply…', commentPlaceholder: 'Write a comment…',
        noComments: 'No comments yet. Be the first!',
        contactSupport: 'Contact Support',
        noPhotos: 'No photos yet', loadingDots: 'Loading…', loadMore: 'Load more',
        justNow: 'just now', minsAgo: n => `${n}m ago`, hoursAgo: n => `${n}h ago`,
        locale: 'en-TZ',
        openInMaps: 'Open in Maps',
        invitationPlaceholder: 'You are cordially invited to celebrate with us.',
        countdownLabel: 'Counting down to the big day',
        venueEyebrow: 'The Details',
        venueTitle: 'Venues',
        venuePlaceholderTitle: 'Venue to be announced',
        venuePlaceholderDesc: "We'll share the location here as soon as it's confirmed.",
        programmeEyebrow: 'The Day',
        programmeTitle: 'Programme',
        showMoreItems: 'Show more',
        showLessItems: 'Show less',
        foodBevEyebrow: 'The Menu',
        foodBevTitle: 'Food & Beverages',
        dressCodeEyebrow: 'What To Wear',
        dressCodeTitle: 'Dress Code',
        mcEyebrow: 'With Us Today',
        mcSectionTitle: 'Master of Ceremonies',
        contactsEyebrow: 'Need Help?',
        contactsTitle: 'Contacts',
        gallery: 'Gallery',
        hostEyebrow: 'Hosted With Love',
        hostTitle: 'You Are Our Guest',
        hostBody: "We can't wait to celebrate this moment together with the people who matter most to us.",
        entryPassTitle: 'Your Pass',
        qrHint: 'Please present this code at the entrance.',
        footerCredit: 'Made with Haflaway',
        scrollHint: 'Scroll',
    },
    sw: {
        loading: 'Inapakia', notFound: 'Haikupatikana',
        linkInvalid: 'Kiungo hiki cha tukio si halisi au kimeisha muda wake.',
        rsvpQuestion: 'Je, utahudhuria?',
        rsvpSub: 'Tafadhali thibitisha uwepo wako ili mwenyeji aweze kupanga vizuri.',
        saving: 'Inahifadhi…', confirmAttendance: 'Thibitisha Uwepo', decline: 'Kataa',
        published: 'Imechapishwa', draft: 'Rasimu', until: 'hadi',
        guestPass: 'Kibali cha Mgeni', invitedGuest: 'Mgeni Maalum', attendee: 'Mshiriki',
        confirmed: 'Imethibitishwa', declined: 'Imekataliwa', pendingRsvp: 'Jibu Linasubiri',
        tapToChange: 'Gusa Kubadilisha', viewCard: 'Angalia Kadi',
        comments: 'Maoni', reply: 'Jibu', hideReplies: 'Ficha Majibu',
        replies: n => `Majibu ${n}`,
        replyPlaceholder: 'Andika jibu…', commentPlaceholder: 'Andika maoni…',
        noComments: 'Hakuna maoni bado. Kuwa wa kwanza!',
        contactSupport: 'Wasiliana na Msaada',
        noPhotos: 'Hakuna picha bado', loadingDots: 'Inapakia…', loadMore: 'Pakia Zaidi',
        justNow: 'sasa hivi', minsAgo: n => `dak ${n}`, hoursAgo: n => `saa ${n}`,
        locale: 'sw-TZ',
        openInMaps: 'Fungua Ramani',
        invitationPlaceholder: 'Umealikwa rasmi kuja kusherehekea nasi.',
        countdownLabel: 'Kuhesabu siku zilizobaki',
        venueEyebrow: 'Maelezo',
        venueTitle: 'Maeneo',
        venuePlaceholderTitle: 'Eneo litatangazwa hivi karibuni',
        venuePlaceholderDesc: 'Tutashiriki eneo hapa mara litakapothibitishwa.',
        programmeEyebrow: 'Siku Husika',
        programmeTitle: 'Ratiba',
        showMoreItems: 'Onyesha zaidi',
        showLessItems: 'Onyesha kidogo',
        foodBevEyebrow: 'Karamu',
        foodBevTitle: 'Chakula na Vinywaji',
        dressCodeEyebrow: 'Mwongozo',
        dressCodeTitle: 'Mavazi',
        mcEyebrow: 'Leo Nasi',
        mcSectionTitle: 'Mtangazaji (MC)',
        contactsEyebrow: 'Unahitaji Usaidizi?',
        contactsTitle: 'Mawasiliano',
        gallery: 'Picha',
        hostEyebrow: 'Kwa Upendo',
        hostTitle: 'Wewe Ni Mgeni Wetu',
        hostBody: 'Hatuwezi kusubiri kusherehekea wakati huu pamoja na watu tunaowapenda zaidi.',
        entryPassTitle: 'Kibali Chako',
        qrHint: 'Tafadhali onyesha msimbo huu langoni.',
        footerCredit: 'Imetengenezwa na Haflaway',
        scrollHint: 'Sogeza',
    },
};

const t = key => (i18n[lang.value] ?? i18n.sw)[key] ?? i18n.sw[key] ?? key;
const tFn = (key, ...args) => { const fn = (i18n[lang.value] ?? i18n.sw)[key]; return typeof fn === 'function' ? fn(...args) : fn; };

// ── Computed ─────────────────────────────────────────────────────────────────
const fmtDate = iso => {
    if (!iso) return null;
    const locale = (i18n[lang.value] ?? i18n.sw).locale;
    try { return new Date(iso).toLocaleString(locale, { weekday: 'short', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return null; }
};
const startFmt = computed(() => fmtDate(eventData.value?.startDate));
const endFmt = computed(() => fmtDate(eventData.value?.endDate));

const ordinal = n => {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
const fmtVenueDateTime = iso => {
    if (!iso) return null;
    try {
        const d = new Date(iso);
        const locale = (i18n[lang.value] ?? i18n.sw).locale;
        const weekday = d.toLocaleDateString(locale, { weekday: 'long' });
        const month = d.toLocaleDateString(locale, { month: 'long' });
        const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        return `${weekday}, ${ordinal(d.getDate())} ${month} ${d.getFullYear()}, ${time}`;
    } catch { return null; }
};
const fmtTime = iso => {
    if (!iso) return null;
    try {
        const locale = (i18n[lang.value] ?? i18n.sw).locale;
        return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    } catch { return null; }
};

const attendeeName = computed(() => attendeeData.value?.fullName || 'Guest');
const attendeePhone = computed(() => attendeeData.value?.phone || '');
const attendeeInitial = computed(() => attendeeName.value.charAt(0).toUpperCase());

// ── Greeting template — organizer writes any sentence with {{username}}
// placed anywhere in it; wherever it lands, the guest's name breaks onto
// its own underlined line, with the surrounding text before/after it. ──
const GREETING_TOKEN = '{{username}}';
const greetingParts = computed(() => {
    const raw = (eventData.value?.greetingTemplate ?? '').trim();
    const template = raw.length ? raw : GREETING_TOKEN;
    const idx = template.indexOf(GREETING_TOKEN);
    if (idx === -1) return { before: template, hasName: false, after: '' };
    return {
        before: template.slice(0, idx).trim(),
        hasName: true,
        after: template.slice(idx + GREETING_TOKEN.length).trim(),
    };
});

const palette = [
    { bg: '#1A3A28', fg: '#3DAA76' }, { bg: '#1A2838', fg: '#5A8ADB' },
    { bg: '#2A1A38', fg: '#BF5AF2' }, { bg: '#38200A', fg: '#E07040' },
    { bg: '#2A2210', fg: '#E8C070' },
];
const ac = computed(() => palette[attendeeName.value.charCodeAt(0) % palette.length]);

const hasInvitation = computed(() => !!attendeeData.value?.cards?.invitation);
const cardBadge = computed(() => hasInvitation.value ? t('invitedGuest') : t('attendee'));

// ── Entry pass QR — same "https://haflaway.com/#/lv0/{eventId}/{attendeeId}"
// verification-link scheme the invitation-card renderer (functions/attendees/
// pimagen.js) already encodes into printed cards, generated client-side here
// with the same 'qrcode' library instead of round-tripping to a function. ──
const JPWEB = 'https://haflaway.com';
const qrDataUrl = ref(null);
watch([eventId, userId], async ([eid, uid]) => {
    if (!eid || !uid) { qrDataUrl.value = null; return; }
    try {
        qrDataUrl.value = await QRCode.toDataURL(`${JPWEB}/#/lv0/${eid}/${uid}`, {
            margin: 1,
            width: 320,
            color: { dark: '#241F18', light: '#FAF6EF' },
        });
    } catch (e) {
        console.error('qr_generate', e);
    }
}, { immediate: true });

// ── Gift of Love ──────────────────────────────────────────────────────────────
const showGiftSheet = ref(false);
const giftStep = ref('pick'); // 'pick' | 'note' | 'confirm' | 'done'
const giftAmount = ref(null);
const giftCustom = ref('');
const giftNote = ref('');
const giftSending = ref(false);
const selectedItem = ref(null);
const expandedDescs = ref({});

const GIFT_PRESETS = [5000, 10000, 20000, 50000];
const giftCurrency = computed(() => eventData.value?.currency || 'TZS');
const fmtMoney = (n) => Number(n).toLocaleString('en-TZ');

const AVATAR_PALETTE = [
    { bg: '#1A3A28', fg: '#3DAA76' },
    { bg: '#1A2838', fg: '#5A8ADB' },
    { bg: '#2A1A38', fg: '#BF5AF2' },
    { bg: '#38200A', fg: '#E07040' },
    { bg: '#2A2210', fg: '#E8C070' },
];
const avatarColor = (initial) => AVATAR_PALETTE[(initial || '?').charCodeAt(0) % AVATAR_PALETTE.length];

// ── Zawadi items (real-time) ──────────────────────────────────────────────────
const zawadiItems = ref([]);
let unsubZawadi = null;

const startZawadiSync = () => {
    if (unsubZawadi) unsubZawadi();
    if (!eventId.value) return;
    const q = query(
        collection(db, 'events', eventId.value, 'zawadiItems'),
        orderBy('order', 'asc')
    );
    unsubZawadi = onSnapshot(q, snap => {
        zawadiItems.value = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(item => item.isActive !== false);
    });
};

// ── All paid contributions for this event (one query, grouped client-side) ────
const allContribs = ref([]);
let unsubAllContribs = null;

const startAllContribsSync = () => {
    if (unsubAllContribs) unsubAllContribs();
    if (!eventId.value) return;
    const q = query(
        collection(db, 'events', eventId.value, 'zawadiContributions'),
        orderBy('paidAt', 'desc'),
        limit(200)
    );
    unsubAllContribs = onSnapshot(q, snap => {
        allContribs.value = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(c => c.status === 'PAID');
    });
};

const contribsByItem = computed(() => {
    const map = {};
    for (const c of allContribs.value) {
        if (!map[c.itemId]) map[c.itemId] = [];
        map[c.itemId].push(c);
    }
    return map;
});

// ── Per-item contributions stream (scoped when sheet is open) ─────────────────
const itemContribs = ref([]);
let unsubItemContribs = null;

const loadItemContribs = (itemId) => {
    if (unsubItemContribs) { unsubItemContribs(); unsubItemContribs = null; }
    itemContribs.value = [];
    if (!itemId || !eventId.value) return;
    const q = query(
        collection(db, 'events', eventId.value, 'zawadiContributions'),
        where('itemId', '==', itemId),
        orderBy('paidAt', 'desc')
    );
    unsubItemContribs = onSnapshot(q, snap => {
        itemContribs.value = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(c => c.status === 'PAID');
    });
};

function openGiftSheet(item) {
    selectedItem.value = item;
    showGiftSheet.value = true;
    giftStep.value = 'pick';
    giftAmount.value = null;
    giftCustom.value = '';
    giftNote.value = '';
    loadItemContribs(item.id);
}

function closeGiftSheet() {
    if (giftSending.value) return;
    showGiftSheet.value = false;
    if (unsubItemContribs) { unsubItemContribs(); unsubItemContribs = null; }
    selectedItem.value = null;
    itemContribs.value = [];
}

const giftTotal = computed(() => {
    if (giftAmount.value) return giftAmount.value;
    const n = parseInt(String(giftCustom.value).replace(/\D/g, ''), 10);
    return isNaN(n) ? null : n;
});

const stepTitle = computed(() => {
    if (giftStep.value === 'pick') return selectedItem.value?.title ?? (lang.value === 'sw' ? 'Toa Zawadi' : 'Send a Gift');
    const sw = { note: 'Ongeza Ujumbe', confirm: 'Thibitisha Zawadi', done: 'Zawadi Imetumwa!' };
    const en = { note: 'Add a Note', confirm: 'Confirm Gift', done: 'Gift Sent!' };
    return (lang.value === 'sw' ? sw : en)[giftStep.value] ?? '';
});

function pickPreset(amt) { giftAmount.value = amt; giftCustom.value = ''; }
function onCustomInput() { giftAmount.value = null; }
function giftNext() {
    if (!giftTotal.value || giftTotal.value < 100) return;
    giftStep.value = 'note';
}
function giftBack() { giftStep.value = 'pick'; }
function giftConfirm() { giftStep.value = 'confirm'; }
function giftBackToNote() { giftStep.value = 'note'; }

const giftError = ref('');
const giftReturnBanner = ref(false); // shown when user lands back from Pesapal

async function sendGift() {
    giftSending.value = true;
    giftError.value = '';
    try {
        const callbackUrl = window.location.href.split('?')[0];
        const resp = await fetch('https://lipazawadi-frbu33fema-uc.a.run.app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: giftTotal.value,
                eventId: eventId.value,
                itemId: selectedItem.value.id,
                attendeeId: userId.value,
                attendeeName: attendeeName.value,
                attendeeInitial: attendeeInitial.value,
                attendeePhone: attendeePhone.value || '0000000000',
                note: giftNote.value,
                callback_url: callbackUrl,
            }),
        });
        const data = await resp.json();
        if (data.error) {
            giftError.value = data.error.message || (lang.value === 'sw' ? 'Imeshindwa. Jaribu tena.' : 'Payment failed. Please try again.');
            giftSending.value = false;
            return;
        }
        // Hand off to Pesapal — user leaves the page here
        window.location.href = data.redirect_url;
    } catch (e) {
        giftError.value = lang.value === 'sw' ? 'Hitilafu imetokea. Jaribu tena.' : 'Something went wrong. Please try again.';
        giftSending.value = false;
    }
}

const eventLocations = computed(() => eventData.value?.locations ?? []);
const mappableLocations = computed(() => eventLocations.value.filter(l => l.lat != null && l.lng != null));

// ── Venue card description clamping — keeps date/map-link rows aligned
// across cards regardless of how long each venue's description runs. Only
// shows a "Show more" toggle for descriptions that actually overflow the
// 3-line clamp (measured via scrollHeight vs clientHeight, not a character
// guess, since translated copy varies in length between languages).
const locBodyEls = new Map();
const expandedLocIds = ref(new Set());
const clampedLocIds = ref(new Set());

function setLocBodyRef(id, el) {
    if (el) locBodyEls.set(id, el);
    else locBodyEls.delete(id);
}

function measureLocClamping() {
    const overflowing = new Set();
    for (const [id, el] of locBodyEls) {
        if (el.scrollHeight > el.clientHeight + 1) overflowing.add(id);
    }
    clampedLocIds.value = overflowing;
}

function toggleLocDesc(id) {
    const next = new Set(expandedLocIds.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expandedLocIds.value = next;
}

watch(eventLocations, async () => {
    await nextTick();
    measureLocClamping();
}, { flush: 'post' });

let locResizeTimer = null;
function locResizeHandler() {
    clearTimeout(locResizeTimer);
    locResizeTimer = setTimeout(measureLocClamping, 200);
}

// ── Venues map — one Google Map with a pin per venue ───────────────────────
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const mapEl = ref(null);
let venuesMap = null;
let googleMapsLoadPromise = null;

function loadGoogleMaps() {
    if (window.google?.maps) return Promise.resolve();
    if (googleMapsLoadPromise) return googleMapsLoadPromise;
    googleMapsLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
    return googleMapsLoadPromise;
}

async function initVenuesMap() {
    if (!mappableLocations.value.length || !MAPS_KEY) return;
    try {
        await loadGoogleMaps();
    } catch {
        return;
    }
    await nextTick();
    if (!mapEl.value) return;

    const first = mappableLocations.value[0];
    if (!venuesMap) {
        venuesMap = new google.maps.Map(mapEl.value, {
            zoom: 15,
            center: { lat: first.lat, lng: first.lng },
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
        });
    }

    const bounds = new google.maps.LatLngBounds();
    const infoWindow = new google.maps.InfoWindow();
    mappableLocations.value.forEach(loc => {
        const position = { lat: loc.lat, lng: loc.lng };
        const marker = new google.maps.Marker({ position, map: venuesMap, title: loc.placeName });
        marker.addListener('click', () => {
            infoWindow.setContent(
                `<div style="font-family:'Inter',sans-serif;padding:2px 2px;max-width:200px;">
                    <strong style="display:block;margin-bottom:2px;">${loc.label}</strong>
                    <span style="color:#666;font-size:12.5px;">${loc.placeName}</span>
                </div>`
            );
            infoWindow.open(venuesMap, marker);
        });
        bounds.extend(position);
    });
    if (mappableLocations.value.length > 1) venuesMap.fitBounds(bounds, 60);
}

watch(mappableLocations, (locs) => { if (locs.length) initVenuesMap(); });

const scheduleItems = computed(() => {
    const arr = Array.isArray(eventData.value?.schedule) ? [...eventData.value.schedule] : [];
    return arr.sort((a, b) => new Date(a.time) - new Date(b.time));
});
const programmeExpanded = ref(false);
const contacts = computed(() => eventData.value?.contacts ?? []);

const mapsLink = (loc) => {
    if (loc.mapsUrl) return loc.mapsUrl;
    if (loc.lat != null && loc.lng != null) return `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
    return `https://www.google.com/maps/search/${encodeURIComponent(loc.placeName)}`;
};

// ── Gallery ───────────────────────────────────────────────────────────────────
const FOLDER_PAGE = 6;
const MEDIA_LIMIT = 24;
const lightboxItem = ref(null); // { url, type, folderName, id?, folderId? }
const showMediaComments = ref(false);
const mediaComments = ref([]);
const mediaCommentText = ref('');
const mediaCommentPosting = ref(false);
const lbScale = ref(1);
const lbOffX = ref(0);
const lbOffY = ref(0);

let _lbPinchDist0 = 0, _lbScale0 = 1;
let _lbPanStart = { x: 0, y: 0 }, _lbOff0 = { x: 0, y: 0 };
let _lbLastTap = 0, _lbMoved = false;

function _pinchDist(t) {
    const dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}
function lbResetZoom() { lbScale.value = 1; lbOffX.value = 0; lbOffY.value = 0; }
function closeLightbox() { lightboxItem.value = null; lbResetZoom(); }
watch(lightboxItem, (item) => {
    if (!item) lbResetZoom();
    showMediaComments.value = false;
    mediaCommentText.value = '';
    if (unsubMediaComments) { unsubMediaComments(); unsubMediaComments = null; }
    mediaComments.value = [];
    if (!item?.id || !item?.folderId) return;
    const mq = query(
        collection(db, 'events', eventId.value, 'galleryFolders', item.folderId, 'media', item.id, 'comments'),
        orderBy('createdAt', 'desc')
    );
    unsubMediaComments = onSnapshot(mq, snap => {
        mediaComments.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    });
});

function onLbTouchStart(e) {
    _lbMoved = false;
    if (e.touches.length === 2) {
        _lbPinchDist0 = _pinchDist(e.touches);
        _lbScale0 = lbScale.value;
    } else {
        _lbPanStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        _lbOff0 = { x: lbOffX.value, y: lbOffY.value };
        const now = Date.now();
        if (now - _lbLastTap < 300) {
            lbScale.value = lbScale.value > 1 ? 1 : 2.5;
            if (lbScale.value === 1) { lbOffX.value = 0; lbOffY.value = 0; }
        }
        _lbLastTap = now;
    }
}
function onLbTouchMove(e) {
    _lbMoved = true;
    if (e.touches.length === 2) {
        lbScale.value = Math.min(5, Math.max(1, _lbScale0 * (_pinchDist(e.touches) / _lbPinchDist0)));
    } else if (lbScale.value > 1) {
        lbOffX.value = _lbOff0.x + (e.touches[0].clientX - _lbPanStart.x);
        lbOffY.value = _lbOff0.y + (e.touches[0].clientY - _lbPanStart.y);
    }
}
function onLbTouchEnd() {
    if (lbScale.value < 1) lbResetZoom();
}
function onLbWheel(e) {
    lbScale.value = Math.min(5, Math.max(1, lbScale.value - e.deltaY * 0.002));
    if (lbScale.value === 1) { lbOffX.value = 0; lbOffY.value = 0; }
}
function onLbDblClick() {
    lbScale.value = lbScale.value > 1 ? 1 : 2.5;
    if (lbScale.value === 1) { lbOffX.value = 0; lbOffY.value = 0; }
}
function onLbBgClick() {
    if (showMediaComments.value) { showMediaComments.value = false; return; }
    if (!_lbMoved) closeLightbox();
}

const galleryGroups = ref([]); // [{ folderId, folderName, items: [{id,url,type,tall}] }]
const galleryLoading = ref(false);
const galleryHasMoreFolders = ref(false);
const galleryLastFolderDoc = ref(null);


const fetchGallery = async (reset = false) => {
    if (galleryLoading.value || !eventId.value) return;
    galleryLoading.value = true;
    try {
        const folderBase = [
            collection(db, 'events', eventId.value, 'galleryFolders'),
            orderBy('createdAt', 'asc'),
        ];
        const folderConstraints = (reset || !galleryLastFolderDoc.value)
            ? [...folderBase, limit(FOLDER_PAGE + 1)]
            : [...folderBase, startAfter(galleryLastFolderDoc.value), limit(FOLDER_PAGE + 1)];

        const folderSnap = await getDocs(query(...folderConstraints));
        const folderDocs = folderSnap.docs.slice(0, FOLDER_PAGE);
        galleryHasMoreFolders.value = folderSnap.docs.length > FOLDER_PAGE;
        galleryLastFolderDoc.value = folderDocs.length ? folderDocs[folderDocs.length - 1] : null;

        const groups = await Promise.all(folderDocs.map(async (fd) => {
            const mediaSnap = await getDocs(
                query(
                    collection(db, 'events', eventId.value, 'galleryFolders', fd.id, 'media'),
                    orderBy('uploadedAt', 'desc'),
                    limit(MEDIA_LIMIT)
                )
            );
            const folderName = fd.data().name ?? 'Untitled';
            const items = mediaSnap.docs.map((d, i) => ({
                id: d.id,
                url: d.data().url,
                type: d.data().type ?? 'image',
                tall: i % 3 === 0,
                folderName,
                commentCount: d.data().commentCount ?? 0,
                likedBy: d.data().likedBy ?? [],
            }));
            return { folderId: fd.id, folderName, items };
        }));

        const nonEmpty = groups.filter(g => g.items.length > 0);
        galleryGroups.value = reset ? nonEmpty : [...galleryGroups.value, ...nonEmpty];
    } catch (e) {
        console.error('gallery_fetch', e);
    } finally {
        galleryLoading.value = false;
    }
};

const FOLDER_PREVIEW = 6;
const expandedFolders = ref({});
const toggleFolderExpand = (folderId) => {
    expandedFolders.value = { ...expandedFolders.value, [folderId]: !expandedFolders.value[folderId] };
};

// ── RSVP Prompt ───────────────────────────────────────────────────────────────
const rsvpSaving = ref(false);
const showRsvp = ref(false);

watch(attendeeData, (val) => {
    if (!val) return;
    const s = val.attendanceStatus;
    if (!s || (s !== 'Confirmed' && s !== 'Declined')) showRsvp.value = true;
}, { immediate: true });

const submitRsvp = async (status) => {
    if (rsvpSaving.value) return;
    rsvpSaving.value = true;
    try {
        await updateDoc(doc(db, 'events', eventId.value, 'attendees', userId.value), {
            attendanceStatus: status,
        });
        attendeeData.value = { ...attendeeData.value, attendanceStatus: status };
        showRsvp.value = false;
    } catch (e) {
        console.error('rsvp_error', e);
    } finally {
        rsvpSaving.value = false;
    }
};

// ── Comments ──────────────────────────────────────────────────────────────────
const comments = ref([]);
const commentText = ref('');
const commentPosting = ref(false);
const showCommentsSheet = ref(false);
const replyingTo = ref(null);
const replyTexts = ref({});
const replyPosting = ref({});
const expandedReplies = ref({});

const fmtCommentTime = (ts) => {
    if (!ts?.toDate) return '';
    const d = ts.toDate(), now = new Date();
    const s = Math.floor((now - d) / 1000);
    const L = i18n[lang.value] ?? i18n.sw;
    if (s < 60) return L.justNow;
    if (s < 3600) return L.minsAgo(Math.floor(s / 60));
    if (s < 86400) return L.hoursAgo(Math.floor(s / 3600));
    return d.toLocaleDateString(L.locale, { day: 'numeric', month: 'short' });
};

const postComment = async () => {
    const text = commentText.value.trim();
    if (!text || commentPosting.value) return;
    commentPosting.value = true;
    try {
        await addDoc(collection(db, 'events', eventId.value, 'comments'), {
            userId: userId.value,
            userName: attendeeName.value,
            userInitial: attendeeInitial.value,
            userColor: ac.value,
            text,
            createdAt: serverTimestamp(),
            replyCount: 0,
        });
        commentText.value = '';
    } finally {
        commentPosting.value = false;
    }
};

const toggleReplies = async (comment) => {
    if (expandedReplies.value[comment.id]) {
        const updated = { ...expandedReplies.value };
        delete updated[comment.id];
        expandedReplies.value = updated;
        return;
    }
    const q = query(
        collection(db, 'events', eventId.value, 'comments', comment.id, 'replies'),
        orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(q);
    expandedReplies.value = {
        ...expandedReplies.value,
        [comment.id]: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    };
};

const openReply = (commentId) => {
    replyingTo.value = replyingTo.value === commentId ? null : commentId;
};

const postReply = async (comment) => {
    const text = (replyTexts.value[comment.id] || '').trim();
    if (!text || replyPosting.value[comment.id]) return;
    replyPosting.value = { ...replyPosting.value, [comment.id]: true };
    try {
        const newReply = {
            userId: userId.value,
            userName: attendeeName.value,
            userInitial: attendeeInitial.value,
            userColor: ac.value,
            text,
            createdAt: { toDate: () => new Date() },
        };
        const replyRef = await addDoc(
            collection(db, 'events', eventId.value, 'comments', comment.id, 'replies'),
            { ...newReply, createdAt: serverTimestamp() }
        );
        await updateDoc(doc(db, 'events', eventId.value, 'comments', comment.id), {
            replyCount: increment(1),
        });
        replyTexts.value = { ...replyTexts.value, [comment.id]: '' };
        replyingTo.value = null;
        if (expandedReplies.value[comment.id]) {
            expandedReplies.value[comment.id].push({ id: replyRef.id, ...newReply });
        }
    } finally {
        replyPosting.value = { ...replyPosting.value, [comment.id]: false };
    }
};

const openMediaComments = async (item) => {
    lightboxItem.value = item;
    await nextTick();
    showMediaComments.value = true;
};

const postMediaComment = async () => {
    const text = mediaCommentText.value.trim();
    const item = lightboxItem.value;
    if (!text || mediaCommentPosting.value || !item?.id || !item?.folderId) return;
    mediaCommentPosting.value = true;
    try {
        await addDoc(
            collection(db, 'events', eventId.value, 'galleryFolders', item.folderId, 'media', item.id, 'comments'),
            {
                userId: userId.value,
                userName: attendeeName.value,
                userInitial: attendeeInitial.value,
                userColor: ac.value,
                text,
                createdAt: serverTimestamp(),
            }
        );
        await updateDoc(
            doc(db, 'events', eventId.value, 'galleryFolders', item.folderId, 'media', item.id),
            { commentCount: increment(1) }
        );
        const grp = galleryGroups.value.find(g => g.folderId === item.folderId);
        const mi = grp?.items.find(i => i.id === item.id);
        if (mi) mi.commentCount = (mi.commentCount ?? 0) + 1;
        mediaCommentText.value = '';
    } finally {
        mediaCommentPosting.value = false;
    }
};

const toggleLike = async (item) => {
    if (!item?.id || !item?.folderId) return;
    const uid = userId.value;
    const liked = (item.likedBy ?? []).includes(uid);
    const mediaRef = doc(db, 'events', eventId.value, 'galleryFolders', item.folderId, 'media', item.id);

    const grp = galleryGroups.value.find(g => g.folderId === item.folderId);
    const mi = grp?.items.find(i => i.id === item.id);
    const newLikedBy = liked
        ? (mi?.likedBy ?? []).filter(id => id !== uid)
        : [...(mi?.likedBy ?? []), uid];

    if (mi) mi.likedBy = newLikedBy;
    if (lightboxItem.value?.id === item.id && lightboxItem.value?.folderId === item.folderId) {
        lightboxItem.value = { ...lightboxItem.value, likedBy: newLikedBy };
    }

    try {
        await updateDoc(mediaRef, {
            likedBy: liked ? arrayRemove(uid) : arrayUnion(uid),
        });
    } catch (e) {
        const revert = liked ? [...newLikedBy, uid] : newLikedBy.filter(id => id !== uid);
        if (mi) mi.likedBy = revert;
        if (lightboxItem.value?.id === item.id && lightboxItem.value?.folderId === item.folderId) {
            lightboxItem.value = { ...lightboxItem.value, likedBy: revert };
        }
        console.error('like_error', e);
    }
};
</script>

<template>
    <div class="page">

        <!-- Gift return banner (shown after redirect back from Pesapal) -->
        <Transition name="gift-overlay">
            <div v-if="giftReturnBanner" class="gift-return-banner" @click="giftReturnBanner = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" stroke-linecap="round"/>
                </svg>
                <div>
                    <p class="gift-return-title">{{ lang === 'sw' ? 'Zawadi inasubiri uthibitisho' : 'Gift is being processed' }}</p>
                    <p class="gift-return-sub">{{ lang === 'sw' ? 'Itaonekana hapa ikithibitishwa.' : 'It will appear here once confirmed.' }}</p>
                </div>
                <button class="gift-return-close">✕</button>
            </div>
        </Transition>

        <!-- Loading -->
        <div v-if="loading" class="center-screen">
            <div class="spin-ring"></div>
            <p class="spin-lbl">{{ t('loading') }}</p>
        </div>

        <!-- Error -->
        <div v-else-if="hasError" class="center-screen">
            <div class="err-circle">✕</div>
            <p class="err-h">{{ t('notFound') }}</p>
            <p class="err-p">{{ t('linkInvalid') }}</p>
        </div>

        <!-- Main -->
        <template v-if="!loading && !hasError && eventData">

            <!-- Video intro — organizer-uploaded clip, plays once muted then fades into the hero -->
            <Transition name="el-video-intro-fade">
                <div v-if="heroVideoEnabled && showVideoIntro" class="el-video-intro" @click="onVideoIntroTap">
                    <video
                        ref="videoIntroRef"
                        class="el-video-intro-el"
                        :src="heroVideoUrl"
                        muted
                        autoplay
                        playsinline
                        preload="auto"
                        @ended="onVideoIntroEnded"
                        @error="revealFromIntro"
                    ></video>
                    <div v-if="videoIntroTapHint" class="el-video-intro-tap">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        <span>{{ lang === 'sw' ? 'Gusa kucheza' : 'Tap to play' }}</span>
                    </div>
                </div>
            </Transition>

            <!-- RSVP Prompt — overlays the page so user can see context behind it -->
            <Transition name="rsvp-fade">
                <div v-if="showRsvp && !introActive" class="rsvp-overlay">
                    <div class="rsvp-card">
                        <div class="rsvp-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path
                                    d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                            </svg>
                        </div>
                        <h2 class="rsvp-title">{{ t('rsvpQuestion') }}</h2>
                        <p class="rsvp-event">{{ eventData?.title }}</p>
                        <p class="rsvp-sub">{{ t('rsvpSub') }}</p>
                        <div class="rsvp-actions">
                            <button class="rsvp-btn rsvp-confirm" :disabled="rsvpSaving"
                                @click="submitRsvp('Confirmed')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                    <path d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{{ rsvpSaving ? t('saving') : t('confirmAttendance') }}</span>
                            </button>
                            <button class="rsvp-btn rsvp-decline" :disabled="rsvpSaving"
                                @click="submitRsvp('Declined')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                                <span>{{ t('decline') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>

            <!-- Back to top -->
            <button :class="['el-back-top', backToTopVisible ? 'el-back-top-visible' : '']" @click="scrollToTop" aria-label="Back to top">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </button>

            <!-- Comments FAB — always visible, bottom-right -->
            <button class="el-comment-fab" @click="showCommentsSheet = true" :aria-label="t('comments')">
                <span class="el-comment-fab-ring"></span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                <span v-if="comments.length" class="el-comment-badge">{{ comments.length }}</span>
            </button>

            <!-- Background music -->
            <audio v-if="heroMusicConfigured" ref="heroMusicRef" :src="heroMusicUrl" loop></audio>

            <!-- ── HERO ── -->
            <section class="el-hero" id="elHero">
                <div class="el-hero-bg" id="elHeroBg" :style="heroImage ? { backgroundImage: `url(${heroImage})` } : {}"></div>
                <div class="el-hero-scrim"></div>
                <div class="el-petals" id="elPetals" aria-hidden="true"></div>

                <button v-if="heroMusicConfigured" class="el-sound-toggle" @click="toggleHeroMusic" :aria-label="musicPlaying ? 'Mute music' : 'Play music'">
                    <svg v-if="musicPlaying" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                </button>

                <div class="el-hero-content">
                    <h1 class="el-hero-title">{{ eventData.title }}</h1>
                    <p v-if="startFmt" class="el-hero-date">{{ startFmt }}</p>
                </div>

                <div class="el-scroll-cue">
                    <div class="el-mouse"></div>
                    <span>{{ t('scrollHint') }}</span>
                </div>
            </section>

            <div class="el-content">

                <!-- To: attendee + Invitation text -->
                <section class="el-invite reveal">
                    <p class="el-eyebrow el-eyebrow-center">{{ lang === 'sw' ? 'Kwa' : 'To' }}</p>
                    <template v-if="greetingParts.hasName">
                        <p v-if="greetingParts.before" class="el-invite-line">{{ greetingParts.before }}</p>
                        <h2 class="el-invite-name">{{ attendeeName }}</h2>
                        <p v-if="greetingParts.after" class="el-invite-line">{{ greetingParts.after }}</p>
                    </template>
                    <p v-else class="el-invite-line">{{ greetingParts.before }}</p>
                    <p class="el-invite-text">{{ eventData.description || t('invitationPlaceholder') }}</p>
                    <div class="el-divider"></div>
                </section>

                <!-- Countdown -->
                <section v-if="eventData.startDate" class="el-countdown-wrap reveal">
                    <div class="el-glass-card el-countdown-card">
                        <p class="el-eyebrow el-eyebrow-center">{{ t('countdownLabel') }}</p>
                        <div class="el-countdown">
                            <div class="el-count-item"><span>{{ countdown.days }}</span><label>{{ lang === 'sw' ? 'Siku' : 'Days' }}</label></div>
                            <div class="el-count-item"><span>{{ countdown.hours }}</span><label>{{ lang === 'sw' ? 'Saa' : 'Hrs' }}</label></div>
                            <div class="el-count-item"><span>{{ countdown.mins }}</span><label>{{ lang === 'sw' ? 'Dak' : 'Min' }}</label></div>
                            <div class="el-count-item"><span>{{ countdown.secs }}</span><label>{{ lang === 'sw' ? 'Sek' : 'Sec' }}</label></div>
                        </div>
                    </div>
                </section>

                <!-- Details / venue cards -->
                <section class="el-details reveal">
                    <p class="el-eyebrow el-eyebrow-center">{{ t('venueEyebrow') }}</p>
                    <h2 class="el-section-title">{{ t('venueTitle') }}</h2>
                    <div v-if="eventLocations.length" class="el-details-grid">
                        <div v-for="loc in eventLocations" :key="loc.id" class="el-glass-card el-details-card">
                            <div class="el-details-card-top">
                                <p class="el-eyebrow">{{ loc.label }}</p>
                                <h2 class="el-card-title">{{ loc.placeName }}</h2>
                                <p
                                    v-if="loc.description"
                                    :ref="el => setLocBodyRef(loc.id, el)"
                                    class="el-card-body"
                                    :class="{ 'el-card-body--clamped': !expandedLocIds.has(loc.id) }"
                                >{{ loc.description }}</p>
                                <button
                                    v-if="loc.description && clampedLocIds.has(loc.id)"
                                    class="el-card-readmore"
                                    @click="toggleLocDesc(loc.id)"
                                >{{ expandedLocIds.has(loc.id) ? t('showLessItems') : t('showMoreItems') }}</button>
                            </div>
                            <div class="el-details-card-footer">
                                <div v-if="loc.dateTime" class="el-venue-date">{{ fmtVenueDateTime(loc.dateTime) }}</div>
                                <a :href="mapsLink(loc)" target="_blank" rel="noopener noreferrer" class="el-map-link">{{ t('openInMaps') }}</a>
                            </div>
                        </div>
                    </div>
                    <div v-else-if="eventData.location" class="el-glass-card el-details-card el-details-single">
                        <h2 class="el-card-title">{{ eventData.location }}</h2>
                    </div>
                    <div v-else class="el-glass-card el-details-card el-details-single">
                        <h2 class="el-card-title">{{ t('venuePlaceholderTitle') }}</h2>
                        <p class="el-card-body">{{ t('venuePlaceholderDesc') }}</p>
                    </div>
                    <div v-if="mappableLocations.length" ref="mapEl" class="el-venues-map"></div>
                </section>

                <!-- Programme -->
                <section v-if="scheduleItems.length" class="el-programme reveal">
                    <p class="el-eyebrow el-eyebrow-center">{{ t('programmeEyebrow') }}</p>
                    <h2 class="el-section-title">{{ t('programmeTitle') }}</h2>
                    <div class="el-htimeline" :class="{ 'el-htimeline--expanded': programmeExpanded }">
                        <div
                            v-for="(item, idx) in scheduleItems"
                            :key="item.id"
                            class="el-htimeline-item"
                            :class="{ 'el-htimeline-item--first': idx === 0, 'el-htimeline-item--last': idx === scheduleItems.length - 1 }"
                        >
                            <div class="el-htimeline-dot-row">
                                <div class="el-htimeline-connector"></div>
                                <span class="el-htimeline-dot"></span>
                            </div>
                            <span v-if="item.time" class="el-htimeline-time">{{ fmtTime(item.time) }}</span>
                            <h3 class="el-htimeline-title">{{ item.title }}</h3>
                            <p class="el-htimeline-desc">{{ item.description }}</p>
                        </div>
                    </div>
                    <button v-if="scheduleItems.length > 4" class="el-prog-more" @click="programmeExpanded = !programmeExpanded">
                        {{ programmeExpanded ? t('showLessItems') : t('showMoreItems') }}
                    </button>
                </section>

                <!-- Food & Beverages -->
                <section v-if="eventData.foodBeverageEnabled && eventData.foodBeverageImage" class="el-artwork-section reveal">
                    <p class="el-eyebrow el-eyebrow-center">{{ t('foodBevEyebrow') }}</p>
                    <h2 class="el-section-title">{{ t('foodBevTitle') }}</h2>
                    <div class="el-artwork-frame" @click="lightboxItem = { url: eventData.foodBeverageImage, type: 'image' }">
                        <img :src="eventData.foodBeverageImage" :alt="t('foodBevTitle')" class="el-artwork-img" />
                    </div>
                </section>

                <!-- Dress Code -->
                <section v-if="eventData.dressCodeEnabled && eventData.dressCodeImage" class="el-artwork-section reveal">
                    <p class="el-eyebrow el-eyebrow-center">{{ t('dressCodeEyebrow') }}</p>
                    <h2 class="el-section-title">{{ t('dressCodeTitle') }}</h2>
                    <div class="el-artwork-frame" @click="lightboxItem = { url: eventData.dressCodeImage, type: 'image' }">
                        <img :src="eventData.dressCodeImage" :alt="t('dressCodeTitle')" class="el-artwork-img" />
                    </div>
                </section>

                <!-- Master of Ceremonies -->
                <section v-if="eventData.mcEnabled && eventData.mcName && eventData.mcPhoto" class="el-mc reveal">
                    <p class="el-eyebrow el-eyebrow-center">{{ t('mcEyebrow') }}</p>
                    <h2 class="el-section-title">{{ t('mcSectionTitle') }}</h2>
                    <div class="el-mc-split">
                        <div class="el-mc-photo-frame" @click="lightboxItem = { url: eventData.mcPhoto, type: 'image' }">
                            <img :src="eventData.mcPhoto" :alt="eventData.mcName" class="el-mc-photo" />
                        </div>
                        <div class="el-mc-info">
                            <span v-if="eventData.mcRole" class="el-mc-badge">{{ eventData.mcRole }}</span>
                            <h3 class="el-mc-name">{{ eventData.mcName }}</h3>
                            <div class="el-mc-rule"></div>
                            <p v-if="eventData.mcBio" class="el-mc-bio">{{ eventData.mcBio }}</p>
                        </div>
                    </div>
                </section>

                <!-- ── Gallery ── -->
                <section class="el-gallery-outer reveal">
                    <p class="el-eyebrow el-eyebrow-center">{{ t('gallery') }}</p>
                    <h2 class="el-section-title">{{ t('gallery') }}</h2>

                    <div v-if="galleryLoading && galleryGroups.length === 0" class="gallery-spinner">
                        <div class="spin-ring"></div>
                    </div>

                    <div v-else-if="!galleryLoading && galleryGroups.length === 0" class="gallery-empty">
                        <div class="gallery-empty-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="m21 15-5-5L5 21" />
                            </svg>
                        </div>
                        <p class="gallery-empty-txt">{{ t('noPhotos') }}</p>
                    </div>

                    <template v-else>
                        <div v-for="group in galleryGroups" :key="group.folderId" class="gallery-section">
                            <div class="gallery-section-hdr">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                                    <path
                                        d="M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293L10.707 6.7A1 1 0 0011.414 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                                </svg>
                                <span>{{ group.folderName }}</span>
                                <span class="gallery-section-count">{{ group.items.length }}</span>
                            </div>
                            <div class="gallery-grid">
                                <div v-for="item in (expandedFolders[group.folderId] ? group.items : group.items.slice(0, FOLDER_PREVIEW))"
                                    :key="item.id"
                                    :class="['gallery-cell', item.tall ? 'gallery-tall' : '', item.type === 'video' ? 'gallery-video-cell' : '']"
                                    @click="lightboxItem = { ...item, folderId: group.folderId, folderName: group.folderName }">
                                    <img v-if="item.type === 'image'" :src="item.url" loading="lazy" />
                                    <div v-else class="gallery-video-thumb">
                                        <video :src="item.url" preload="metadata" muted playsinline></video>
                                        <div class="gallery-play-overlay">
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <circle cx="12" cy="12" r="12" opacity=".55" />
                                                <polygon points="10,8 17,12 10,16" fill="white" />
                                            </svg>
                                        </div>
                                    </div>
                                    <button class="glk" :class="{ 'glk-liked': (item.likedBy ?? []).includes(userId) }"
                                        @click.stop="toggleLike({ ...item, folderId: group.folderId })">
                                        <svg viewBox="0 0 24 24"
                                            :fill="(item.likedBy ?? []).includes(userId) ? 'currentColor' : 'none'"
                                            stroke="currentColor" stroke-width="2.2">
                                            <path
                                                d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                                        </svg>
                                        <span v-if="(item.likedBy ?? []).length" class="glk-count">{{ (item.likedBy ??
                                            []).length }}</span>
                                    </button>
                                    <button class="gcc"
                                        @click.stop="openMediaComments({ ...item, folderId: group.folderId, folderName: group.folderName })">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                                        </svg>
                                        <span v-if="item.commentCount" class="gcc-count">{{ item.commentCount }}</span>
                                    </button>
                                </div>
                            </div>
                            <!-- Expand / collapse -->
                            <button v-if="group.items.length > FOLDER_PREVIEW" class="gallery-expand-btn"
                                @click="toggleFolderExpand(group.folderId)">
                                <template v-if="!expandedFolders[group.folderId]">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                    See {{ group.items.length - FOLDER_PREVIEW }} more
                                </template>
                                <template v-else>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="18 15 12 9 6 15" />
                                    </svg>
                                    Show less
                                </template>
                            </button>
                        </div>

                        <!-- Load more folders -->
                        <button v-if="galleryHasMoreFolders" class="gallery-more-btn" :disabled="galleryLoading"
                            @click="fetchGallery(false)">
                            {{ galleryLoading ? t('loadingDots') : t('loadMore') }}
                        </button>
                    </template>
                </section>

                <!-- Host -->
                <section class="el-host reveal">
                    <p class="el-eyebrow el-eyebrow-center">{{ t('hostEyebrow') }}</p>
                    <h2 class="el-section-title">{{ t('hostTitle') }}</h2>
                    <p class="el-host-body">{{ t('hostBody') }}</p>
                </section>

                <!-- ── Gift of Love section ── -->
                <div class="section-card zawadi-section reveal">
                    <div class="s-hdr">
                        <div class="s-bar"></div>
                        <span class="s-lbl">{{ lang === 'sw' ? 'Zawadi ya Upendo' : 'Gift of Love' }}</span>
                    </div>
                    <div v-if="zawadiItems.length === 0" class="zawadi-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
                            <path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
                            <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
                            <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
                        </svg>
                        <p>{{ lang === 'sw' ? 'Hakuna vitu bado' : 'No gift items yet' }}</p>
                    </div>
                    <div v-else class="zawadi-list">
                        <div v-for="(item, idx) in zawadiItems" :key="item.id"
                            :class="['zawadi-item', idx < zawadiItems.length - 1 ? 'zawadi-item-sep' : '']"
                            @click="openGiftSheet(item)">
                            <!-- Top row: icon · title · chevron -->
                            <div class="zawadi-item-top">
                                <div class="zawadi-item-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                                        <path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
                                        <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
                                        <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
                                    </svg>
                                </div>
                                <div class="zawadi-item-info">
                                    <p class="zawadi-item-title">{{ item.title }}</p>
                                    <template v-if="item.description">
                                        <p :class="['zawadi-item-desc', expandedDescs[item.id] ? 'zawadi-item-desc--expanded' : '']">{{ item.description }}</p>
                                        <button v-if="item.description.length > 80" class="zawadi-read-more"
                                            @click.stop="expandedDescs[item.id] = !expandedDescs[item.id]">
                                            {{ expandedDescs[item.id] ? 'Show less' : 'Read more' }}
                                        </button>
                                    </template>
                                </div>
                                <svg class="zawadi-item-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                    <path d="M9 18l6-6-6-6"/>
                                </svg>
                            </div>
                            <!-- Progress bar -->
                            <div class="zawadi-progress-wrap">
                                <div class="zawadi-progress-bar">
                                    <div class="zawadi-progress-fill"
                                        :style="{ width: Math.min(100, item.targetAmount > 0 ? (item.totalFunded / item.targetAmount * 100) : 0) + '%' }">
                                    </div>
                                </div>
                            </div>
                            <!-- Footer: amounts · avatar strip -->
                            <div class="zawadi-item-foot">
                                <div class="zawadi-amounts">
                                    <span class="zawadi-funded">{{ item.currency || 'TZS' }} {{ fmtMoney(item.totalFunded || 0) }}</span>
                                    <span class="zawadi-target"> / {{ fmtMoney(item.targetAmount) }}</span>
                                </div>
                                <div v-if="(contribsByItem[item.id] || []).length" class="zawadi-avatars">
                                    <div v-for="c in (contribsByItem[item.id] || []).slice(0, 4)" :key="c.id"
                                        class="zawadi-avatar"
                                        :style="{ background: avatarColor(c.attendeeInitial).bg, color: avatarColor(c.attendeeInitial).fg }">
                                        {{ c.attendeeInitial }}
                                    </div>
                                    <div v-if="(contribsByItem[item.id] || []).length > 4" class="zawadi-avatar zawadi-avatar-more">
                                        +{{ (contribsByItem[item.id] || []).length - 4 }}
                                    </div>
                                </div>
                                <span v-else class="zawadi-no-gifts">{{ lang === 'sw' ? 'Bado hakuna zawadi' : 'Be the first!' }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Comments -->
                <div class="section-card reveal">
                    <div class="s-hdr">
                        <div class="s-bar"></div>
                        <span class="s-lbl">{{ t('comments') }}<span v-if="comments.length" class="cmnt-count"> ({{
                            comments.length }})</span></span>
                    </div>

                    <div class="cmnt-list" v-if="comments.length">
                        <div v-for="c in comments" :key="c.id" class="cmnt-item">
                            <div class="cmnt-avatar"
                                :style="{ background: c.userColor?.bg, color: c.userColor?.fg }">{{ c.userInitial }}
                            </div>
                            <div class="cmnt-body">
                                <div class="cmnt-meta">
                                    <span class="cmnt-name">{{ c.userName }}</span>
                                    <span class="cmnt-time">{{ fmtCommentTime(c.createdAt) }}</span>
                                </div>
                                <p class="cmnt-text">{{ c.text }}</p>
                                <div class="cmnt-actions">
                                    <button class="cmnt-reply-btn" @click="openReply(c.id)">{{ t('reply')
                                        }}</button>
                                    <button v-if="c.replyCount > 0" class="cmnt-view-replies"
                                        @click="toggleReplies(c)">
                                        {{ expandedReplies[c.id] ? t('hideReplies') : tFn('replies', c.replyCount)
                                        }}
                                    </button>
                                </div>

                                <div v-if="replyingTo === c.id" class="cmnt-reply-form">
                                    <input v-model="replyTexts[c.id]" class="cmnt-input"
                                        :placeholder="t('replyPlaceholder')"
                                        @keydown.enter.prevent="postReply(c)" />
                                    <button class="cmnt-send"
                                        :disabled="!replyTexts[c.id]?.trim() || replyPosting[c.id]"
                                        @click="postReply(c)">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <line x1="22" y1="2" x2="11" y2="13" />
                                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                        </svg>
                                    </button>
                                </div>

                                <div v-if="expandedReplies[c.id]" class="cmnt-replies">
                                    <div v-for="r in expandedReplies[c.id]" :key="r.id" class="cmnt-item">
                                        <div class="cmnt-avatar cmnt-avatar-sm"
                                            :style="{ background: r.userColor?.bg, color: r.userColor?.fg }">{{
                                                r.userInitial }}</div>
                                        <div class="cmnt-body">
                                            <div class="cmnt-meta">
                                                <span class="cmnt-name">{{ r.userName }}</span>
                                                <span class="cmnt-time">{{ fmtCommentTime(r.createdAt) }}</span>
                                            </div>
                                            <p class="cmnt-text">{{ r.text }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p v-else class="cmnt-empty">{{ t('noComments') }}</p>

                    <div class="cmnt-compose">
                        <div class="cmnt-avatar cmnt-avatar-sm" :style="{ background: ac?.bg, color: ac?.fg }">{{
                            attendeeInitial }}</div>
                        <input v-model="commentText" class="cmnt-input" :placeholder="t('commentPlaceholder')"
                            @keydown.enter.prevent="postComment" />
                        <button class="cmnt-send" :disabled="!commentText.trim() || commentPosting"
                            @click="postComment">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Contacts -->
                <section v-if="contacts.length" class="el-contacts reveal">
                    <p class="el-eyebrow el-eyebrow-center">{{ t('contactsEyebrow') }}</p>
                    <h2 class="el-section-title">{{ t('contactsTitle') }}</h2>
                    <div class="el-contacts-grid">
                        <div v-for="c in contacts" :key="c.id" class="el-glass-card el-contact-card">
                            <div class="el-contact-avatar" :style="{ background: avatarColor(c.name.charAt(0)).bg, color: avatarColor(c.name.charAt(0)).fg }">
                                {{ c.name.charAt(0).toUpperCase() }}
                            </div>
                            <p class="el-contact-name">{{ c.name }}</p>
                            <p v-if="c.role" class="el-contact-role">{{ c.role }}</p>
                            <a :href="`tel:${c.phone.replace(/\s+/g, '')}`" class="el-contact-phone">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                                </svg>
                                {{ c.phone }}
                            </a>
                        </div>
                    </div>
                </section>

                <!-- Support -->
                <a v-if="eventData.supportPhone"
                    :href="`https://wa.me/${eventData.supportPhone.replace(/\D/g, '')}`" target="_blank"
                    class="support-link reveal">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    {{ t('contactSupport') }}
                </a>

                <!-- ── Entry Pass ── -->
                <section class="el-pass reveal">
                    <p class="el-eyebrow el-eyebrow-center">{{ t('guestPass') }}</p>
                    <h2 class="el-section-title">{{ t('entryPassTitle') }}</h2>

                    <div class="el-glass-card el-pass-card">
                        <div class="stub-main">
                            <div class="stub-avatar" :style="{ background: ac.bg }">
                                <span class="stub-initial" :style="{ color: ac.fg }">{{ attendeeInitial }}</span>
                                <div class="stub-avatar-ring" :style="{ borderColor: ac.fg + '55' }"></div>
                            </div>

                            <div class="stub-info">
                                <p class="stub-badge">{{ cardBadge }}</p>
                                <h2 class="stub-name">{{ attendeeName }}</h2>
                                <p class="stub-phone" v-if="attendeePhone">{{ attendeePhone }}</p>
                            </div>
                        </div>

                        <div v-if="qrDataUrl" class="el-pass-qr-wrap">
                            <img :src="qrDataUrl" class="el-pass-qr" alt="Entry QR code" />
                            <p class="el-pass-qr-hint">{{ t('qrHint') }}</p>
                        </div>

                        <button v-if="hasInvitation && attendeeData?.cards?.invitation?.url" class="view-card-btn"
                            @click="lightboxItem = { url: attendeeData.cards.invitation.url, type: 'image' }">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                            {{ t('viewCard') }}
                        </button>

                        <div :class="['stub-status',
                            attendeeData?.attendanceStatus === 'Confirmed' ? 'status-in' :
                                attendeeData?.attendanceStatus === 'Declined' ? 'status-declined' :
                                    'status-pending']" @click="showRsvp = true">
                            <div class="status-indicator">
                                <div :class="['status-led',
                                    attendeeData?.attendanceStatus === 'Confirmed' ? 'led-green' :
                                        attendeeData?.attendanceStatus === 'Declined' ? 'led-red' :
                                            'led-amber']">
                                </div>
                                <span>{{
                                    attendeeData?.attendanceStatus === 'Confirmed' ? t('confirmed') :
                                        attendeeData?.attendanceStatus === 'Declined' ? t('declined') :
                                            t('pendingRsvp')
                                    }}</span>
                            </div>
                            <div class="status-right">
                                <svg v-if="attendeeData?.attendanceStatus === 'Confirmed'" class="check-mark"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <path d="M5 13l4 4L19 7" />
                                </svg>
                                <svg v-else-if="attendeeData?.attendanceStatus === 'Declined'" class="check-mark"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                                <span
                                    v-if="attendeeData?.attendanceStatus === 'Confirmed' || attendeeData?.attendanceStatus === 'Declined'"
                                    class="status-change-lbl">{{ t('tapToChange') }}</span>
                            </div>
                        </div>
                    </div>

                    <div v-if="eventData.passNote" class="el-pass-note">
                        <div class="el-divider" style="margin:34px auto 20px"></div>
                        <p class="el-pass-note-text">{{ eventData.passNote }}</p>
                    </div>
                </section>

            </div>
            <!-- /el-content -->

            <!-- Footer -->
            <footer class="el-footer">
                <h2 class="el-footer-title">{{ eventData.title }}</h2>
                <p v-if="startFmt" class="el-footer-date">{{ startFmt }}</p>
                <p class="el-footer-credit">{{ t('footerCredit') }}</p>
            </footer>

            <!-- Lightbox (always mounted) -->
            <Teleport to="body">
                <Transition name="lb-fade">
                    <div v-if="lightboxItem" class="lb-overlay" @click.self="onLbBgClick">
                        <button class="lb-close" @click="closeLightbox">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        <div class="lb-folder-badge" v-if="lightboxItem.folderName">{{ lightboxItem.folderName }}
                        </div>
                        <img v-if="lightboxItem.type === 'image'" :src="lightboxItem.url" class="lb-img"
                            :style="{ transform: `translate(${lbOffX}px, ${lbOffY}px) scale(${lbScale})`, cursor: lbScale > 1 ? 'grab' : 'zoom-in' }"
                            @touchstart="onLbTouchStart" @touchmove.prevent="onLbTouchMove" @touchend="onLbTouchEnd"
                            @wheel.prevent="onLbWheel" @dblclick="onLbDblClick" @click.stop />
                        <video v-else :src="lightboxItem.url" class="lb-video" controls autoplay
                            playsinline></video>

                        <!-- Like button (gallery items only) -->
                        <button v-if="lightboxItem.folderId && lightboxItem.id" class="lb-like-btn"
                            :class="{ 'lb-like-btn-active': (lightboxItem.likedBy ?? []).includes(userId) }"
                            @click.stop="toggleLike(lightboxItem)">
                            <svg viewBox="0 0 24 24"
                                :fill="(lightboxItem.likedBy ?? []).includes(userId) ? 'currentColor' : 'none'"
                                stroke="currentColor" stroke-width="2">
                                <path
                                    d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                            </svg>
                            <span v-if="(lightboxItem.likedBy ?? []).length" class="lb-like-badge">{{
                                (lightboxItem.likedBy ??
                                []).length }}</span>
                        </button>

                        <!-- Comment toggle (gallery items only) -->
                        <button v-if="lightboxItem.folderId && lightboxItem.id" class="lb-comment-btn"
                            :class="{ 'lb-comment-btn-active': showMediaComments }"
                            @click.stop="showMediaComments = !showMediaComments">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                            </svg>
                            <span v-if="mediaComments.length" class="lb-comment-badge">{{ mediaComments.length
                                }}</span>
                        </button>

                        <!-- Media comments bottom sheet -->
                        <Transition name="mc-slide">
                            <div v-if="showMediaComments && lightboxItem.folderId" class="mc-sheet" @click.stop>
                                <div class="mc-handle"></div>
                                <p class="mc-title">{{ t('comments') }}<span v-if="mediaComments.length"
                                        class="cmnt-count"> ({{
                                        mediaComments.length }})</span></p>
                                <div class="mc-list">
                                    <div v-for="c in mediaComments" :key="c.id" class="cmnt-item">
                                        <div class="cmnt-avatar cmnt-avatar-sm"
                                            :style="{ background: c.userColor?.bg, color: c.userColor?.fg }">{{
                                            c.userInitial }}
                                        </div>
                                        <div class="cmnt-body">
                                            <div class="cmnt-meta">
                                                <span class="cmnt-name">{{ c.userName }}</span>
                                                <span class="cmnt-time">{{ fmtCommentTime(c.createdAt) }}</span>
                                            </div>
                                            <p class="cmnt-text">{{ c.text }}</p>
                                        </div>
                                    </div>
                                    <p v-if="!mediaComments.length" class="cmnt-empty mc-empty">{{ t('noComments')
                                        }}</p>
                                </div>
                                <div class="cmnt-compose mc-compose">
                                    <div class="cmnt-avatar cmnt-avatar-sm"
                                        :style="{ background: ac?.bg, color: ac?.fg }">{{
                                        attendeeInitial }}</div>
                                    <input v-model="mediaCommentText" class="cmnt-input"
                                        :placeholder="t('commentPlaceholder')"
                                        @keydown.enter.prevent="postMediaComment" />
                                    <button class="cmnt-send"
                                        :disabled="!mediaCommentText.trim() || mediaCommentPosting"
                                        @click="postMediaComment">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <line x1="22" y1="2" x2="11" y2="13" />
                                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </Transition>
                    </div>
                </Transition>
            </Teleport>

            <!-- ── Gift bottom-sheet ── -->
            <Teleport to="body">
                <Transition name="gift-overlay">
                    <div v-if="showGiftSheet" class="gift-overlay" @click.self="closeGiftSheet">
                        <Transition name="gift-sheet">
                            <div v-if="showGiftSheet" class="gift-sheet" @click.stop>
                                <div class="gift-sheet-handle"></div>

                                <!-- Persistent header: back · [icon] title · close -->
                                <div class="gift-hdr-row">
                                    <button v-if="giftStep === 'note'" class="gift-hdr-back" @click="giftBack">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 18 9 12 15 6"/></svg>
                                    </button>
                                    <button v-else-if="giftStep === 'confirm'" class="gift-hdr-back" @click="giftBackToNote">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 18 9 12 15 6"/></svg>
                                    </button>

                                    <div v-if="giftStep === 'pick'" class="gift-hdr-identity">
                                        <div class="gift-hdr-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                                                <path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
                                                <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
                                                <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
                                            </svg>
                                        </div>
                                        <p class="gift-hdr-title">{{ stepTitle }}</p>
                                    </div>
                                    <p v-else class="gift-hdr-title">{{ stepTitle }}</p>

                                    <button class="gift-sheet-close" @click="closeGiftSheet">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                        </svg>
                                    </button>
                                </div>

                                <!-- Step: pick amount -->
                                <template v-if="giftStep === 'pick'">
                                    <p class="gift-sheet-sub">{{ lang === 'sw' ? 'Unatoa zawadi kwa ajili ya' : 'Gifting towards' }} <strong style="color:#e8d5a0">{{ selectedItem?.title }}</strong></p>

                                    <!-- Givers wall — scoped to this item -->
                                    <div v-if="itemContribs.length" class="givers-wall">
                                        <div class="givers-wall-scroll">
                                            <div v-for="c in itemContribs" :key="c.id" class="givers-wall-chip">
                                                <div class="givers-wall-avatar" :style="{ background: avatarColor(c.attendeeInitial).bg, color: avatarColor(c.attendeeInitial).fg }">{{ c.attendeeInitial }}</div>
                                                <div class="givers-wall-info">
                                                    <span class="givers-wall-name">{{ c.attendeeName }}</span>
                                                    <span class="givers-wall-amt">{{ fmtMoney(c.amount) }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p class="givers-wall-lbl">{{ itemContribs.length }} {{ lang === 'sw' ? 'wametoa zawadi hadi sasa' : 'people have sent gifts' }}</p>
                                    </div>

                                    <div class="gift-presets">
                                        <button v-for="p in GIFT_PRESETS" :key="p"
                                            :class="['gift-preset', giftAmount === p && !giftCustom ? 'gift-preset-active' : '']"
                                            @click="pickPreset(p)">
                                            {{ fmtMoney(p) }}<span class="gift-preset-cur">{{ giftCurrency }}</span>
                                        </button>
                                    </div>
                                    <div class="gift-custom-wrap">
                                        <span class="gift-custom-prefix">{{ giftCurrency }}</span>
                                        <input v-model="giftCustom" class="gift-custom-input" type="text"
                                            inputmode="numeric" pattern="[0-9]*"
                                            :placeholder="lang === 'sw' ? 'Kiasi kingine' : 'Custom amount'"
                                            @input="onCustomInput" />
                                    </div>
                                    <p v-if="giftTotal && giftTotal < 100" class="gift-err">{{ lang === 'sw' ? 'Kiwango cha chini ni' : 'Minimum is' }} {{ fmtMoney(100) }} {{ giftCurrency }}</p>
                                    <button class="gift-cta" :disabled="!giftTotal || giftTotal < 100" @click="giftNext">
                                        {{ lang === 'sw' ? 'Endelea' : 'Continue' }}
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                    </button>
                                </template>

                                <!-- Step: note -->
                                <template v-if="giftStep === 'note'">
                                    <p class="gift-sheet-sub" style="margin-bottom:14px">{{ lang === 'sw' ? 'Hiari — maneno yako yataonekana ukutani' : 'Optional — shown on the givers wall' }}</p>
                                    <div class="gift-amount-pill"><span>{{ fmtMoney(giftTotal) }} {{ giftCurrency }}</span></div>
                                    <textarea v-model="giftNote" class="gift-note-ta"
                                        :placeholder="lang === 'sw' ? 'Mfano: Hongera sana! Mungu abariki…' : 'e.g. Congratulations! Wishing you all the best…'"
                                        rows="4" maxlength="200"></textarea>
                                    <p class="gift-char-count">{{ giftNote.length }}/200</p>
                                    <button class="gift-cta" @click="giftConfirm">
                                        {{ lang === 'sw' ? 'Kagua' : 'Review' }}
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                    </button>
                                </template>

                                <!-- Step: confirm -->
                                <template v-if="giftStep === 'confirm'">
                                    <div class="gift-confirm-card">
                                        <div class="gift-confirm-row">
                                            <span class="gift-confirm-lbl">{{ lang === 'sw' ? 'Kutoka' : 'From' }}</span>
                                            <span class="gift-confirm-val">{{ attendeeName }}</span>
                                        </div>
                                        <div class="gift-confirm-row">
                                            <span class="gift-confirm-lbl">{{ lang === 'sw' ? 'Kiasi' : 'Amount' }}</span>
                                            <span class="gift-confirm-val gift-confirm-amt">{{ fmtMoney(giftTotal) }} {{ giftCurrency }}</span>
                                        </div>
                                        <div v-if="giftNote" class="gift-confirm-row gift-confirm-note-row">
                                            <span class="gift-confirm-lbl">{{ lang === 'sw' ? 'Ujumbe' : 'Note' }}</span>
                                            <span class="gift-confirm-val gift-confirm-note">{{ giftNote }}</span>
                                        </div>
                                    </div>
                                    <p class="gift-confirm-disclaimer">{{ lang === 'sw' ? 'Malipo yatashughulikiwa kwa usalama.' : 'Payment will be processed securely.' }}</p>
                                    <p v-if="giftError" class="gift-err" style="margin-bottom:10px">{{ giftError }}</p>
                                    <button class="gift-cta gift-cta-gold" :disabled="giftSending" @click="sendGift">
                                        <template v-if="giftSending">
                                            <div class="gift-spinner"></div>
                                            {{ lang === 'sw' ? 'Inatuma…' : 'Sending…' }}
                                        </template>
                                        <template v-else>
                                            {{ lang === 'sw' ? 'Tuma Zawadi' : 'Send Gift' }}
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
                                        </template>
                                    </button>
                                </template>

                                <!-- Step: done -->
                                <template v-if="giftStep === 'done'">
                                    <div class="gift-done">
                                        <div class="gift-done-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                                <circle cx="12" cy="12" r="10"/>
                                                <path d="M8 12l3 3 5-6" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </div>
                                        <p class="gift-done-sub">{{ fmtMoney(giftTotal) }} {{ giftCurrency }} — {{ lang === 'sw' ? 'Zawadi yako imetumwa. Asante sana!' : 'Your gift has been sent. Thank you!' }}</p>
                                        <button class="gift-cta" @click="closeGiftSheet">{{ lang === 'sw' ? 'Funga' : 'Done' }}</button>
                                    </div>
                                </template>

                            </div>
                        </Transition>
                    </div>
                </Transition>
            </Teleport>

            <!-- ── Comments bottom-sheet (quick access from hero) ── -->
            <Teleport to="body">
                <Transition name="gift-overlay">
                    <div v-if="showCommentsSheet" class="gift-overlay" @click.self="showCommentsSheet = false">
                        <Transition name="gift-sheet">
                            <div v-if="showCommentsSheet" class="cs-sheet" @click.stop>
                                <div class="cs-handle"></div>
                                <div class="cs-hdr-row">
                                    <p class="cs-title">{{ t('comments') }}<span v-if="comments.length" class="cmnt-count"> ({{ comments.length }})</span></p>
                                    <button class="cs-close" @click="showCommentsSheet = false">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                        </svg>
                                    </button>
                                </div>
                                <div class="cs-list">
                                    <div v-for="c in comments" :key="c.id" class="cmnt-item">
                                        <div class="cmnt-avatar cmnt-avatar-sm"
                                            :style="{ background: c.userColor?.bg, color: c.userColor?.fg }">{{
                                            c.userInitial }}
                                        </div>
                                        <div class="cmnt-body">
                                            <div class="cmnt-meta">
                                                <span class="cmnt-name">{{ c.userName }}</span>
                                                <span class="cmnt-time">{{ fmtCommentTime(c.createdAt) }}</span>
                                            </div>
                                            <p class="cmnt-text">{{ c.text }}</p>
                                        </div>
                                    </div>
                                    <p v-if="!comments.length" class="cmnt-empty">{{ t('noComments') }}</p>
                                </div>
                                <div class="cmnt-compose">
                                    <div class="cmnt-avatar cmnt-avatar-sm" :style="{ background: ac?.bg, color: ac?.fg }">{{
                                        attendeeInitial }}</div>
                                    <input v-model="commentText" class="cmnt-input" :placeholder="t('commentPlaceholder')"
                                        @keydown.enter.prevent="postComment" />
                                    <button class="cmnt-send" :disabled="!commentText.trim() || commentPosting"
                                        @click="postComment">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <line x1="22" y1="2" x2="11" y2="13" />
                                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </Transition>
                    </div>
                </Transition>
            </Teleport>
        </template>
    </div>
</template>

<style scoped>
*,
*::before,
*::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

/* ── Design tokens — this guest-facing page intentionally diverges from the
   app's dark admin theme (src/style.css). Font-family names match Google
   Fonts already loaded globally in index.html. ── */
.page {
    --el-ivory: #FAF6EF;
    --el-cream: #F3ECDD;
    --el-gold: #C9A84C;
    --el-gold-dark: #9C7F32;
    --el-text-main: #241F18;
    --el-text-light: #6b6255;
    --el-radius: 22px;
    --el-transition-slow: all .8s cubic-bezier(.19,1,.22,1);
    --el-transition-fast: all .25s ease;

    min-height: 100vh;
    background: var(--el-ivory);
    color: var(--el-text-main);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
    position: relative;
    overflow-x: hidden;
}

/* ── Loading / Error ──────────────────────────────────────────────────────── */
.center-screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 32px;
    position: relative;
    z-index: 1;
}

.spin-ring {
    width: 38px;
    height: 38px;
    border: 2.5px solid rgba(201, 168, 76, .18);
    border-top-color: var(--el-gold);
    border-radius: 50%;
    animation: elSpin .75s linear infinite;
}

@keyframes elSpin {
    to { transform: rotate(360deg); }
}

.spin-lbl {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: var(--el-text-light);
}

.err-circle {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(201, 168, 76, .10);
    border: 1px solid rgba(201, 168, 76, .3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: var(--el-gold-dark);
}

.err-h {
    font-size: 20px;
    font-weight: 800;
    color: var(--el-text-main);
}

.err-p {
    font-size: 13px;
    color: var(--el-text-light);
    text-align: center;
    line-height: 1.6;
}

/* ── Back to top ──────────────────────────────────────────────────────────── */
.el-back-top {
    position: fixed;
    bottom: 22px;
    right: 22px;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    border: none;
    background: #fff;
    color: var(--el-gold-dark);
    cursor: pointer;
    box-shadow: 0 10px 25px rgba(36, 31, 24, .15);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 40;
    opacity: 0;
    visibility: hidden;
    transform: translateY(16px);
    transition: var(--el-transition-fast);
}
.el-back-top svg { width: 18px; height: 18px; }
.el-back-top-visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

/* ── Comments FAB — always on, bottom-right, pulses to draw the eye since
   the full comment thread lives far down the page ─────────────────────── */
.el-comment-fab {
    position: fixed;
    bottom: 84px;
    right: 22px;
    z-index: 41;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: none;
    background: var(--el-gold-dark);
    color: #fff;
    cursor: pointer;
    box-shadow: 0 10px 25px rgba(36, 31, 24, .28);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: el-comment-bounce 3.6s ease-in-out infinite;
}
.el-comment-fab svg { width: 21px; height: 21px; }
.el-comment-fab-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    animation: el-comment-pulse 2.4s cubic-bezier(.4,0,.3,1) infinite;
    pointer-events: none;
}
.el-comment-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 9px;
    background: #fff;
    color: var(--el-gold-dark);
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(0,0,0,.25);
}
@keyframes el-comment-pulse {
    0% { box-shadow: 0 0 0 0 rgba(201,150,60,.55); }
    70% { box-shadow: 0 0 0 16px rgba(201,150,60,0); }
    100% { box-shadow: 0 0 0 0 rgba(201,150,60,0); }
}
@keyframes el-comment-bounce {
    0%, 75%, 100% { transform: translateY(0); }
    82% { transform: translateY(-7px); }
    89% { transform: translateY(0); }
    93% { transform: translateY(-3px); }
    97% { transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
    .el-comment-fab, .el-comment-fab-ring { animation: none; }
}

/* ── Sound toggle (background music) — sits where the status pill used to,
   top-right of the hero, and scrolls away with it ─────────────────────────── */
.el-sound-toggle {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 6;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, .88);
    color: var(--el-gold-dark);
    cursor: pointer;
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
}
.el-sound-toggle svg { width: 16px; height: 16px; }

/* ── Video intro — organizer-uploaded clip, plays once then dissolves into the hero ── */
.el-video-intro {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: #000;
    cursor: pointer;
}
.el-video-intro-el {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}
.el-video-intro-fade-leave-active { transition: opacity .6s ease; }
.el-video-intro-fade-leave-to { opacity: 0; }
.el-video-intro-tap {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #fff;
    background: rgba(0,0,0,.25);
}
.el-video-intro-tap svg { width: 46px; height: 46px; }
.el-video-intro-tap span { font-size: 11px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }

/* ── Hero ─────────────────────────────────────────────────────────────────── */
.el-hero {
    height: 100vh;
    min-height: 520px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #fff;
    text-align: center;
    overflow: hidden;
    position: relative;
}

.el-hero-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(rgba(20,16,10,.35), rgba(20,16,10,.55)), var(--el-cream);
    background-size: cover;
    background-position: center;
    transform: scale(1.08);
    transition: transform .1s ease-out;
    z-index: 0;
}
.el-hero-bg[style*="background-image"] {
    background-blend-mode: normal;
}

.el-hero-scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom,
        rgba(0,0,0,.34) 0%,
        rgba(0,0,0,.28) 22%,
        rgba(0,0,0,.4) 42%,
        rgba(0,0,0,.46) 58%,
        rgba(0,0,0,.32) 75%,
        rgba(0,0,0,.55) 100%);
    z-index: 1;
}

.el-petals {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 2;
}

.petal {
    position: absolute;
    top: -10%;
    background: rgba(255, 244, 220, .55);
    border-radius: 150% 0 150% 0;
    pointer-events: none;
}

@keyframes elPetalFall {
    0% { top: -10%; }
    100% { top: 110%; }
}
@keyframes elPetalSway {
    0%, 100% { transform: translateX(0) rotate(0deg); }
    50% { transform: translateX(80px) rotate(180deg); }
}

.el-hero-content {
    z-index: 5;
    position: relative;
    padding: 0 20px;
}
@media (min-width: 768px) {
    .el-hero-content { padding-left: 40px; padding-right: 40px; }
}

.el-hero-title {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-weight: 600;
    font-size: clamp(2.2rem, 6vw, 4rem);
    line-height: 1.2;
    letter-spacing: .3px;
    text-shadow: 0 2px 8px rgba(0,0,0,.45), 0 8px 28px rgba(0,0,0,.35);
}

.el-hero-date {
    font-family: 'Playfair Display', serif;
    text-shadow: 0 1px 6px rgba(0,0,0,.5);
    font-size: clamp(1rem, 2vw, 1.3rem);
    letter-spacing: 3px;
    margin-top: 16px;
    opacity: .92;
}

.el-scroll-cue {
    position: absolute;
    bottom: 36px;
    z-index: 5;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}
.el-mouse {
    width: 22px;
    height: 36px;
    border: 1px solid rgba(255,255,255,.55);
    border-radius: 20px;
    position: relative;
}
.el-mouse::after {
    content: '';
    width: 2px;
    height: 6px;
    background: #fff;
    position: absolute;
    left: 50%;
    top: 6px;
    transform: translateX(-50%);
    animation: elScrollDot 2s infinite;
}
@keyframes elScrollDot {
    0% { opacity: 0; transform: translate(-50%, 0); }
    50% { opacity: 1; }
    100% { opacity: 0; transform: translate(-50%, 15px); }
}
.el-scroll-cue span {
    font-size: 9px;
    letter-spacing: .3em;
    text-transform: uppercase;
    font-weight: 600;
    opacity: .7;
    color: #fff;
}

/* ── Scroll-reveal ────────────────────────────────────────────────────────── */
.reveal {
    opacity: 0;
    transform: translateY(36px);
    transition: opacity .9s cubic-bezier(.19,1,.22,1), transform .9s cubic-bezier(.19,1,.22,1);
}
.reveal-active {
    opacity: 1;
    transform: translateY(0);
}

/* ── Content wrapper — same shell width/padding as the landing page (/) ──── */
.el-content {
    max-width: 1140px;
    margin: 0 auto;
    padding: 64px 20px 24px;
    position: relative;
    z-index: 1;
}
@media (min-width: 768px) {
    .el-content { padding-left: 40px; padding-right: 40px; }
}

.el-eyebrow {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .3em;
    text-transform: uppercase;
    color: var(--el-gold-dark);
}
.el-eyebrow-center { text-align: center; margin-bottom: 10px; }

.el-section-title {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-weight: 600;
    letter-spacing: .3px;
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    text-align: center;
    margin-bottom: 40px;
    color: var(--el-text-main);
}

.el-glass-card {
    background: rgba(255, 255, 255, .74);
    backdrop-filter: blur(16px) saturate(1.4);
    -webkit-backdrop-filter: blur(16px) saturate(1.4);
    border: 1px solid rgba(201, 168, 76, .18);
    border-radius: var(--el-radius);
    box-shadow: 0 20px 50px rgba(90, 70, 30, .08);
}

/* ── Invitation ───────────────────────────────────────────────────────────── */
.el-invite {
    text-align: center;
    padding: 12px 0 44px;
}
.el-invite-name {
    position: relative;
    display: inline-block;
    font-family: 'Playfair Display', serif;
    font-weight: 600;
    font-style: italic;
    letter-spacing: .3px;
    font-size: clamp(1.8rem, 4.6vw, 2.8rem);
    line-height: 1.3;
    color: var(--el-text-main);
    padding-bottom: 18px;
    margin: 8px 0 30px;
}
.el-invite-name::after {
    content: '';
    position: absolute;
    left: 6%;
    right: 6%;
    bottom: 0;
    height: 1.5px;
    background: linear-gradient(90deg, transparent, var(--el-gold) 12%, var(--el-gold) 88%, transparent);
}
.el-invite-line {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 500;
    font-size: 1.3rem;
    line-height: 1.55;
    color: var(--el-text-main);
    margin: 0 0 14px;
}
.el-invite-text {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 400;
    font-style: italic;
    font-size: 1.25rem;
    line-height: 1.85;
    color: var(--el-text-main);
    white-space: pre-line;
}
.el-divider {
    width: 46px;
    height: 1px;
    background: var(--el-gold);
    margin: 34px auto 0;
}

/* ── Countdown ────────────────────────────────────────────────────────────── */
.el-countdown-wrap { padding-bottom: 44px; }
.el-countdown-card {
    text-align: center;
    padding: 40px 24px;
}
.el-countdown {
    display: flex;
    justify-content: center;
    gap: clamp(14px, 5vw, 44px);
    margin-top: 8px;
}
.el-count-item span {
    display: block;
    font-family: 'Playfair Display', serif;
    font-size: clamp(2rem, 7vw, 2.9rem);
    color: var(--el-gold-dark);
    line-height: 1;
    margin-bottom: 8px;
}
.el-count-item label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: var(--el-text-light);
}

/* ── Details / venue ──────────────────────────────────────────────────────── */
.el-details { padding-bottom: 44px; }
.el-details-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
}
@media (max-width: 640px) {
    .el-details-grid { grid-template-columns: 1fr; }
}
.el-details-card {
    display: flex;
    flex-direction: column;
    padding: 34px 26px;
    text-align: left;
}
/* Grid rows stretch cards to equal height by default; pinning the footer to
   the bottom of that shared height is what keeps the date badge and map
   link lined up across cards, regardless of how many lines the address or
   description above happens to take. */
.el-details-card-footer {
    margin-top: auto;
    padding-top: 18px;
}
.el-venue-date {
    margin: 0 0 20px;
    padding: 12px 14px;
    border: 1px solid rgba(201, 168, 76, .35);
    border-radius: 10px;
    text-align: center;
    font-family: 'Inter', sans-serif;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--el-text-main);
}
.el-details-single { text-align: center; max-width: 480px; margin: 0 auto; }
.el-card-title {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-weight: 600;
    letter-spacing: .3px;
    font-size: 1.7rem;
    line-height: 1.3;
    /* Reserves 2 lines' worth of height so a short one-line address and a
       longer two-line one still push the content below them down by the
       same amount, keeping cards in a row aligned. */
    min-height: 2.6em;
    margin: 6px 0 18px;
    color: var(--el-text-main);
}
.el-card-body {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 500;
    font-size: 15px;
    color: var(--el-text-light);
    line-height: 1.7;
}
.el-card-body--clamped {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.el-card-readmore {
    display: block;
    margin-top: 8px;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: .04em;
    color: var(--el-gold-dark);
}
.el-card-readmore:hover { text-decoration: underline; }
.el-map-link {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--el-gold-dark);
    text-decoration: none;
    border-bottom: 1px solid rgba(201,168,76,.5);
    padding-bottom: 2px;
}
.el-venues-map {
    margin-top: 24px;
    height: 340px;
    border-radius: var(--el-radius);
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(90, 70, 30, .12);
}

/* ── Programme timeline ───────────────────────────────────────────────────── */
.el-programme { padding-bottom: 44px; }
.el-htimeline {
    display: flex;
    align-items: flex-start;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
    padding: 4px 6px 16px;
    margin: 0 -6px;
}
.el-htimeline::-webkit-scrollbar { height: 5px; }
.el-htimeline::-webkit-scrollbar-track { background: transparent; }
.el-htimeline::-webkit-scrollbar-thumb { background: rgba(201, 168, 76, .35); border-radius: 3px; }
.el-htimeline-item {
    position: relative;
    flex: 0 0 auto;
    width: 190px;
    padding: 0 18px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    scroll-snap-align: start;
}
.el-htimeline-dot-row {
    position: relative;
    width: 100%;
    height: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
}
.el-htimeline-connector {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 1px;
    background: rgba(201, 168, 76, .5);
    transform: translateY(-50%);
}
.el-htimeline-item--first .el-htimeline-connector { left: 50%; }
.el-htimeline-item--last .el-htimeline-connector { right: 50%; }
.el-htimeline-dot {
    position: relative;
    z-index: 1;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--el-ivory);
    border: 1.5px solid var(--el-gold-dark);
    flex-shrink: 0;
}
.el-htimeline-time {
    display: block;
    font-family: 'Inter', sans-serif;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--el-gold-dark);
    margin-bottom: 7px;
}
.el-htimeline-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.15rem;
    font-weight: 400;
    color: var(--el-text-main);
    margin-bottom: 5px;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: calc(1.3em * 2);
}
.el-htimeline-desc {
    font-size: 11.5px;
    color: var(--el-text-light);
    line-height: 1.55;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: calc(1.55em * 2);
}

/* Below ~2 items fit comfortably per screen — flip to a vertical line instead
   of a horizontal scroller that only ever shows a sliver of the next item. */
@media (max-width: 640px) {
    .el-htimeline {
        flex-direction: column;
        overflow: visible;
        padding: 4px 4px 0 26px;
        margin: 0;
    }
    .el-htimeline::-webkit-scrollbar { display: none; }
    .el-htimeline-item {
        width: auto;
        padding: 0 0 32px;
        align-items: flex-start;
        text-align: left;
        scroll-snap-align: none;
    }
    .el-htimeline-item:last-child { padding-bottom: 0; }
    .el-htimeline-dot-row {
        position: absolute;
        left: -26px;
        top: 4px;
        width: 9px;
        height: 9px;
        margin-bottom: 0;
    }
    .el-htimeline-connector,
    .el-htimeline-item--first .el-htimeline-connector,
    .el-htimeline-item--last .el-htimeline-connector {
        left: 4px;
        right: auto;
        top: 9px;
        bottom: -41px;
        width: 1px;
        height: auto;
        transform: none;
    }
    .el-htimeline-item:last-child .el-htimeline-connector { display: none; }
    .el-htimeline-title,
    .el-htimeline-desc { text-align: left; }

    /* Collapsed by default — first 4 items only, rest revealed via el-prog-more */
    .el-htimeline:not(.el-htimeline--expanded) .el-htimeline-item:nth-child(n+5) { display: none; }
    .el-htimeline:not(.el-htimeline--expanded) .el-htimeline-item:nth-child(4) .el-htimeline-connector { display: none; }
    .el-htimeline:not(.el-htimeline--expanded) .el-htimeline-item:nth-child(4) { padding-bottom: 0; }

    .el-prog-more {
        display: block;
        margin: 4px auto 0;
        padding: 10px 22px;
        background: none;
        border: 1px solid rgba(201, 168, 76, .4);
        border-radius: 999px;
        font-family: 'Inter', sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .1em;
        text-transform: uppercase;
        color: var(--el-gold-dark);
        cursor: pointer;
    }
}
@media (min-width: 641px) {
    .el-prog-more { display: none; }
}

/* ── Artwork sections (food & beverages, dress code) ─────────────────────── */
.el-artwork-section { padding-bottom: 44px; }
.el-artwork-frame {
    position: relative;
    border-radius: var(--el-radius);
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(90, 70, 30, .12);
    cursor: pointer;
}
.el-artwork-img {
    display: block;
    width: 100%;
    height: auto;
}

/* ── Master of Ceremonies ─────────────────────────────────────────────────── */
.el-mc { padding-bottom: 44px; }
.el-mc-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: center;
}
@media (max-width: 720px) {
    .el-mc-split { grid-template-columns: 1fr; }
    .el-mc-photo-frame { width: 100%; max-height: none; }
}
.el-mc-photo-frame {
    aspect-ratio: 4 / 5;
    max-height: 360px;
    border-radius: var(--el-radius);
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(90, 70, 30, .12);
    cursor: pointer;
}
.el-mc-photo {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
}
.el-mc-info { text-align: left; }
.el-mc-badge {
    display: inline-block;
    padding: 7px 16px;
    border-radius: 999px;
    background: rgba(201, 168, 76, .12);
    font-family: 'Inter', sans-serif;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--el-gold-dark);
    margin-bottom: 18px;
}
.el-mc-name {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: clamp(2.2rem, 5vw, 3rem);
    font-weight: 600;
    letter-spacing: .3px;
    color: var(--el-text-main);
    margin-bottom: 20px;
    line-height: 1.15;
}
.el-mc-rule {
    width: 46px;
    height: 1px;
    background: var(--el-gold);
    margin-bottom: 24px;
}
.el-mc-bio {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 16.5px;
    line-height: 1.8;
    color: var(--el-text-light);
    max-width: 46ch;
}
@media (max-width: 720px) {
    .el-mc-info { text-align: center; }
    .el-mc-rule { margin-left: auto; margin-right: auto; }
    .el-mc-bio { max-width: none; margin-left: auto; margin-right: auto; }
}

/* ── Gallery ──────────────────────────────────────────────────────────────── */
.el-gallery-outer { padding-bottom: 8px; }
.gallery-section { margin-bottom: 24px; }
.gallery-section-hdr {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 10px;
    padding: 0 2px;
    color: var(--el-gold-dark);
}
.gallery-section-hdr svg { width: 15px; height: 15px; flex-shrink: 0; }
.gallery-section-hdr span:first-of-type {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .4px;
    text-transform: uppercase;
    color: var(--el-text-main);
}
.gallery-section-count {
    font-size: 11px;
    font-weight: 600;
    color: var(--el-gold-dark);
    background: rgba(201, 168, 76, .14);
    padding: 2px 7px;
    border-radius: 99px;
}
.gallery-expand-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    margin-top: 8px;
    padding: 11px;
    background: rgba(201, 168, 76, .06);
    border: 1px solid rgba(201, 168, 76, .25);
    border-radius: 12px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .3px;
    color: var(--el-gold-dark);
    font-family: inherit;
    cursor: pointer;
    transition: background .15s;
}
.gallery-expand-btn svg { width: 14px; height: 14px; flex-shrink: 0; }
.gallery-expand-btn:active { background: rgba(201, 168, 76, .14); }

.gallery-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: 160px;
    gap: 8px;
}
.gallery-cell {
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    background: var(--el-cream);
    box-shadow: 0 8px 20px rgba(90,70,30,.08);
}
.gallery-cell.gallery-tall { grid-row: span 2; }
.gallery-cell img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform .35s ease, opacity .3s;
    display: block;
}
.gallery-cell:hover img { transform: scale(1.04); }
.gallery-cell:active img { transform: scale(1.04); opacity: .85; }

.gcc, .glk {
    position: absolute;
    bottom: 8px;
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 4px 7px 4px 5px;
    border-radius: 99px;
    border: none;
    background: rgba(0, 0, 0, .52);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    color: #fff;
    cursor: pointer;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity .18s ease, transform .18s ease, background .15s;
    pointer-events: none;
    z-index: 2;
}
.gcc { right: 8px; }
.glk { left: 8px; color: rgba(255, 255, 255, .8); }
.gcc svg, .glk svg { width: 13px; height: 13px; flex-shrink: 0; }
.gcc-count, .glk-count { font-size: 11px; font-weight: 600; line-height: 1; }
.glk-liked { color: #FF4B6E; }
.gallery-cell:hover .gcc, .gallery-cell:focus-within .gcc,
.gallery-cell:hover .glk, .gallery-cell:focus-within .glk {
    opacity: 1; transform: translateY(0); pointer-events: auto;
}
@media (hover: none) {
    .gcc, .glk { opacity: 1; transform: none; pointer-events: auto; }
}
.gcc:active { background: rgba(90, 138, 219, .65); }
.glk:active { background: rgba(255, 75, 110, .35); }

.gallery-video-cell { background: #2a241a; }
.gallery-video-thumb { width: 100%; height: 100%; position: relative; }
.gallery-video-thumb video { width: 100%; height: 100%; object-fit: cover; display: block; opacity: .8; }
.gallery-play-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
.gallery-play-overlay svg { width: 44px; height: 44px; color: #fff; filter: drop-shadow(0 2px 8px rgba(0,0,0,.4)); }
.gallery-cell:active .gallery-play-overlay svg { opacity: .7; transform: scale(.9); }

.gallery-spinner { display: flex; justify-content: center; padding: 48px 0; }
.gallery-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 56px 32px;
}
.gallery-empty-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(201, 168, 76, .10);
    border: 1px solid rgba(201, 168, 76, .3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-gold-dark);
}
.gallery-empty-icon svg { width: 24px; height: 24px; }
.gallery-empty-txt { font-size: 14px; color: var(--el-text-light); font-weight: 600; }
.gallery-more-btn {
    display: block;
    width: 100%;
    margin-top: 10px;
    padding: 13px;
    background: rgba(255,255,255,.7);
    border: 1px solid rgba(201, 168, 76, .3);
    border-radius: 14px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-gold-dark);
    font-family: inherit;
    cursor: pointer;
    transition: background .18s, border-color .18s;
}
.gallery-more-btn:disabled { opacity: .4; cursor: default; }
.gallery-more-btn:not(:disabled):active { background: rgba(201, 168, 76, .12); }

/* ── Host ─────────────────────────────────────────────────────────────────── */
.el-host { text-align: center; padding-bottom: 44px; }
.el-host-body {
    max-width: 480px;
    margin: 0 auto;
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 16px;
    line-height: 1.8;
    color: var(--el-text-light);
}

/* ── Section cards (Gift of Love / Comments) ─────────────────────────────── */
.section-card {
    background: rgba(255, 255, 255, .8);
    border: 1px solid rgba(201, 168, 76, .2);
    border-radius: 20px;
    padding: 22px;
    margin-bottom: 20px;
    box-shadow: 0 12px 30px rgba(90, 70, 30, .07);
    backdrop-filter: blur(14px);
}
.s-hdr {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
}
.s-bar { width: 3px; height: 13px; background: var(--el-gold); border-radius: 2px; flex-shrink: 0; }
.s-lbl {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.3px;
    text-transform: uppercase;
    color: var(--el-text-light);
}
.cmnt-count { color: var(--el-gold-dark); font-weight: 700; }

/* ── Contacts ─────────────────────────────────────────────────────────────── */
.el-contacts { padding-bottom: 44px; }
.el-contacts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
}
@media (max-width: 560px) {
    .el-contacts-grid { grid-template-columns: 1fr; }
}
.el-contact-card {
    padding: 32px 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.el-contact-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 1.35rem;
    font-weight: 600;
    margin-bottom: 16px;
    flex-shrink: 0;
}
.el-contact-name {
    font-family: 'Playfair Display', serif;
    font-size: 1.2rem;
    color: var(--el-text-main);
    margin-bottom: 4px;
}
.el-contact-role {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--el-text-light);
    margin-bottom: 6px;
}
.el-contact-phone {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-top: 14px;
    padding: 9px 18px;
    border-radius: 999px;
    border: 1px solid rgba(201, 168, 76, .35);
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-gold-dark);
    text-decoration: none;
    transition: background .15s, border-color .15s;
}
.el-contact-phone:hover { background: rgba(201, 168, 76, .08); border-color: var(--el-gold); }
.el-contact-phone svg { width: 14px; height: 14px; }

.support-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 13px;
    background: rgba(255,255,255,.75);
    border: 1px solid rgba(201, 168, 76, .25);
    border-radius: 16px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-light);
    text-decoration: none;
    transition: color .2s, border-color .2s, background .2s;
    margin-bottom: 20px;
}
.support-link svg { width: 15px; height: 15px; }
.support-link:hover { color: var(--el-gold-dark); border-color: rgba(201, 168, 76, .45); }

/* ── Zawadi / Gift of Love ────────────────────────────────────────────────── */
.zawadi-section {
    background: linear-gradient(135deg, rgba(255,251,240,.92) 0%, rgba(250,240,215,.92) 100%);
    border: 1px solid rgba(201,168,76,.35);
}
.zawadi-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 28px 0 10px;
    color: rgba(36,31,24,.35);
    font-size: 13px;
}
.zawadi-empty svg { width: 36px; height: 36px; stroke: rgba(201,168,76,.5); }
.zawadi-list { display: flex; flex-direction: column; }
.zawadi-item { padding: 14px 0; cursor: pointer; transition: opacity .15s; }
.zawadi-item:active { opacity: .7; }
.zawadi-item-sep { border-bottom: 1px solid rgba(201,168,76,.18); }
.zawadi-item-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.zawadi-item-icon {
    flex-shrink: 0;
    width: 38px;
    height: 38px;
    border-radius: 11px;
    background: rgba(201,168,76,.16);
    border: 1px solid rgba(201,168,76,.35);
    display: flex;
    align-items: center;
    justify-content: center;
}
.zawadi-item-icon svg { width: 18px; height: 18px; stroke: var(--el-gold-dark); }
.zawadi-item-info { flex: 1; min-width: 0; }
.zawadi-item-title { font-size: 14px; font-weight: 600; color: var(--el-text-main); margin: 0 0 2px; word-break: break-word; }
.zawadi-item-desc {
    font-size: 12px;
    color: var(--el-text-light);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.zawadi-item-desc--expanded { display: block; overflow: visible; }
.zawadi-read-more { background: none; border: none; padding: 2px 0 0; font-size: 11px; color: var(--el-gold-dark); cursor: pointer; line-height: 1; }
.zawadi-item-chevron { flex-shrink: 0; width: 16px; height: 16px; stroke: rgba(201,168,76,.7); }
.zawadi-progress-wrap { margin-bottom: 10px; }
.zawadi-progress-bar { height: 5px; background: rgba(36,31,24,.08); border-radius: 3px; overflow: hidden; }
.zawadi-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, rgba(201,168,76,.7), var(--el-gold-dark));
    border-radius: 3px;
    transition: width .4s ease;
    min-width: 3px;
}
.zawadi-item-foot { display: flex; align-items: center; gap: 10px; }
.zawadi-amounts { flex: 1; min-width: 0; }
.zawadi-funded { font-size: 13px; font-weight: 700; color: var(--el-gold-dark); }
.zawadi-target { font-size: 12px; color: var(--el-text-light); }
.zawadi-avatars { display: flex; align-items: center; }
.zawadi-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid var(--el-ivory);
    margin-left: -6px;
    flex-shrink: 0;
}
.zawadi-avatars .zawadi-avatar:first-child { margin-left: 0; }
.zawadi-avatar-more { background: rgba(36,31,24,.08); color: var(--el-text-light); font-size: 8px; }
.zawadi-no-gifts { font-size: 11px; color: rgba(201,168,76,.8); }

/* ── Comments ─────────────────────────────────────────────────────────────── */
.cmnt-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; max-height: 380px; overflow-y: auto; padding-right: 4px; }
.cmnt-item { display: flex; gap: 10px; }
.cmnt-avatar { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; }
.cmnt-avatar-sm { width: 28px; height: 28px; font-size: 11px; }
.cmnt-body { flex: 1; min-width: 0; }
.cmnt-meta { display: flex; align-items: baseline; gap: 7px; margin-bottom: 3px; min-width: 0; }
.cmnt-name { font-size: 11px; font-weight: 600; color: var(--el-text-main); flex: 1; min-width: 0; word-break: break-word; }
.cmnt-time { font-size: 10px; color: var(--el-text-light); flex-shrink: 0; white-space: nowrap; }
.cmnt-text { font-size: 13px; color: rgba(36,31,24,.78); line-height: 1.5; }
.cmnt-actions { display: flex; gap: 12px; margin-top: 6px; }
.cmnt-reply-btn, .cmnt-view-replies { background: none; border: none; cursor: pointer; padding: 0; font-size: 11px; font-weight: 600; letter-spacing: .4px; text-transform: uppercase; font-family: inherit; }
.cmnt-reply-btn { color: var(--el-gold-dark); }
.cmnt-view-replies { color: var(--el-text-light); }
.cmnt-replies { margin-top: 10px; padding-left: 10px; border-left: 2px solid rgba(201,168,76,.25); display: flex; flex-direction: column; gap: 12px; }
.cmnt-reply-form { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.cmnt-empty { font-size: 13px; color: var(--el-text-light); text-align: center; padding: 12px 0 16px; }
.cmnt-compose { display: flex; align-items: center; gap: 8px; padding-top: 14px; border-top: 1px solid rgba(201,168,76,.2); }
.cmnt-input {
    flex: 1;
    background: rgba(255,255,255,.8);
    border: 1px solid rgba(201,168,76,.3);
    border-radius: 20px;
    padding: 9px 14px;
    font-size: 13px;
    color: var(--el-text-main);
    outline: none;
    font-family: inherit;
    transition: border-color .18s, background .18s;
}
.cmnt-input::placeholder { color: rgba(36,31,24,.35); }
.cmnt-input:focus { border-color: var(--el-gold); background: #fff; }
.cmnt-send {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--el-gold-dark);
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity .15s;
}
.cmnt-send:disabled { opacity: .3; cursor: default; }
.cmnt-send svg { width: 13px; height: 13px; color: #fff; }

/* ── Entry Pass ───────────────────────────────────────────────────────────── */
.el-pass { padding-bottom: 12px; }
.el-pass-card { padding: 28px 24px; max-width: 420px; margin: 0 auto; }

.stub-main { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; }
.stub-avatar { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; }
.stub-initial { font-size: 26px; font-weight: 800; letter-spacing: -.5px; line-height: 1; }
.stub-avatar-ring { position: absolute; inset: -3px; border-radius: 50%; border: 1.5px solid; }
.stub-info { min-width: 0; }
.stub-badge {
    display: inline-flex;
    padding: 3px 10px;
    background: rgba(201, 168, 76, .18);
    border: .7px solid rgba(201, 168, 76, .4);
    border-radius: 99px;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .8px;
    text-transform: uppercase;
    color: var(--el-gold-dark);
    margin-bottom: 6px;
}
.stub-name { font-size: 16px; font-weight: 700; color: var(--el-text-main); letter-spacing: -.2px; line-height: 1.3; word-break: break-word; margin-bottom: 3px; }
.stub-phone { font-size: 12px; color: var(--el-text-light); }

.el-pass-qr-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 18px;
    margin-bottom: 16px;
    background: var(--el-ivory);
    border: 1px solid rgba(201, 168, 76, .25);
    border-radius: 16px;
}
.el-pass-qr { width: 168px; height: 168px; border-radius: 8px; }
.el-pass-qr-hint {
    margin-top: 12px;
    font-size: 11.5px;
    font-style: italic;
    color: var(--el-text-light);
    text-align: center;
}
.el-pass-note { text-align: center; }
.el-pass-note-text {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 13.5px;
    line-height: 1.8;
    color: var(--el-text-light);
    max-width: 46ch;
    margin: 0 auto;
    white-space: pre-line;
}

.view-card-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 9px 14px;
    border-radius: 10px;
    border: 1px solid rgba(90, 138, 219, .35);
    background: rgba(90, 138, 219, .08);
    color: #4472B8;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background .15s, opacity .15s;
    margin-bottom: 8px;
}
.view-card-btn svg { width: 15px; height: 15px; flex-shrink: 0; }
.view-card-btn:active { opacity: .7; }
.view-card-btn:hover { background: rgba(90, 138, 219, .15); }

.stub-status { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 12px; cursor: pointer; transition: opacity .15s; }
.stub-status:active { opacity: .75; }
.status-in { background: rgba(29, 171, 75, .08); border: 1px solid rgba(29, 171, 75, .25); }
.status-declined { background: rgba(224, 90, 90, .08); border: 1px solid rgba(224, 90, 90, .25); }
.status-pending { background: rgba(212, 130, 10, .10); border: 1px solid rgba(212, 130, 10, .3); animation: elPendingPulse 2s ease infinite; }
@keyframes elPendingPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(212, 130, 10, .15); }
    50% { box-shadow: 0 0 0 5px rgba(212, 130, 10, 0); }
}
.status-indicator { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
.status-in .status-indicator { color: #1DAB4B; }
.status-declined .status-indicator { color: #E05A5A; }
.status-pending .status-indicator { color: #D4820A; }
.status-led { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.led-green { background: #1DAB4B; box-shadow: 0 0 7px rgba(29, 171, 75, .5); animation: elBlink 2s ease infinite; }
.led-amber { background: #D4820A; animation: elBlink 1.4s ease infinite; }
.led-red { background: #E05A5A; }
@keyframes elBlink { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
.status-right { display: flex; align-items: center; gap: 6px; }
.check-mark { width: 18px; height: 18px; flex-shrink: 0; }
.status-change-lbl { font-size: 10px; font-weight: 600; letter-spacing: .3px; color: var(--el-text-light); white-space: nowrap; }

/* ── Footer ───────────────────────────────────────────────────────────────── */
.el-footer {
    background: #fff;
    text-align: center;
    padding: 70px 20px;
    position: relative;
    z-index: 1;
}
.el-footer-title {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-weight: 600;
    font-size: 2rem;
    letter-spacing: .3px;
    color: var(--el-text-main);
}
.el-footer-date {
    font-family: 'Playfair Display', serif;
    letter-spacing: 4px;
    font-size: .9rem;
    color: var(--el-text-light);
    margin-top: 6px;
}
.el-footer-credit {
    font-size: 9px;
    letter-spacing: .2em;
    text-transform: uppercase;
    color: rgba(36,31,24,.35);
    margin-top: 36px;
}

/* ══════════════════════════════════════════════════════════════════════════
   Below: full-screen overlays (RSVP prompt, gallery lightbox, gift payment
   sheet, media-comments sheet, Pesapal return toast). These are independent
   dark modals/toasts — kept as-is regardless of the page's light theme,
   same as the rest of the app's overlay pattern.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── RSVP Overlay ─────────────────────────────────────────────────────────── */
.rsvp-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0, 0, 0, .78);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0;
}

@media (min-height: 600px) {
    .rsvp-overlay {
        align-items: center;
        padding: 20px;
    }
}

.rsvp-card {
    width: 100%;
    max-width: 420px;
    background: #1C1C1E;
    border: 1px solid rgba(201, 150, 60, .25);
    border-radius: 28px 28px 0 0;
    padding: 32px 24px 28px;
    text-align: center;
    animation: rsvpUp .4s cubic-bezier(.22, 1, .36, 1) both;
    box-shadow: 0 -20px 60px rgba(0, 0, 0, .5);
}

@media (min-height: 600px) {
    .rsvp-card { border-radius: 28px; }
}

@keyframes rsvpUp {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
}

.rsvp-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(201, 150, 60, .12);
    border: 1px solid rgba(201, 150, 60, .3);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 18px;
    color: #C9963C;
}
.rsvp-icon svg { width: 26px; height: 26px; }

.rsvp-title { font-size: 19px; font-weight: 800; color: #EEEEF0; margin-bottom: 6px; }
.rsvp-event { font-size: 13px; font-weight: 600; color: #C9963C; margin-bottom: 10px; }
.rsvp-sub { font-size: 13px; color: rgba(238, 238, 240, .5); line-height: 1.6; margin-bottom: 26px; }
.rsvp-actions { display: flex; flex-direction: column; gap: 10px; }

.rsvp-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 15px;
    border-radius: 14px;
    border: none;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: opacity .15s, transform .1s;
}
.rsvp-btn:disabled { opacity: .5; cursor: default; }
.rsvp-btn svg { width: 18px; height: 18px; }
.rsvp-confirm { background: #C9963C; color: #1A1A1A; }
.rsvp-confirm:not(:disabled):active { transform: scale(.98); }
.rsvp-decline { background: rgba(255, 255, 255, .06); color: rgba(238, 238, 240, .7); border: 1px solid rgba(255, 255, 255, .1); }
.rsvp-decline:not(:disabled):active { transform: scale(.98); }

.rsvp-fade-enter-active, .rsvp-fade-leave-active { transition: opacity .25s ease; }
.rsvp-fade-enter-from, .rsvp-fade-leave-to { opacity: 0; }

/* ── Lightbox ─────────────────────────────────────────────────────────────── */
.lb-overlay {
    position: fixed;
    inset: 0;
    z-index: 300;
    background: rgba(0, 0, 0, .96);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    touch-action: none;
}

.lb-close {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 5;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: rgba(255, 255, 255, .12);
    border: none;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}
.lb-close svg { width: 18px; height: 18px; }

.lb-img { max-width: 96vw; max-height: 88vh; object-fit: contain; touch-action: none; user-select: none; }
.lb-video { max-width: 96vw; max-height: 88vh; }

.lb-folder-badge {
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 5;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .3px;
    color: rgba(255, 255, 255, .8);
    background: rgba(255, 255, 255, .1);
    padding: 5px 12px;
    border-radius: 99px;
}

.lb-fade-enter-active, .lb-fade-leave-active { transition: opacity .25s ease; }
.lb-fade-enter-from, .lb-fade-leave-to { opacity: 0; }

.lb-like-btn {
    position: absolute;
    bottom: 24px;
    left: 24px;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 14px;
    border-radius: 99px;
    border: none;
    background: rgba(255, 255, 255, .12);
    color: rgba(255, 255, 255, .85);
    cursor: pointer;
}
.lb-like-btn svg { width: 18px; height: 18px; }
.lb-like-btn-active { color: #FF4B6E; background: rgba(255, 75, 110, .18); }
.lb-like-btn:active { transform: scale(.94); }
.lb-like-badge { font-size: 12px; font-weight: 700; }

.lb-comment-btn {
    position: absolute;
    bottom: 24px;
    right: 24px;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 14px;
    border-radius: 99px;
    border: none;
    background: rgba(255, 255, 255, .12);
    color: rgba(255, 255, 255, .85);
    cursor: pointer;
}
.lb-comment-btn svg { width: 18px; height: 18px; }
.lb-comment-btn-active { background: #C9963C; color: #1A1A1A; }
.lb-comment-btn:active { transform: scale(.94); }
.lb-comment-badge { font-size: 12px; font-weight: 700; }

.mc-sheet {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 60vh;
    background: #1C1C1E;
    border-radius: 24px 24px 0 0;
    padding: 12px 18px 18px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 -20px 50px rgba(0, 0, 0, .5);
}
.mc-handle { width: 36px; height: 4px; border-radius: 2px; background: rgba(255, 255, 255, .2); margin: 0 auto 14px; }
.mc-title { font-size: 13px; font-weight: 700; color: #EEEEF0; letter-spacing: .3px; text-transform: uppercase; margin-bottom: 14px; }
.mc-list { overflow-y: auto; flex: 1; margin-bottom: 12px; }
.mc-list .cmnt-item { margin-bottom: 14px; }
.mc-list .cmnt-name, .mc-list .cmnt-text { color: #EEEEF0; }
.mc-list .cmnt-time { color: rgba(238,238,240,.4); }
.mc-empty { padding: 24px 0; }
.mc-compose { padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, .08); }
.mc-compose .cmnt-input { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.12); color: #EEEEF0; }
.mc-compose .cmnt-input::placeholder { color: rgba(238,238,240,.3); }

.mc-slide-enter-active, .mc-slide-leave-active { transition: transform .3s cubic-bezier(.32,1,.4,1); }
.mc-slide-enter-from, .mc-slide-leave-to { transform: translateY(100%); }

/* ── Gift overlay + sheet (payment) ──────────────────────────────────────── */
.gift-overlay {
    position: fixed;
    inset: 0;
    z-index: 400;
    background: rgba(0, 0, 0, .78);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
}
.gift-sheet {
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    background: #1C1C1E;
    border-radius: 26px 26px 0 0;
    padding: 14px 22px 30px;
    box-shadow: 0 -20px 60px rgba(0, 0, 0, .5);
}
.gift-sheet-handle { width: 36px; height: 4px; border-radius: 2px; background: rgba(255, 255, 255, .2); margin: 0 auto 18px; }
.cs-sheet {
    /* Teleported to <body>, so it sits outside .page's DOM subtree and can't
       see the --el-* tokens defined there — redeclare them here so every
       var(--el-*) used by the nested .cmnt-* elements resolves correctly
       instead of falling through to the app's (dark) global theme. */
    --el-ivory: #FAF6EF;
    --el-gold: #C9A84C;
    --el-gold-dark: #9C7F32;
    --el-text-main: #241F18;
    --el-text-light: #6b6255;
    width: 100%;
    max-width: 480px;
    max-height: 74vh;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    background: var(--el-ivory);
    border-radius: 26px 26px 0 0;
    padding: 14px 22px 24px;
    box-shadow: 0 -20px 60px rgba(36, 31, 24, .25);
}
.cs-handle { width: 36px; height: 4px; border-radius: 2px; background: rgba(36, 31, 24, .15); margin: 0 auto 18px; }
.cs-hdr-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.cs-title { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: var(--el-gold-dark); flex: 1; min-width: 0; }
.cs-close {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: rgba(201, 168, 76, .12);
    color: var(--el-gold-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
}
.cs-close svg { width: 16px; height: 16px; }
.cs-close:hover { background: rgba(201, 168, 76, .22); }
.cs-list { overflow-y: auto; flex: 1; margin-bottom: 12px; }
.cs-list .cmnt-item { margin-bottom: 14px; }

.gift-hdr-row { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
.gift-hdr-identity { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.gift-hdr-icon {
    width: 30px;
    height: 30px;
    border-radius: 9px;
    background: rgba(201,150,60,.14);
    border: 1px solid rgba(201,150,60,.3);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.gift-hdr-icon svg { width: 15px; height: 15px; stroke: #C9963C; }
.gift-hdr-title { font-size: 15px; font-weight: 700; color: #EEEEF0; flex: 1; min-width: 0; word-break: break-word; }
.gift-hdr-identity .gift-hdr-title { flex: 1; }
.gift-hdr-back {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: rgba(255,255,255,.06);
    color: rgba(238,238,240,.7);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
}
.gift-hdr-back:hover { color: #EEEEF0; }
.gift-hdr-back svg { width: 20px; height: 20px; }
.gift-sheet-close {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: rgba(255,255,255,.06);
    color: rgba(238,238,240,.7);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
}
.gift-sheet-close:hover { color: #EEEEF0; }
.gift-sheet-close svg { width: 18px; height: 18px; }

.gift-sheet-sub { font-size: 13px; color: rgba(238,238,240,.55); margin-bottom: 18px; line-height: 1.6; }

.gift-presets { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
.gift-preset {
    padding: 14px 8px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.04);
    color: #EEEEF0;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: background .15s, border-color .15s;
}
.gift-preset:hover { background: rgba(201,150,60,.12); border-color: rgba(201,150,60,.4); }
.gift-preset-active { border-color: #C9963C !important; background: rgba(201,150,60,.18) !important; }
.gift-preset-cur { font-size: 10px; font-weight: 400; color: rgba(201,150,60,.7); }

.gift-custom-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.04);
    margin-bottom: 10px;
}
.gift-custom-wrap:focus-within { border-color: rgba(201,150,60,.5); }
.gift-custom-prefix { font-size: 13px; font-weight: 700; color: rgba(238,238,240,.4); }
.gift-custom-input { flex: 1; background: none; border: none; color: #EEEEF0; font-size: 15px; font-family: inherit; outline: none; }
.gift-custom-input::placeholder { color: rgba(255,255,255,.25); }
.gift-custom-input::-webkit-outer-spin-button, .gift-custom-input::-webkit-inner-spin-button { -webkit-appearance: none; }

.gift-err { font-size: 11.5px; color: #e07070; margin: 0 0 10px; }

.gift-amount-pill {
    display: inline-flex;
    padding: 8px 18px;
    border-radius: 99px;
    background: rgba(201,150,60,.14);
    border: 1px solid rgba(201,150,60,.3);
    color: #e8d5a0;
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 16px;
}
.gift-note-ta {
    width: 100%;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 12px;
    padding: 12px 14px;
    color: #EEEEF0;
    font-size: 14px;
    font-family: inherit;
    resize: none;
    outline: none;
}
.gift-note-ta:focus { border-color: rgba(201,150,60,.45); }
.gift-note-ta::placeholder { color: rgba(255,255,255,.25); }
.gift-char-count { font-size: 11px; color: rgba(255,255,255,.3); text-align: right; margin: 4px 0 14px; }

.gift-confirm-card {
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 14px;
    padding: 16px;
    margin-bottom: 14px;
}
.gift-confirm-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,.06); }
.gift-confirm-row:last-child { border-bottom: none; }
.gift-confirm-note-row { flex-direction: column; gap: 5px; }
.gift-confirm-lbl { font-size: 12px; color: rgba(255,255,255,.4); }
.gift-confirm-val { font-size: 14px; color: #e8d5a0; text-align: right; max-width: 60%; word-break: break-word; }
.gift-confirm-amt { font-size: 17px; font-weight: 700; color: #e8c870; }
.gift-confirm-note { font-size: 13px; text-align: left; max-width: 100%; color: rgba(255,255,255,.7); font-style: italic; }
.gift-confirm-disclaimer { font-size: 11px; color: rgba(255,255,255,.3); text-align: center; margin: 0 0 16px; }

.gift-cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 15px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.06);
    color: #EEEEF0;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: background .18s, border-color .18s;
}
.gift-cta:hover:not(:disabled) { background: rgba(201,150,60,.28); border-color: #C9963C; }
.gift-cta:disabled { opacity: .45; cursor: not-allowed; }
.gift-cta svg { width: 17px; height: 17px; }
.gift-cta-gold { background: rgba(201,150,60,.28); border-color: #C9963C; }

.gift-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,.25);
    border-top-color: #fff;
    border-radius: 50%;
    animation: elSpin .7s linear infinite;
}

.gift-done { text-align: center; padding: 20px 0 8px; }
.gift-done-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(61, 170, 118, .12);
    border: 1px solid rgba(61, 170, 118, .35);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 18px;
}
.gift-done-icon svg { width: 32px; height: 32px; stroke: #3DAA76; }
.gift-done-title { font-size: 19px; font-weight: 700; color: #e8d5a0; margin: 0 0 8px; }
.gift-done-sub { font-size: 13.5px; color: rgba(255,255,255,.5); margin: 0 0 24px; }

.givers-wall { margin-bottom: 16px; }
.givers-wall-scroll { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px; }
.givers-wall-scroll::-webkit-scrollbar { display: none; }
.givers-wall-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 99px;
    padding: 6px 14px 6px 6px;
    flex-shrink: 0;
}
.givers-wall-avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
}
.givers-wall-info { display: flex; flex-direction: column; line-height: 1.2; }
.givers-wall-name { font-size: 12px; font-weight: 600; color: #EEEEF0; }
.givers-wall-amt { font-size: 11px; color: rgba(201,150,60,.85); font-weight: 600; }
.givers-wall-lbl { font-size: 11px; color: rgba(255,255,255,.35); text-align: center; }

/* ── Pesapal return toast ─────────────────────────────────────────────────── */
.gift-return-banner {
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 500;
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 90vw;
    padding: 14px 18px;
    background: #1C1C1E;
    border: 1px solid rgba(201,150,60,.3);
    border-radius: 16px;
    box-shadow: 0 20px 50px rgba(0,0,0,.5);
    cursor: pointer;
}
.gift-return-banner svg { width: 22px; height: 22px; color: #C9963C; flex-shrink: 0; }
.gift-return-title { font-size: 13px; font-weight: 700; color: #EEEEF0; }
.gift-return-sub { font-size: 11.5px; color: rgba(238,238,240,.5); margin-top: 2px; }
.gift-return-close { background: none; border: none; color: rgba(238,238,240,.4); font-size: 14px; cursor: pointer; flex-shrink: 0; }

.gift-overlay-enter-active, .gift-overlay-leave-active { transition: opacity .25s; }
.gift-overlay-enter-from, .gift-overlay-leave-to { opacity: 0; }
.gift-sheet-enter-active, .gift-sheet-leave-active { transition: transform .3s cubic-bezier(.32,1,.4,1); }
.gift-sheet-enter-from, .gift-sheet-leave-to { transform: translateY(100%); }
</style>
