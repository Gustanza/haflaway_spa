<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '@/firebase';
import { doc, onSnapshot, updateDoc, collection, addDoc, getDocs, serverTimestamp, query, orderBy, increment, limit, startAfter } from 'firebase/firestore';

const route = useRoute();
const eventId = computed(() => route.params.eventId);
const userId = computed(() => route.params.userId);

const eventData = ref(null);
const attendeeData = ref(null);
const loading = ref(true);
const hasError = ref(false);

let unsubEvent = null, unsubAttendee = null, unsubComments = null;

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
    const q = query(collection(db, 'events', eventId.value, 'comments'), orderBy('createdAt', 'asc'));
    unsubComments = onSnapshot(q, snap => {
        comments.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    });
};

// ── Hero slider ───────────────────────────────────────────────────────────────
const heroSlides = ref([]);
const heroIndex = ref(0);
let heroTimer = null;

const fetchHeroSlides = async () => {
    if (!eventId.value) return;
    heroSlides.value = [];
    try {
        const snap = await getDocs(
            query(collection(db, 'events', eventId.value, 'gallery'), orderBy('uploadedAt', 'desc'), limit(8))
        );
        heroSlides.value = snap.docs.map(d => ({ id: d.id, url: d.data().url }));
    } catch (e) { console.error('hero_fetch', e); }
};

const heroNext = () => {
    if (heroSlides.value.length > 1)
        heroIndex.value = (heroIndex.value + 1) % heroSlides.value.length;
};
const heroPrev = () => {
    if (heroSlides.value.length > 1)
        heroIndex.value = (heroIndex.value - 1 + heroSlides.value.length) % heroSlides.value.length;
};
const heroGoto = (i) => { heroIndex.value = i; startHeroTimer(); };

const startHeroTimer = () => {
    if (heroTimer) clearInterval(heroTimer);
    heroTimer = setInterval(() => { if (heroSlides.value.length > 1) heroNext(); }, 4200);
};

// ── Swipe / drag ─────────────────────────────────────────────────────────────
let dragStartX = null;
const heroDragging = ref(false);

const onHeroDragStart = (e) => {
    if (heroSlides.value.length <= 1) return;
    dragStartX = e.touches ? e.touches[0].clientX : e.clientX;
    heroDragging.value = true;
};

const onHeroDragEnd = (e) => {
    if (dragStartX === null) return;
    const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const delta = endX - dragStartX;
    if (Math.abs(delta) > 48) {
        delta < 0 ? heroNext() : heroPrev();
        startHeroTimer();
    }
    dragStartX = null;
    heroDragging.value = false;
};

onMounted(() => { startSync(); fetchHeroSlides().then(startHeroTimer); });
watch([eventId, userId], () => { startSync(); heroIndex.value = 0; fetchHeroSlides().then(startHeroTimer); });
onUnmounted(() => {
    if (unsubEvent) unsubEvent();
    if (unsubAttendee) unsubAttendee();
    if (unsubComments) unsubComments();
    if (heroTimer) clearInterval(heroTimer);
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
        tapToChange: 'Tap to change',
        details: 'Details', gallery: 'Gallery',
        about: 'About', showLess: 'Show less', readMore: 'Read more',
        comments: 'Comments', reply: 'Reply', hideReplies: 'Hide replies',
        replies: n => `${n} ${n === 1 ? 'reply' : 'replies'}`,
        replyPlaceholder: 'Write a reply…', commentPlaceholder: 'Write a comment…',
        noComments: 'No comments yet. Be the first!',
        contactSupport: 'Contact Support',
        noPhotos: 'No photos yet', loadingDots: 'Loading…', loadMore: 'Load more',
        justNow: 'just now', minsAgo: n => `${n}m ago`, hoursAgo: n => `${n}h ago`,
        locale: 'en-TZ',
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
        tapToChange: 'Gusa Kubadilisha',
        details: 'Maelezo', gallery: 'Picha',
        about: 'Kuhusu', showLess: 'Onyesha Kidogo', readMore: 'Soma Zaidi',
        comments: 'Maoni', reply: 'Jibu', hideReplies: 'Ficha Majibu',
        replies: n => `Majibu ${n}`,
        replyPlaceholder: 'Andika jibu…', commentPlaceholder: 'Andika maoni…',
        noComments: 'Hakuna maoni bado. Kuwa wa kwanza!',
        contactSupport: 'Wasiliana na Msaada',
        noPhotos: 'Hakuna picha bado', loadingDots: 'Inapakia…', loadMore: 'Pakia Zaidi',
        justNow: 'sasa hivi', minsAgo: n => `dak ${n}`, hoursAgo: n => `saa ${n}`,
        locale: 'sw-TZ',
    },
};

const t = key => (i18n[lang.value] ?? i18n.sw)[key] ?? i18n.sw[key] ?? key;
const tFn = (key, ...args) => { const fn = (i18n[lang.value] ?? i18n.sw)[key]; return typeof fn === 'function' ? fn(...args) : fn; };

// ── Computed ─────────────────────────────────────────────────────────────────
const isPublished = computed(() => (eventData.value?.status || '').toLowerCase() === 'published');

const fmtDate = iso => {
    if (!iso) return null;
    const locale = (i18n[lang.value] ?? i18n.sw).locale;
    try { return new Date(iso).toLocaleString(locale, { weekday: 'short', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return null; }
};
const startFmt = computed(() => fmtDate(eventData.value?.startDate));
const endFmt = computed(() => fmtDate(eventData.value?.endDate));

const attendeeName = computed(() => attendeeData.value?.fullName || 'Guest');
const attendeePhone = computed(() => attendeeData.value?.phone || '');
const attendeeInitial = computed(() => attendeeName.value.charAt(0).toUpperCase());

const palette = [
    { bg: '#1A3A28', fg: '#3DAA76' }, { bg: '#1A2838', fg: '#5A8ADB' },
    { bg: '#2A1A38', fg: '#BF5AF2' }, { bg: '#38200A', fg: '#E07040' },
    { bg: '#2A2210', fg: '#C9A84C' },
];
const ac = computed(() => palette[attendeeName.value.charCodeAt(0) % palette.length]);

const hasInvitation = computed(() => !!attendeeData.value?.cards?.invitation);
const cardBadge = computed(() => hasInvitation.value ? t('invitedGuest') : t('attendee'));

const aboutExpanded = ref(false);
const activeTab = ref('details');

// ── Gallery ───────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;
const lightboxPhoto = ref(null);
const galleryPhotos = ref([]);
const galleryLoading = ref(false);
const galleryHasMore = ref(false);
const galleryLastDoc = ref(null);

const fetchGallery = async (reset = false) => {
    if (galleryLoading.value) return;
    galleryLoading.value = true;
    try {
        const base = [
            collection(db, 'events', eventId.value, 'gallery'),
            orderBy('uploadedAt', 'desc'),
        ];
        const constraints = reset || !galleryLastDoc.value
            ? [...base, limit(PAGE_SIZE + 1)]
            : [...base, startAfter(galleryLastDoc.value), limit(PAGE_SIZE + 1)];

        const snap = await getDocs(query(...constraints));
        const docs = snap.docs.slice(0, PAGE_SIZE);

        galleryHasMore.value = snap.docs.length > PAGE_SIZE;
        galleryLastDoc.value = docs.length ? docs[docs.length - 1] : null;

        const offset = reset ? 0 : galleryPhotos.value.length;
        const incoming = docs.map((d, i) => ({
            id: d.id,
            url: d.data().url,
            tall: (offset + i) % 3 === 0,
        }));

        galleryPhotos.value = reset ? incoming : [...galleryPhotos.value, ...incoming];
    } catch (e) {
        console.error('gallery_fetch', e);
    } finally {
        galleryLoading.value = false;
    }
};

watch(activeTab, (tab) => {
    if (tab === 'gallery' && galleryPhotos.value.length === 0) fetchGallery(true);
});

// ── RSVP Prompt ───────────────────────────────────────────────────────────────
const rsvpSaving = ref(false);
const showRsvp = ref(false);

watch(attendeeData, (val) => {
    if (!val) return;
    const s = val.attendanceStatus;
    if (!s || (s !== 'Confirmed' && s !== 'Declined')) showRsvp.value = true;
}, { immediate: true });

const needsRsvp = computed(() => {
    if (!attendeeData.value) return false;
    const s = attendeeData.value.attendanceStatus;
    return !s || s !== 'Confirmed';
});

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
</script>

<template>
    <div class="page">

        <!-- Floating celebration particles -->
        <div class="bg-anim" aria-hidden="true">
            <span v-for="n in 18" :key="n"></span>
        </div>

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

            <!-- RSVP Prompt — overlays the page so user can see context behind it -->
            <Transition name="rsvp-fade">
                <div v-if="showRsvp" class="rsvp-overlay">
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

            <div class="wrap">

                <!-- ── TICKET CARD ── -->
                <div class="ticket">

                    <!-- Thumbnail strip / Hero slider -->
                    <div class="thumb-wrap"
                        @touchstart.passive="onHeroDragStart"
                        @touchend="onHeroDragEnd"
                        @mousedown="onHeroDragStart"
                        @mouseup="onHeroDragEnd"
                        @mouseleave="heroDragging = false; dragStartX = null"
                        :class="{ 'hero-grabbing': heroDragging }">

                        <!-- ── Gallery slider ───────────────────────────── -->
                        <template v-if="heroSlides.length > 0">
                            <div class="hero-track">
                                <div v-for="(slide, i) in heroSlides" :key="slide.id"
                                    :class="['hero-slide', i === heroIndex ? 'hero-slide-active' : '']">
                                    <img :src="slide.url" alt="" />
                                </div>
                            </div>
                            <button v-if="heroSlides.length > 1" class="hero-arrow hero-arrow-l"
                                @click="heroPrev(); startHeroTimer()">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>
                            <button v-if="heroSlides.length > 1" class="hero-arrow hero-arrow-r"
                                @click="heroNext(); startHeroTimer()">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                            <div v-if="heroSlides.length > 1" class="hero-dots">
                                <button v-for="(_, i) in heroSlides" :key="i"
                                    :class="['hero-dot', i === heroIndex ? 'hero-dot-active' : '']"
                                    @click="heroGoto(i)"></button>
                            </div>
                            <span v-if="heroSlides.length > 1" class="hero-counter">
                                {{ heroIndex + 1 }} / {{ heroSlides.length }}
                            </span>
                            <div v-if="heroSlides.length > 1" class="hero-progress">
                                <div class="hero-progress-fill"
                                    :style="{ width: ((heroIndex + 1) / heroSlides.length * 100) + '%' }"></div>
                            </div>
                        </template>

                        <!-- ── Single thumbnail styled as slider frame ─── -->
                        <template v-else>
                            <img v-if="eventData.eventThumbnail" :src="eventData.eventThumbnail" class="thumb-img"
                                alt="" />
                            <div v-else class="thumb-placeholder">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#C9963C" stroke-width="1.5">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <path d="m21 15-5-5L5 21" />
                                </svg>
                            </div>
                            <div class="hero-fake-arrow hero-fake-arrow-l" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </div>
                            <div class="hero-fake-arrow hero-fake-arrow-r" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </div>
                            <div class="hero-dots">
                                <div class="hero-dot hero-dot-active"></div>
                            </div>
                            <div class="hero-progress">
                                <div class="hero-progress-fill" style="width:100%"></div>
                            </div>
                        </template>

                        <!-- Gradient bottom fade -->
                        <div class="thumb-fade"></div>
                        <!-- Status badge overlaid -->
                        <span :class="['ev-status', isPublished ? 's-live' : 's-draft']">
                            <span class="s-dot"></span>
                            {{ isPublished ? t('published') : (eventData.status ? t('draft') : t('draft')) }}
                        </span>
                    </div>

                    <!-- Event info -->
                    <div class="ev-info">
                        <h1 class="ev-title">{{ eventData.title }}</h1>

                        <div class="ev-meta">
                            <div class="ev-meta-row" v-if="startFmt">
                                <div class="ev-meta-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                                        <rect x="3" y="4" width="18" height="18" rx="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                </div>
                                <div class="ev-meta-text">
                                    <span class="ev-meta-primary">{{ startFmt }}</span>
                                    <span v-if="endFmt" class="ev-meta-end">
                                        <span class="ev-meta-until">{{ t('until') }}</span> {{ endFmt }}
                                    </span>
                                </div>
                            </div>

                            <div class="ev-meta-row" v-if="eventData.location">
                                <div class="ev-meta-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                                        <path
                                            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                        <circle cx="12" cy="9" r="2.5" />
                                    </svg>
                                </div>
                                <span class="ev-meta-text">{{ eventData.location }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Perforated tear line -->
                    <div class="tear">
                        <div class="tear-notch tear-l"></div>
                        <div class="tear-line"></div>
                        <div class="tear-notch tear-r"></div>
                    </div>

                    <!-- ── ATTENDEE STUB ── -->
                    <div class="stub">
                        <p class="stub-eyebrow">{{ t('guestPass') }}</p>

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

                        <div :class="['stub-status',
                                attendeeData?.attendanceStatus === 'Confirmed' ? 'status-in' :
                                attendeeData?.attendanceStatus === 'Declined'  ? 'status-declined' :
                                'status-pending']"
                            @click="showRsvp = true">
                            <div class="status-indicator">
                                <div :class="['status-led',
                                        attendeeData?.attendanceStatus === 'Confirmed' ? 'led-green' :
                                        attendeeData?.attendanceStatus === 'Declined'  ? 'led-red' :
                                        'led-amber']">
                                </div>
                                <span>{{
                                    attendeeData?.attendanceStatus === 'Confirmed' ? t('confirmed') :
                                    attendeeData?.attendanceStatus === 'Declined'  ? t('declined') :
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
                                <span v-if="attendeeData?.attendanceStatus === 'Confirmed' || attendeeData?.attendanceStatus === 'Declined'"
                                    class="status-change-lbl">{{ t('tapToChange') }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- /ticket -->

                <!-- ── Tab bar ── -->
                <div class="tab-bar">
                    <button :class="['tab', activeTab === 'details' && 'tab-active']" @click="activeTab = 'details'">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <rect x="3" y="3" width="18" height="18" rx="3" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                            <line x1="9" y1="21" x2="9" y2="9" />
                        </svg>
                        {{ t('details') }}
                    </button>
                    <button :class="['tab', activeTab === 'gallery' && 'tab-active']" @click="activeTab = 'gallery'">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <rect x="3" y="3" width="7" height="7" rx="1.5" />
                            <rect x="14" y="3" width="7" height="7" rx="1.5" />
                            <rect x="3" y="14" width="7" height="7" rx="1.5" />
                            <rect x="14" y="14" width="7" height="7" rx="1.5" />
                        </svg>
                        {{ t('gallery') }}
                    </button>
                </div>

                <!-- ── Details tab ── -->
                <template v-if="activeTab === 'details'">
                    <!-- About -->
                    <div v-if="eventData.description" class="section-card anim" style="--d:.05s">
                        <div class="s-hdr">
                            <div class="s-bar"></div>
                            <span class="s-lbl">{{ t('about') }}</span>
                        </div>
                        <p :class="['about-text', { 'about-clamped': !aboutExpanded }]">{{ eventData.description }}</p>
                        <button v-if="eventData.description.length > 180" class="about-toggle"
                            @click="aboutExpanded = !aboutExpanded">
                            {{ aboutExpanded ? t('showLess') : t('readMore') }}
                        </button>
                    </div>

                    <!-- Comments -->
                    <div class="section-card anim" style="--d:.1s">
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
                                        <button class="cmnt-reply-btn" @click="openReply(c.id)">{{ t('reply') }}</button>
                                        <button v-if="c.replyCount > 0" class="cmnt-view-replies"
                                            @click="toggleReplies(c)">
                                            {{ expandedReplies[c.id] ? t('hideReplies') : tFn('replies', c.replyCount) }}
                                        </button>
                                    </div>

                                    <div v-if="replyingTo === c.id" class="cmnt-reply-form">
                                        <input v-model="replyTexts[c.id]" class="cmnt-input"
                                            :placeholder="t('replyPlaceholder')" @keydown.enter.prevent="postReply(c)" />
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

                    <!-- Support -->
                    <a v-if="eventData.supportPhone" :href="`https://wa.me/${eventData.supportPhone.replace(/\D/g, '')}`"
                        target="_blank" class="support-link anim" style="--d:.15s">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                        {{ t('contactSupport') }}
                    </a>
                </template>

                <!-- ── Gallery tab ── -->
                <template v-if="activeTab === 'gallery'">

                    <!-- Initial load spinner -->
                    <div v-if="galleryLoading && galleryPhotos.length === 0" class="gallery-spinner">
                        <div class="spin-ring"></div>
                    </div>

                    <!-- Empty state -->
                    <div v-else-if="!galleryLoading && galleryPhotos.length === 0" class="gallery-empty">
                        <div class="gallery-empty-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="m21 15-5-5L5 21" />
                            </svg>
                        </div>
                        <p class="gallery-empty-txt">{{ t('noPhotos') }}</p>
                    </div>

                    <!-- Grid -->
                    <template v-else>
                        <div class="gallery-grid anim" style="--d:0s">
                            <div v-for="photo in galleryPhotos" :key="photo.id"
                                :class="['gallery-cell', photo.tall ? 'gallery-tall' : '']"
                                @click="lightboxPhoto = photo">
                                <img :src="photo.url" loading="lazy" />
                            </div>
                        </div>

                        <!-- Load more -->
                        <button v-if="galleryHasMore" class="gallery-more-btn" :disabled="galleryLoading"
                            @click="fetchGallery(false)">
                            {{ galleryLoading ? t('loadingDots') : t('loadMore') }}
                        </button>
                    </template>

                </template>

                <!-- Lightbox (always mounted) -->
                <Teleport to="body">
                    <Transition name="lb-fade">
                        <div v-if="lightboxPhoto" class="lb-overlay" @click.self="lightboxPhoto = null">
                            <button class="lb-close" @click="lightboxPhoto = null">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                            <img :src="lightboxPhoto.url" class="lb-img" />
                        </div>
                    </Transition>
                </Teleport>

                <div style="height:56px"></div>
            </div>
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

/* ── Page ─────────────────────────────────────────────────────────────────── */
.page {
    min-height: 100vh;
    background: #FDFAF7;
    color: #1A1A1A;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
    position: relative;
    overflow-x: hidden;
}

/* ── Celebration particles ────────────────────────────────────────────────── */
.bg-anim {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
}

.bg-anim span {
    position: absolute;
    bottom: -80px;
    border-radius: 50%;
    opacity: 0;
    animation: floatUp var(--dur) ease-in var(--delay) infinite;
}

.bg-anim span:nth-child(1)  { left:  5%; width: 10px; height: 10px; background: rgba(255,182,193,.55); --dur: 10s; --delay: 0s; }
.bg-anim span:nth-child(2)  { left: 14%; width:  6px; height:  6px; background: rgba(201,150, 60,.50); --dur:  8s; --delay: 1.5s; }
.bg-anim span:nth-child(3)  { left: 22%; width: 14px; height: 14px; background: rgba(200,170,255,.40); --dur: 12s; --delay: 0.5s; }
.bg-anim span:nth-child(4)  { left: 30%; width:  8px; height:  8px; background: rgba(160,230,190,.50); --dur:  9s; --delay: 3s; }
.bg-anim span:nth-child(5)  { left: 38%; width:  6px; height:  6px; background: rgba(201,150, 60,.60); --dur: 11s; --delay: 1s;   border-radius: 2px; }
.bg-anim span:nth-child(6)  { left: 46%; width: 12px; height: 12px; background: rgba(255,182,193,.45); --dur:  8s; --delay: 2.5s; }
.bg-anim span:nth-child(7)  { left: 53%; width:  7px; height:  7px; background: rgba(200,170,255,.50); --dur: 13s; --delay: 0.2s; }
.bg-anim span:nth-child(8)  { left: 61%; width:  9px; height:  9px; background: rgba(255,200,160,.50); --dur: 10s; --delay: 4s; }
.bg-anim span:nth-child(9)  { left: 68%; width:  5px; height:  5px; background: rgba(201,150, 60,.55); --dur:  7s; --delay: 1.5s; border-radius: 2px; }
.bg-anim span:nth-child(10) { left: 76%; width: 13px; height: 13px; background: rgba(255,182,193,.40); --dur: 11s; --delay: 2s; }
.bg-anim span:nth-child(11) { left: 83%; width:  8px; height:  8px; background: rgba(160,230,190,.50); --dur:  9s; --delay: 0.5s; }
.bg-anim span:nth-child(12) { left: 89%; width:  6px; height:  6px; background: rgba(200,170,255,.45); --dur: 12s; --delay: 3.5s; }
.bg-anim span:nth-child(13) { left: 94%; width: 10px; height: 10px; background: rgba(255,200,160,.50); --dur:  8s; --delay: 1s; }
.bg-anim span:nth-child(14) { left: 11%; width:  4px; height:  4px; background: rgba(201,150, 60,.65); --dur: 14s; --delay: 4s;   border-radius: 2px; }
.bg-anim span:nth-child(15) { left: 56%; width:  6px; height:  6px; background: rgba(255,182,193,.55); --dur:  9s; --delay: 2.5s; }
.bg-anim span:nth-child(16) { left: 71%; width:  9px; height:  9px; background: rgba(201,150, 60,.40); --dur: 10s; --delay: 0.3s; }
.bg-anim span:nth-child(17) { left: 35%; width:  7px; height:  7px; background: rgba(160,200,255,.50); --dur: 11s; --delay: 3s; }
.bg-anim span:nth-child(18) { left: 86%; width:  5px; height:  5px; background: rgba(201,150, 60,.50); --dur:  8s; --delay: 2s;   border-radius: 2px; }

@keyframes floatUp {
    0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
    8%   { opacity: .85; }
    85%  { opacity: .35; }
    100% { transform: translateY(-105vh) translateX(18px) scale(.6); opacity: 0; }
}

/* ── Wrap ─────────────────────────────────────────────────────────────────── */
.wrap {
    max-width: 480px;
    margin: 0 auto;
    padding: 24px 16px;
    position: relative;
    z-index: 1;
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
    border: 2.5px solid rgba(201, 150, 60, .15);
    border-top-color: #C9963C;
    border-radius: 50%;
    animation: spin .75s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.spin-lbl {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: #B0A090;
}

.err-circle {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(201, 150, 60, .08);
    border: 1px solid rgba(201, 150, 60, .2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: #C9963C;
}

.err-h {
    font-size: 20px;
    font-weight: 800;
    color: #1A1A1A;
}

.err-p {
    font-size: 13px;
    color: #8E8E93;
    text-align: center;
    line-height: 1.6;
}

/* ── TICKET ───────────────────────────────────────────────────────────────── */
.ticket {
    background: #FFFFFF;
    border: 1px solid rgba(0, 0, 0, .06);
    border-radius: 24px;
    overflow: hidden;
    margin-bottom: 14px;
    box-shadow:
        0 20px 60px rgba(180, 130, 80, .10),
        0 4px 16px rgba(0, 0, 0, .05);
    animation: fadeUp .55s cubic-bezier(.22, 1, .36, 1) both;
}

@keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
}

/* Thumbnail */
.thumb-wrap {
    position: relative;
    height: 210px;
    overflow: hidden;
    background: #F5EEE6;
}

.thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.thumb-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #FDF0E0, #F5E8D5);
}

.thumb-placeholder svg {
    width: 48px;
    height: 48px;
    opacity: .35;
}

.thumb-fade {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(to bottom, transparent, #FFFFFF);
    z-index: 2;
    pointer-events: none;
}

/* ── Hero slider ──────────────────────────────────────────────────────────── */
.hero-track {
    position: relative;
    width: 100%;
    height: 100%;
}

.hero-slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity .75s ease;
    z-index: 0;
}

.hero-slide-active {
    opacity: 1;
    z-index: 1;
}

.hero-slide img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.hero-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-65%);
    z-index: 5;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(255, 255, 255, .82);
    backdrop-filter: blur(10px);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1A1A1A;
    box-shadow: 0 2px 14px rgba(0, 0, 0, .18);
    opacity: 0;
    transition: opacity .2s ease, transform .15s ease, background .15s;
}

.thumb-wrap:hover .hero-arrow {
    opacity: 1;
}

.hero-arrow:active {
    transform: translateY(-65%) scale(.88);
    background: rgba(255, 255, 255, .97);
}

.hero-arrow-l { left: 12px; }
.hero-arrow-r { right: 12px; }

.hero-arrow svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
}

.hero-dots {
    position: absolute;
    bottom: 14px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 5px;
    z-index: 5;
    align-items: center;
}

.hero-dot {
    width: 6px;
    height: 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, .45);
    border: none;
    cursor: pointer;
    padding: 0;
    transition: width .3s cubic-bezier(.22, 1, .36, 1), background .3s ease;
    flex-shrink: 0;
}

.hero-dot-active {
    width: 20px;
    background: #fff;
    cursor: default;
}

.hero-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(255, 255, 255, .15);
    z-index: 5;
}

.hero-progress-fill {
    height: 100%;
    background: linear-gradient(to right, #C9963C, #E8C070);
    transition: width .45s ease;
    border-radius: 0 2px 2px 0;
}

.hero-counter {
    position: absolute;
    top: 14px;
    left: 14px;
    z-index: 5;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .5px;
    color: rgba(255, 255, 255, .92);
    background: rgba(0, 0, 0, .28);
    backdrop-filter: blur(8px);
    padding: 4px 9px;
    border-radius: 99px;
}

.hero-fake-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-65%);
    z-index: 3;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(255, 255, 255, .42);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(26, 26, 26, .22);
    pointer-events: none;
}

.hero-fake-arrow svg { width: 14px; height: 14px; }
.hero-fake-arrow-l { left: 12px; }
.hero-fake-arrow-r { right: 12px; }

/* Drag handle cursors */
.thumb-wrap {
    cursor: grab;
}
.thumb-wrap.hero-grabbing,
.thumb-wrap.hero-grabbing * {
    cursor: grabbing;
    user-select: none;
}

/* Status badge */
.ev-status {
    position: absolute;
    top: 14px;
    right: 14px;
    z-index: 6;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 99px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1px;
    backdrop-filter: blur(12px);
}

.s-live {
    background: rgba(255, 255, 255, .88);
    border: .8px solid rgba(201, 150, 60, .5);
    color: #B8861E;
}

.s-draft {
    background: rgba(255, 255, 255, .88);
    border: .8px solid rgba(150, 150, 150, .4);
    color: #8E8E93;
}

.s-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
}

/* Event info */
.ev-info {
    padding: 16px 20px 20px;
}

.ev-title {
    font-size: 22px;
    font-weight: 800;
    color: #1A1A1A;
    letter-spacing: -.5px;
    line-height: 1.2;
    margin-bottom: 14px;
}

.ev-meta {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.ev-meta-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

.ev-meta-icon {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    background: rgba(201, 150, 60, .10);
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.ev-meta-icon svg {
    width: 14px;
    height: 14px;
    color: #C9963C;
}

.ev-meta-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-top: 5px;
}

.ev-meta-primary {
    font-size: 13px;
    color: #1A1A1A;
    font-weight: 500;
    line-height: 1.4;
}

.ev-meta-end {
    font-size: 12px;
    color: #8E8E93;
    display: flex;
    align-items: center;
    gap: 4px;
}

.ev-meta-until {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .6px;
    color: #C9963C;
    font-weight: 600;
}

/* ── Tear / perforation ────────────────────────────────────────────────────── */
.tear {
    display: flex;
    align-items: center;
    margin: 0 -1px;
}

.tear-notch {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #FDFAF7;
    flex-shrink: 0;
    border: 1px solid rgba(0, 0, 0, .06);
}

.tear-l {
    border-left: none;
    border-radius: 0 50% 50% 0;
    margin-left: -1px;
}

.tear-r {
    border-right: none;
    border-radius: 50% 0 0 50%;
    margin-right: -1px;
}

.tear-line {
    flex: 1;
    border-top: 1.5px dashed rgba(0, 0, 0, .10);
}

/* ── Attendee stub ─────────────────────────────────────────────────────────── */
.stub {
    padding: 20px 20px 22px;
}

.stub-eyebrow {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: #C9963C;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 7px;
}

.stub-eyebrow::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(201, 150, 60, .2);
}

.stub-main {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 18px;
}

/* Avatar */
.stub-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
}

.stub-initial {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -.5px;
    line-height: 1;
}

.stub-avatar-ring {
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 1.5px solid;
}

.stub-info {
    min-width: 0;
}

.stub-badge {
    display: inline-flex;
    padding: 3px 10px;
    background: rgba(201, 150, 60, .10);
    border: .7px solid rgba(201, 150, 60, .30);
    border-radius: 99px;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .8px;
    text-transform: uppercase;
    color: #B8861E;
    margin-bottom: 6px;
}

.stub-name {
    font-size: 16px;
    font-weight: 700;
    color: #1A1A1A;
    letter-spacing: -.2px;
    line-height: 1.3;
    word-break: break-word;
    margin-bottom: 3px;
}

.stub-phone {
    font-size: 12px;
    color: #8E8E93;
}

/* Status */
.stub-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-radius: 12px;
    cursor: pointer;
    transition: opacity .15s;
}

.stub-status:active { opacity: .75; }

.status-in {
    background: rgba(29, 171, 75, .07);
    border: 1px solid rgba(29, 171, 75, .20);
}

.status-declined {
    background: rgba(224, 90, 90, .07);
    border: 1px solid rgba(224, 90, 90, .20);
}

.status-pending {
    background: rgba(212, 130, 10, .09);
    border: 1px solid rgba(212, 130, 10, .28);
    animation: pendingPulse 2s ease infinite;
}

@keyframes pendingPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(212, 130, 10, .15); }
    50%       { box-shadow: 0 0 0 5px rgba(212, 130, 10, 0); }
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
}

.status-in .status-indicator      { color: #1DAB4B; }
.status-declined .status-indicator { color: #E05A5A; }
.status-pending .status-indicator  { color: #D4820A; }

.status-led {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
}

.led-green {
    background: #1DAB4B;
    box-shadow: 0 0 7px rgba(29, 171, 75, .5);
    animation: blink 2s ease infinite;
}

.led-amber {
    background: #D4820A;
    animation: blink 1.4s ease infinite;
}

.led-red {
    background: #E05A5A;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: .35; }
}

.status-right {
    display: flex;
    align-items: center;
    gap: 6px;
}

.check-mark {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
}

.status-change-lbl {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .3px;
    opacity: .45;
    white-space: nowrap;
}

/* ── Tab bar ──────────────────────────────────────────────────────────────── */
.tab-bar {
    display: flex;
    background: #FFFFFF;
    border: 1px solid rgba(0, 0, 0, .07);
    border-radius: 16px;
    padding: 4px;
    gap: 4px;
    margin-bottom: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, .05);
}

.tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 0;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: .4px;
    font-family: inherit;
    background: transparent;
    color: #B0A090;
    transition: background .18s, color .18s;
}

.tab svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
}

.tab-active {
    background: rgba(201, 150, 60, .12);
    color: #B8861E;
}

/* ── Section cards ────────────────────────────────────────────────────────── */
.section-card {
    background: #FFFFFF;
    border: 1px solid rgba(0, 0, 0, .06);
    border-radius: 20px;
    padding: 18px;
    margin-bottom: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, .04);
}

.anim {
    animation: fadeUp .5s cubic-bezier(.22, 1, .36, 1) both var(--d, 0s);
}

.s-hdr {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
}

.s-bar {
    width: 3px;
    height: 13px;
    background: #C9963C;
    border-radius: 2px;
    flex-shrink: 0;
}

.s-lbl {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.3px;
    text-transform: uppercase;
    color: #9B9B9E;
}

/* ── Gallery ──────────────────────────────────────────────────────────────── */
.gallery-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: 130px;
    gap: 6px;
}

.gallery-cell {
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    background: #F0EAE0;
}

.gallery-cell.gallery-tall {
    grid-row: span 2;
}

.gallery-cell img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform .3s ease, opacity .3s;
    display: block;
}

.gallery-cell:active img {
    transform: scale(1.04);
    opacity: .85;
}

.gallery-spinner {
    display: flex;
    justify-content: center;
    padding: 48px 0;
}

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
    background: rgba(201, 150, 60, .08);
    border: 1px solid rgba(201, 150, 60, .2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #C9963C;
}

.gallery-empty-icon svg {
    width: 24px;
    height: 24px;
}

.gallery-empty-txt {
    font-size: 14px;
    color: #B0A090;
    font-weight: 600;
}

.gallery-more-btn {
    display: block;
    width: 100%;
    margin-top: 10px;
    padding: 13px;
    background: #FFFFFF;
    border: 1px solid rgba(0, 0, 0, .07);
    border-radius: 14px;
    font-size: 13px;
    font-weight: 600;
    color: #C9963C;
    font-family: inherit;
    cursor: pointer;
    transition: background .18s, border-color .18s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, .04);
}

.gallery-more-btn:disabled {
    opacity: .4;
    cursor: default;
}

.gallery-more-btn:not(:disabled):active {
    background: rgba(201, 150, 60, .06);
    border-color: rgba(201, 150, 60, .3);
}

/* Lightbox */
.lb-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, .88);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
}

.lb-close {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, .15);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
}

.lb-close svg {
    width: 16px;
    height: 16px;
}

.lb-img {
    max-width: 100%;
    max-height: 75vh;
    border-radius: 14px;
    object-fit: contain;
    box-shadow: 0 24px 60px rgba(0, 0, 0, .5);
}

.lb-caption {
    margin-top: 14px;
    font-size: 13px;
    color: #8E8E93;
    text-align: center;
}

.lb-fade-enter-active,
.lb-fade-leave-active {
    transition: opacity .2s;
}

.lb-fade-enter-from,
.lb-fade-leave-to {
    opacity: 0;
}

/* About */
.about-text {
    font-size: 14px;
    color: #5A5A60;
    line-height: 1.75;
}

.about-clamped {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.about-toggle {
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px 0 0;
    font-size: 12px;
    font-weight: 600;
    color: #C9963C;
    font-family: inherit;
    letter-spacing: .3px;
}

/* Support */
.support-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 13px;
    background: #FFFFFF;
    border: 1px solid rgba(0, 0, 0, .07);
    border-radius: 16px;
    font-size: 13px;
    font-weight: 600;
    color: #8E8E93;
    text-decoration: none;
    transition: color .2s, border-color .2s, background .2s;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, .04);
}

.support-link svg {
    width: 15px;
    height: 15px;
}

.support-link:hover {
    color: #C9963C;
    border-color: rgba(201, 150, 60, .3);
    background: rgba(201, 150, 60, .05);
}

/* ── RSVP Overlay ─────────────────────────────────────────────────────────── */
.rsvp-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(240, 228, 210, .60);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0 16px 32px;
}

@media (min-height: 600px) {
    .rsvp-overlay {
        align-items: center;
        padding: 24px 16px;
    }
}

.rsvp-card {
    width: 100%;
    max-width: 420px;
    background: #FFFFFF;
    border: 1px solid rgba(0, 0, 0, .07);
    border-radius: 28px;
    padding: 32px 24px 28px;
    box-shadow: 0 24px 60px rgba(150, 100, 50, .15);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    animation: rsvpUp .45s cubic-bezier(.22, 1, .36, 1) both;
}

@keyframes rsvpUp {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0); }
}

.rsvp-icon {
    width: 56px;
    height: 56px;
    background: rgba(201, 150, 60, .10);
    border: 1px solid rgba(201, 150, 60, .25);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #C9963C;
    margin-bottom: 18px;
}

.rsvp-icon svg {
    width: 24px;
    height: 24px;
}

.rsvp-title {
    font-size: 22px;
    font-weight: 800;
    color: #1A1A1A;
    letter-spacing: -.4px;
    margin-bottom: 6px;
    text-align: center;
}

.rsvp-event {
    font-size: 13px;
    font-weight: 600;
    color: #C9963C;
    margin-bottom: 10px;
    text-align: center;
}

.rsvp-sub {
    font-size: 13px;
    color: #8E8E93;
    line-height: 1.6;
    text-align: center;
    margin-bottom: 28px;
}

.rsvp-actions {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.rsvp-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    padding: 15px;
    border-radius: 16px;
    border: none;
    cursor: pointer;
    font-size: 15px;
    font-weight: 700;
    font-family: inherit;
    transition: opacity .15s, transform .1s;
}

.rsvp-btn:disabled {
    opacity: .5;
    cursor: not-allowed;
}

.rsvp-btn svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
}

.rsvp-confirm {
    background: rgba(29, 171, 75, .10);
    border: 1px solid rgba(29, 171, 75, .30);
    color: #1DAB4B;
}

.rsvp-confirm:not(:disabled):active {
    opacity: .75;
    transform: scale(.98);
}

.rsvp-decline {
    background: rgba(0, 0, 0, .04);
    border: 1px solid rgba(0, 0, 0, .10);
    color: #8E8E93;
}

.rsvp-decline:not(:disabled):active {
    opacity: .75;
    transform: scale(.98);
}

.rsvp-fade-enter-active,
.rsvp-fade-leave-active {
    transition: opacity .3s;
}

.rsvp-fade-enter-from,
.rsvp-fade-leave-to {
    opacity: 0;
}

/* ── Comments ─────────────────────────────────────────────────────────────── */
.cmnt-count {
    color: #C9963C;
    font-weight: 700;
}

.cmnt-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 16px;
    max-height: 380px;
    overflow-y: auto;
    padding-right: 4px;
}

.cmnt-item {
    display: flex;
    gap: 10px;
}

.cmnt-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
}

.cmnt-avatar-sm {
    width: 28px;
    height: 28px;
    font-size: 11px;
}

.cmnt-body {
    flex: 1;
    min-width: 0;
}

.cmnt-meta {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 3px;
}

.cmnt-name {
    font-size: 13px;
    font-weight: 600;
    color: #1A1A1A;
}

.cmnt-time {
    font-size: 11px;
    color: #B0A090;
}

.cmnt-text {
    font-size: 13px;
    color: #5A5A60;
    line-height: 1.5;
}

.cmnt-actions {
    display: flex;
    gap: 12px;
    margin-top: 6px;
}

.cmnt-reply-btn,
.cmnt-view-replies {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .4px;
    text-transform: uppercase;
    font-family: inherit;
}

.cmnt-reply-btn {
    color: #C9963C;
}

.cmnt-view-replies {
    color: #B0A090;
}

.cmnt-replies {
    margin-top: 10px;
    padding-left: 10px;
    border-left: 2px solid rgba(0, 0, 0, .08);
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.cmnt-reply-form {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
}

.cmnt-empty {
    font-size: 13px;
    color: #B0A090;
    text-align: center;
    padding: 12px 0 16px;
}

.cmnt-compose {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 14px;
    border-top: 1px solid rgba(0, 0, 0, .07);
}

.cmnt-input {
    flex: 1;
    background: rgba(0, 0, 0, .04);
    border: 1px solid rgba(0, 0, 0, .08);
    border-radius: 20px;
    padding: 9px 14px;
    font-size: 13px;
    color: #1A1A1A;
    outline: none;
    font-family: inherit;
    transition: border-color .18s, background .18s;
}

.cmnt-input::placeholder {
    color: #C0B8A8;
}

.cmnt-input:focus {
    border-color: rgba(201, 150, 60, .4);
    background: rgba(201, 150, 60, .04);
}

.cmnt-send {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #C9963C;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity .15s;
}

.cmnt-send:disabled {
    opacity: .3;
    cursor: default;
}

.cmnt-send svg {
    width: 13px;
    height: 13px;
    color: #fff;
}
</style>
