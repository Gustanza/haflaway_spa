<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '@/firebase';
import { doc, onSnapshot, updateDoc, collection, addDoc, getDocs, serverTimestamp, query, where, orderBy, increment, limit, startAfter, arrayUnion, arrayRemove } from 'firebase/firestore';

const route = useRoute();
const eventId = computed(() => route.params.eventId);
const userId = computed(() => route.params.userId);

const eventData = ref(null);
const attendeeData = ref(null);
const loading = ref(true);
const hasError = ref(false);

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

// ── Hero slider ───────────────────────────────────────────────────────────────
const heroSlides = ref([]);
const heroIndex = ref(0);
let heroTimer = null;

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

onMounted(() => {
    startSync(); startZawadiSync(); startAllContribsSync(); fetchHeroSlides().then(startHeroTimer);
    // Detect return from Pesapal payment page
    if (route.query.OrderTrackingId && route.query.OrderMerchantReference) {
        giftReturnBanner.value = true;
    }
});
watch([eventId, userId], () => { startSync(); startZawadiSync(); startAllContribsSync(); heroIndex.value = 0; fetchHeroSlides().then(startHeroTimer); });
onUnmounted(() => {
    if (unsubEvent) unsubEvent();
    if (unsubAttendee) unsubAttendee();
    if (unsubComments) unsubComments();
    if (unsubMediaComments) unsubMediaComments();
    if (unsubZawadi) unsubZawadi();
    if (unsubAllContribs) unsubAllContribs();
    if (unsubItemContribs) unsubItemContribs();
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
        tapToChange: 'Tap to change', viewCard: 'View Card',
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
        locations: 'Locations', openInMaps: 'Open in Maps', moreLocations: n => `+${n} more`,
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
        locations: 'Maeneo', openInMaps: 'Fungua Ramani', moreLocations: n => `+${n} zaidi`,
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
    { bg: '#2A2210', fg: '#E8C070' },
];
const ac = computed(() => palette[attendeeName.value.charCodeAt(0) % palette.length]);

const hasInvitation = computed(() => !!attendeeData.value?.cards?.invitation);
const cardBadge = computed(() => hasInvitation.value ? t('invitedGuest') : t('attendee'));

const aboutExpanded = ref(false);
const activeTab = ref('details');

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
    if (galleryLoading.value) return;
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

watch(activeTab, (tab) => {
    if (tab === 'gallery' && galleryGroups.value.length === 0) fetchGallery(true);
});

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

        <!-- Floating celebration particles -->
        <div class="bg-anim" aria-hidden="true">
            <span v-for="n in 18" :key="n"></span>
        </div>

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
                    <div class="thumb-wrap" @touchstart.passive="onHeroDragStart" @touchend="onHeroDragEnd"
                        @mousedown="onHeroDragStart" @mouseup="onHeroDragEnd"
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

                            <!-- locations array: tappable, opens Maps -->
                            <template v-if="eventLocations.length > 0">
                                <a v-for="loc in eventLocations" :key="loc.id" :href="mapsLink(loc)" target="_blank"
                                    rel="noopener noreferrer" class="ev-meta-row ev-meta-loc-link">
                                    <div class="ev-meta-icon ev-meta-icon-gold">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                                            <path
                                                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                            <circle cx="12" cy="9" r="2.5" />
                                        </svg>
                                    </div>
                                    <div class="ev-meta-text ev-meta-text-loc">
                                        <span class="ev-meta-loc-label">{{ loc.label }}</span>
                                        <span class="ev-meta-primary">{{ loc.placeName }}</span>
                                    </div>
                                    <div class="ev-meta-arrow-wrap">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </a>
                            </template>
                            <!-- location string fallback (no locations set) -->
                            <div class="ev-meta-row" v-else-if="eventData.location">
                                <div class="ev-meta-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                                        <path
                                            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                        <circle cx="12" cy="9" r="2.5" />
                                    </svg>
                                </div>
                                <span class="ev-meta-primary">{{ eventData.location }}</span>
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

                    <!-- ── Gift of Love section ── -->
                    <div class="section-card zawadi-section anim" style="--d:.08s">
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

                    <!-- Support -->
                    <a v-if="eventData.supportPhone"
                        :href="`https://wa.me/${eventData.supportPhone.replace(/\D/g, '')}`" target="_blank"
                        class="support-link anim" style="--d:.15s">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                        {{ t('contactSupport') }}
                    </a>
                </template>

                <!-- ── Gallery tab ── -->
                <template v-if="activeTab === 'gallery'">

                    <!-- Initial load spinner -->
                    <div v-if="galleryLoading && galleryGroups.length === 0" class="gallery-spinner">
                        <div class="spin-ring"></div>
                    </div>

                    <!-- Empty state -->
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

                    <!-- Grouped grid -->
                    <template v-else>
                        <div v-for="group in galleryGroups" :key="group.folderId" class="gallery-section anim"
                            style="--d:0s">
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

                </template>

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
    background: #111114;
    color: #EEEEF0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
    position: relative;
    overflow-x: hidden;
}

/* ── Atmospheric orbs ─────────────────────────────────────────────────────── */
.bg-anim {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
}

/* Large atmospheric orbs — spans 1-3 */
.bg-anim span {
    position: absolute;
    border-radius: 50%;
}

.bg-anim span:nth-child(1) {
    left: -25%;
    top: -20%;
    width: 85vw;
    height: 85vw;
    background: radial-gradient(circle at center, rgba(201, 150, 60, .11) 0%, transparent 65%);
    opacity: 1;
    animation: orbDrift1 32s ease-in-out infinite;
}

.bg-anim span:nth-child(2) {
    right: -25%;
    bottom: 0;
    left: unset;
    top: unset;
    width: 75vw;
    height: 75vw;
    background: radial-gradient(circle at center, rgba(160, 100, 30, .08) 0%, transparent 65%);
    opacity: 1;
    animation: orbDrift2 38s ease-in-out infinite;
}

.bg-anim span:nth-child(3) {
    left: 20%;
    top: 35%;
    width: 55vw;
    height: 55vw;
    background: radial-gradient(circle at center, rgba(220, 160, 60, .05) 0%, transparent 60%);
    opacity: 1;
    animation: orbDrift3 28s ease-in-out infinite;
}

/* Small floating sparkles — spans 4-18 */
.bg-anim span:nth-child(n+4) {
    bottom: -10px;
    opacity: 0;
    animation: floatUp var(--dur) ease-in var(--delay) infinite;
}

.bg-anim span:nth-child(4) {
    left: 10%;
    width: 4px;
    height: 4px;
    background: rgba(201, 150, 60, .8);
    --dur: 9s;
    --delay: 0.3s;
}

.bg-anim span:nth-child(5) {
    left: 22%;
    width: 3px;
    height: 3px;
    background: rgba(255, 255, 255, .5);
    --dur: 11s;
    --delay: 1.2s;
    border-radius: 2px;
}

.bg-anim span:nth-child(6) {
    left: 33%;
    width: 5px;
    height: 5px;
    background: rgba(201, 150, 60, .7);
    --dur: 8s;
    --delay: 2.8s;
}

.bg-anim span:nth-child(7) {
    left: 44%;
    width: 4px;
    height: 4px;
    background: rgba(200, 170, 255, .65);
    --dur: 13s;
    --delay: 0.6s;
}

.bg-anim span:nth-child(8) {
    left: 55%;
    width: 3px;
    height: 3px;
    background: rgba(201, 150, 60, .7);
    --dur: 10s;
    --delay: 3.5s;
}

.bg-anim span:nth-child(9) {
    left: 64%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, .35);
    --dur: 7s;
    --delay: 1.8s;
    border-radius: 2px;
}

.bg-anim span:nth-child(10) {
    left: 73%;
    width: 4px;
    height: 4px;
    background: rgba(201, 150, 60, .6);
    --dur: 12s;
    --delay: 0.9s;
}

.bg-anim span:nth-child(11) {
    left: 82%;
    width: 3px;
    height: 3px;
    background: rgba(200, 170, 255, .6);
    --dur: 9s;
    --delay: 4.1s;
}

.bg-anim span:nth-child(12) {
    left: 91%;
    width: 4px;
    height: 4px;
    background: rgba(201, 150, 60, .75);
    --dur: 11s;
    --delay: 2.2s;
}

.bg-anim span:nth-child(13) {
    left: 17%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, .4);
    --dur: 8s;
    --delay: 0s;
}

.bg-anim span:nth-child(14) {
    left: 40%;
    width: 3px;
    height: 3px;
    background: rgba(201, 150, 60, .8);
    --dur: 14s;
    --delay: 3s;
    border-radius: 2px;
}

.bg-anim span:nth-child(15) {
    left: 59%;
    width: 4px;
    height: 4px;
    background: rgba(201, 150, 60, .65);
    --dur: 9s;
    --delay: 1.5s;
}

.bg-anim span:nth-child(16) {
    left: 78%;
    width: 5px;
    height: 5px;
    background: rgba(200, 170, 255, .5);
    --dur: 10s;
    --delay: 2.7s;
}

.bg-anim span:nth-child(17) {
    left: 6%;
    width: 3px;
    height: 3px;
    background: rgba(255, 255, 255, .45);
    --dur: 12s;
    --delay: 0.5s;
}

.bg-anim span:nth-child(18) {
    left: 48%;
    width: 4px;
    height: 4px;
    background: rgba(201, 150, 60, .7);
    --dur: 8s;
    --delay: 4.5s;
    border-radius: 2px;
}

@keyframes orbDrift1 {

    0%,
    100% {
        transform: translate(0, 0) scale(1);
    }

    33% {
        transform: translate(4vw, -3vh) scale(1.04);
    }

    66% {
        transform: translate(-2vw, 4vh) scale(.97);
    }
}

@keyframes orbDrift2 {

    0%,
    100% {
        transform: translate(0, 0) scale(1);
    }

    40% {
        transform: translate(-5vw, -4vh) scale(1.06);
    }

    70% {
        transform: translate(2vw, 2vh) scale(.95);
    }
}

@keyframes orbDrift3 {

    0%,
    100% {
        transform: translate(0, 0) scale(1);
    }

    50% {
        transform: translate(3vw, 5vh) scale(1.08);
    }
}

@keyframes floatUp {
    0% {
        transform: translateY(0) translateX(0) scale(1);
        opacity: 0;
    }

    8% {
        opacity: 1;
    }

    85% {
        opacity: .6;
    }

    100% {
        transform: translateY(-100vh) translateX(12px) scale(.5);
        opacity: 0;
    }
}

/* ── Wrap ─────────────────────────────────────────────────────────────────── */
.wrap {
    max-width: 480px;
    margin: 0 auto;
    padding: 24px 16px;
    position: relative;
    z-index: 1;
}

@media (min-width: 760px) {
    .page {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 40px 24px 60px;
    }

    .wrap {
        width: 100%;
        max-width: 480px;
        background: rgba(18, 18, 20, .92);
        border: 1px solid rgba(44, 44, 46, .7);
        border-radius: 32px;
        box-shadow:
            0 0 0 1px rgba(201, 150, 60, .08),
            0 40px 80px rgba(0, 0, 0, .6);
        padding: 0 0 8px;
        overflow: hidden;
    }

    .wrap>* {
        padding-left: 16px;
        padding-right: 16px;
    }

    .ticket {
        border-radius: 0;
        margin-bottom: 0;
        border: none;
        box-shadow: none;
    }

    .ticket::before {
        border-radius: 0;
    }

    .tab-bar {
        margin: 12px 16px;
    }
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
    to {
        transform: rotate(360deg);
    }
}

.spin-lbl {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: rgba(238, 238, 240, .4);
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
    color: #EEEEF0;
}

.err-p {
    font-size: 13px;
    color: rgba(238, 238, 240, .5);
    text-align: center;
    line-height: 1.6;
}

/* ── TICKET ───────────────────────────────────────────────────────────────── */
.ticket {
    background: rgba(28, 28, 30, .78);
    backdrop-filter: blur(40px) saturate(1.6);
    -webkit-backdrop-filter: blur(40px) saturate(1.6);
    border: 1px solid rgba(44, 44, 46, .8);
    border-radius: 24px;
    overflow: hidden;
    margin-bottom: 14px;
    box-shadow:
        0 0 0 1px rgba(201, 150, 60, .12),
        0 48px 96px rgba(0, 0, 0, .7),
        0 16px 40px rgba(201, 150, 60, .10);
    animation: fadeUp .55s cubic-bezier(.22, 1, .36, 1) both;
    position: relative;
}

.ticket::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #C9963C 0%, #E8A020 50%, #C9A84C 100%);
    z-index: 10;
}

@keyframes fadeUp {
    from {
        opacity: 0;
        transform: translateY(24px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
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
    background: linear-gradient(to bottom, transparent, rgba(28, 28, 30, .78));
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

.hero-arrow-l {
    left: 12px;
}

.hero-arrow-r {
    right: 12px;
}

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

.hero-fake-arrow svg {
    width: 14px;
    height: 14px;
}

.hero-fake-arrow-l {
    left: 12px;
}

.hero-fake-arrow-r {
    right: 12px;
}

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
    font-size: 24px;
    font-weight: 800;
    color: #EEEEF0;
    letter-spacing: -.6px;
    line-height: 1.18;
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
    background: rgba(201, 150, 60, .14);
    border: 1px solid rgba(201, 150, 60, .2);
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
    color: rgba(238, 238, 240, .88);
    font-weight: 500;
    line-height: 1.4;
}

.ev-meta-end {
    font-size: 12px;
    color: rgba(238, 238, 240, .42);
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

.ev-meta-loc-link {
    text-decoration: none;
    border-radius: 10px;
    transition: background .15s;
    padding: 4px 6px;
    margin: -4px -6px;
}

.ev-meta-loc-link:active {
    background: rgba(201, 150, 60, .10);
}

.ev-meta-icon-gold svg {
    stroke: #C9963C;
}

.ev-meta-loc-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .8px;
    text-transform: uppercase;
    color: #C9963C;
    line-height: 1;
}

.ev-meta-text-loc {
    flex: 1;
    padding-right: 10px;
}

.ev-meta-arrow-wrap {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 8px;
    background: rgba(201, 150, 60, .13);
    box-shadow: 0 0 8px rgba(201, 150, 60, .25);
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: center;
}

.ev-meta-arrow-wrap svg {
    width: 12px;
    height: 12px;
    color: #C9963C;
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
    background: #111114;
    flex-shrink: 0;
    z-index: 2;
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
    border-top: 1.5px dashed rgba(44, 44, 46, 1);
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
    background: rgba(201, 150, 60, .22);
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
    background: rgba(201, 150, 60, .15);
    border: .7px solid rgba(201, 150, 60, .35);
    border-radius: 99px;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .8px;
    text-transform: uppercase;
    color: #C9963C;
    margin-bottom: 6px;
}

.stub-name {
    font-size: 16px;
    font-weight: 700;
    color: #EEEEF0;
    letter-spacing: -.2px;
    line-height: 1.3;
    word-break: break-word;
    margin-bottom: 3px;
}

.stub-phone {
    font-size: 12px;
    color: rgba(238, 238, 240, .45);
}

/* View Card button */
.view-card-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 9px 14px;
    border-radius: 10px;
    border: 1px solid rgba(90, 138, 219, .30);
    background: rgba(90, 138, 219, .08);
    color: #5A8ADB;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background .15s, opacity .15s;
    margin-bottom: 8px;
}

.view-card-btn svg {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
}

.view-card-btn:active {
    opacity: .7;
}

.view-card-btn:hover {
    background: rgba(90, 138, 219, .15);
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

.stub-status:active {
    opacity: .75;
}

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

    0%,
    100% {
        box-shadow: 0 0 0 0 rgba(212, 130, 10, .15);
    }

    50% {
        box-shadow: 0 0 0 5px rgba(212, 130, 10, 0);
    }
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
}

.status-in .status-indicator {
    color: #1DAB4B;
}

.status-declined .status-indicator {
    color: #E05A5A;
}

.status-pending .status-indicator {
    color: #D4820A;
}

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

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: .35;
    }
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
    background: rgba(28, 28, 30, .98);
    border: 1px solid rgba(44, 44, 46, .8);
    border-radius: 16px;
    padding: 4px;
    gap: 4px;
    margin-bottom: 12px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, .35);
    backdrop-filter: blur(16px);
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
    color: rgba(238, 238, 240, .38);
    transition: background .18s, color .18s;
}

.tab svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
}

.tab-active {
    background: #C9963C;
    color: #fff;
    box-shadow: 0 4px 16px rgba(201, 150, 60, .35);
}

/* ── Section cards ────────────────────────────────────────────────────────── */
.section-card {
    background: rgba(28, 28, 30, 1);
    border: 1px solid rgba(44, 44, 46, .8);
    border-radius: 20px;
    padding: 18px;
    margin-bottom: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, .3);
    backdrop-filter: blur(20px);
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
    color: rgba(238, 238, 240, .42);
}

/* ── Gallery ──────────────────────────────────────────────────────────────── */
.gallery-section {
    margin-bottom: 18px;
}

.gallery-section-hdr {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 8px;
    padding: 0 2px;
}

.gallery-section-hdr svg {
    width: 15px;
    height: 15px;
    color: #C9963C;
    flex-shrink: 0;
}

.gallery-section-hdr span:first-of-type {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .4px;
    text-transform: uppercase;
    color: rgba(238, 238, 240, .7);
}

.gallery-section-count {
    font-size: 11px;
    font-weight: 600;
    color: rgba(238, 238, 240, .4);
    background: rgba(201, 150, 60, .12);
    padding: 2px 7px;
    border-radius: 99px;
}

.gallery-expand-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    margin-top: 6px;
    padding: 10px;
    background: rgba(201, 150, 60, .06);
    border: 1px solid rgba(201, 150, 60, .18);
    border-radius: 12px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .3px;
    color: #C9963C;
    font-family: inherit;
    cursor: pointer;
    transition: background .15s, border-color .15s;
}

.gallery-expand-btn svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
}

.gallery-expand-btn:active {
    background: rgba(201, 150, 60, .13);
}

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

/* ── Gallery cell comment button ─────────────────────────────────────────── */
.gcc {
    position: absolute;
    bottom: 6px;
    right: 6px;
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

.gcc svg {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
}

.gcc-count {
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
}

.gallery-cell:hover .gcc,
.gallery-cell:focus-within .gcc {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
}

/* always visible on touch devices */
@media (hover: none) {
    .gcc {
        opacity: 1;
        transform: none;
        pointer-events: auto;
    }
}

.gcc:active {
    background: rgba(90, 138, 219, .65);
}

/* ── Gallery cell like button ────────────────────────────────────────────── */
.glk {
    position: absolute;
    bottom: 6px;
    left: 6px;
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 4px 7px 4px 5px;
    border-radius: 99px;
    border: none;
    background: rgba(0, 0, 0, .52);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    color: rgba(255, 255, 255, .75);
    cursor: pointer;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity .18s ease, transform .18s ease, background .15s, color .15s;
    pointer-events: none;
    z-index: 2;
}

.glk svg {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
}

.glk-count {
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
}

.glk-liked {
    color: #FF4B6E;
}

.gallery-cell:hover .glk,
.gallery-cell:focus-within .glk {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
}

@media (hover: none) {
    .glk {
        opacity: 1;
        transform: none;
        pointer-events: auto;
    }
}

.glk:active {
    background: rgba(255, 75, 110, .35);
}

.gallery-video-cell {
    background: #1A1A20;
}

.gallery-video-thumb {
    width: 100%;
    height: 100%;
    position: relative;
}

.gallery-video-thumb video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    opacity: .75;
}

.gallery-play-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

.gallery-play-overlay svg {
    width: 44px;
    height: 44px;
    color: #fff;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, .4));
}

.gallery-cell:active .gallery-play-overlay svg {
    opacity: .7;
    transform: scale(.9);
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
    color: rgba(238, 238, 240, .38);
    font-weight: 600;
}

.gallery-more-btn {
    display: block;
    width: 100%;
    margin-top: 10px;
    padding: 13px;
    background: rgba(28, 28, 30, .98);
    border: 1px solid rgba(44, 44, 46, .8);
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
    transform-origin: center center;
    transition: transform .05s linear;
    will-change: transform;
    user-select: none;
    -webkit-user-drag: none;
}

.lb-video {
    max-width: 100%;
    max-height: 75vh;
    border-radius: 14px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, .5);
    outline: none;
    background: #000;
}

.lb-folder-badge {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .5px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, .75);
    background: rgba(255, 255, 255, .12);
    backdrop-filter: blur(10px);
    padding: 4px 12px;
    border-radius: 99px;
    white-space: nowrap;
    pointer-events: none;
}

.lb-fade-enter-active,
.lb-fade-leave-active {
    transition: opacity .2s;
}

.lb-fade-enter-from,
.lb-fade-leave-to {
    opacity: 0;
}

/* ── Lightbox like button ─────────────────────────────────────────────────── */
.lb-like-btn {
    position: absolute;
    bottom: 24px;
    left: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, .15);
    backdrop-filter: blur(8px);
    color: rgba(255, 255, 255, .8);
    cursor: pointer;
    transition: background .15s, color .15s;
}

.lb-like-btn svg {
    width: 20px;
    height: 20px;
}

.lb-like-btn-active {
    background: rgba(255, 75, 110, .3);
    color: #FF4B6E;
}

.lb-like-btn:active {
    opacity: .7;
}

.lb-like-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 99px;
    background: #FF4B6E;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

/* ── Lightbox comment button ──────────────────────────────────────────────── */
.lb-comment-btn {
    position: absolute;
    bottom: 24px;
    right: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, .15);
    backdrop-filter: blur(8px);
    color: #fff;
    cursor: pointer;
    transition: background .15s;
}

.lb-comment-btn svg {
    width: 20px;
    height: 20px;
}

.lb-comment-btn-active {
    background: rgba(90, 138, 219, .45);
}

.lb-comment-btn:active {
    opacity: .7;
}

.lb-comment-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 99px;
    background: #5A8ADB;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

/* ── Media comments bottom sheet ─────────────────────────────────────────── */
.mc-sheet {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 62vh;
    background: rgba(18, 18, 22, .92);
    backdrop-filter: blur(20px);
    border-radius: 20px 20px 0 0;
    border-top: 1px solid rgba(255, 255, 255, .1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.mc-handle {
    flex-shrink: 0;
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, .25);
    margin: 10px auto 0;
}

.mc-title {
    flex-shrink: 0;
    padding: 10px 16px 8px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(238, 238, 240, .9);
    border-bottom: 1px solid rgba(255, 255, 255, .07);
}

.mc-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0 4px;
    -webkit-overflow-scrolling: touch;
}

.mc-list .cmnt-item {
    padding: 8px 16px;
}

.mc-empty {
    padding: 20px 16px;
    text-align: center;
    font-size: 13px;
    color: rgba(238, 238, 240, .35);
}

.mc-compose {
    flex-shrink: 0;
    border-top: 1px solid rgba(255, 255, 255, .07);
    padding: 10px 12px 14px;
    background: rgba(18, 18, 22, .6);
}

/* ── mc-slide transition ──────────────────────────────────────────────────── */
.mc-slide-enter-active,
.mc-slide-leave-active {
    transition: transform .28s cubic-bezier(.32, 0, .67, 0);
}

.mc-slide-enter-from,
.mc-slide-leave-to {
    transform: translateY(100%);
}

/* About */
.about-text {
    font-size: 14px;
    color: rgba(238, 238, 240, .72);
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
    background: rgba(28, 28, 30, .98);
    border: 1px solid rgba(44, 44, 46, .8);
    border-radius: 16px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(238, 238, 240, .55);
    text-decoration: none;
    transition: color .2s, border-color .2s, background .2s;
    margin-bottom: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, .25);
    backdrop-filter: blur(12px);
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
    background: rgba(0, 0, 0, .78);
    backdrop-filter: blur(12px);
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
    background: rgba(28, 28, 30, .97);
    border: 1px solid rgba(44, 44, 46, 1);
    border-radius: 28px;
    padding: 32px 24px 28px;
    box-shadow: 0 32px 80px rgba(0, 0, 0, .6), 0 0 0 1px rgba(201, 150, 60, .12);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    animation: rsvpUp .45s cubic-bezier(.22, 1, .36, 1) both;
    backdrop-filter: blur(30px);
}

@keyframes rsvpUp {
    from {
        opacity: 0;
        transform: translateY(40px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
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
    color: #EEEEF0;
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
    color: rgba(238, 238, 240, .48);
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
    background: rgba(40, 40, 44, .98);
    border: 1px solid rgba(44, 44, 46, 1);
    color: rgba(238, 238, 240, .5);
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
    gap: 7px;
    margin-bottom: 3px;
    min-width: 0;
}

.cmnt-name {
    font-size: 11px;
    font-weight: 600;
    color: #EEEEF0;
    flex: 1;
    min-width: 0;
    word-break: break-word;
}

.cmnt-time {
    font-size: 10px;
    color: rgba(238, 238, 240, .32);
    flex-shrink: 0;
    white-space: nowrap;
}

.cmnt-text {
    font-size: 13px;
    color: rgba(238, 238, 240, .65);
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
    color: rgba(238, 238, 240, .35);
}

.cmnt-replies {
    margin-top: 10px;
    padding-left: 10px;
    border-left: 2px solid rgba(44, 44, 46, .8);
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
    color: rgba(238, 238, 240, .35);
    text-align: center;
    padding: 12px 0 16px;
}

.cmnt-compose {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 14px;
    border-top: 1px solid rgba(44, 44, 46, .8);
}

.cmnt-input {
    flex: 1;
    background: rgba(40, 40, 44, .98);
    border: 1px solid rgba(44, 44, 46, .8);
    border-radius: 20px;
    padding: 9px 14px;
    font-size: 13px;
    color: #EEEEF0;
    outline: none;
    font-family: inherit;
    transition: border-color .18s, background .18s;
}

.cmnt-input::placeholder {
    color: rgba(238, 238, 240, .3);
}

.cmnt-input:focus {
    border-color: rgba(201, 150, 60, .45);
    background: rgba(201, 150, 60, .07);
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

/* ── Gift card (section tile) ───────────────────────────────────────────────── */
.gift-card {
    cursor: pointer;
    padding: 0;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(30,20,10,.82) 0%, rgba(22,16,8,.9) 100%);
    border: 1px solid rgba(201,150,60,.28);
    transition: border-color .2s, box-shadow .2s;
}
.gift-card:hover {
    border-color: rgba(201,150,60,.55);
    box-shadow: 0 0 24px rgba(201,150,60,.12);
}
.gift-card-inner {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px;
}
.gift-icon-wrap {
    flex-shrink: 0;
    width: 46px;
    height: 46px;
    border-radius: 14px;
    background: rgba(201,150,60,.15);
    border: 1px solid rgba(201,150,60,.3);
    display: flex;
    align-items: center;
    justify-content: center;
}
.gift-icon-wrap svg {
    width: 22px;
    height: 22px;
    stroke: #C9963C;
}
.gift-card-text { flex: 1; min-width: 0; }
.gift-card-title {
    font-size: 14px;
    font-weight: 600;
    color: #e8d5a0;
    margin: 0 0 3px;
}
.gift-card-sub {
    font-size: 12px;
    color: rgba(255,255,255,.45);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.gift-card-chevron {
    width: 18px;
    height: 18px;
    stroke: rgba(201,150,60,.6);
    flex-shrink: 0;
}

/* ── Gift card bottom strip ─────────────────────────────────────────────────── */
.gift-card-givers {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 20px 16px;
    border-top: 1px solid rgba(201,150,60,.12);
}
.givers-avatars {
    display: flex;
    align-items: center;
}
.givers-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #16100A;
    margin-left: -7px;
    flex-shrink: 0;
}
.givers-avatars .givers-avatar:first-child { margin-left: 0; }
.givers-overflow {
    background: rgba(255,255,255,.08);
    color: rgba(255,255,255,.5);
    font-size: 9px;
}
.gift-card-givers-lbl {
    font-size: 12px;
    color: rgba(255,255,255,.4);
    flex: 1;
}
.gift-card-tap-lbl {
    font-size: 11px;
    color: rgba(201,150,60,.6);
    white-space: nowrap;
}

/* ── Givers wall (inside sheet) ──────────────────────────────────────────────── */
.givers-wall {
    margin-bottom: 18px;
}
.givers-wall-scroll {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 6px;
    scrollbar-width: none;
}
.givers-wall-scroll::-webkit-scrollbar { display: none; }
.givers-wall-chip {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    width: 72px;
}
.givers-wall-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 15px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid rgba(255,255,255,.08);
}
.givers-wall-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
}
.givers-wall-name {
    font-size: 11px;
    color: rgba(255,255,255,.6);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 72px;
    text-align: center;
}
.givers-wall-amt {
    font-size: 10px;
    color: rgba(201,150,60,.7);
    white-space: nowrap;
}
.givers-wall-lbl {
    font-size: 11px;
    color: rgba(255,255,255,.3);
    text-align: center;
    margin: 8px 0 0;
}

/* ── Gift of Love section ───────────────────────────────────────────────────── */
.zawadi-section {
    background: linear-gradient(135deg, rgba(30,20,10,.82) 0%, rgba(22,16,8,.9) 100%);
    border: 1px solid rgba(201,150,60,.28);
    padding: 18px;
}
.zawadi-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 28px 0 10px;
    color: rgba(255,255,255,.25);
    font-size: 13px;
}
.zawadi-empty svg {
    width: 36px;
    height: 36px;
    stroke: rgba(201,150,60,.3);
}
.zawadi-list { display: flex; flex-direction: column; }
.zawadi-item {
    padding: 14px 0;
    cursor: pointer;
    transition: opacity .15s;
}
.zawadi-item:active { opacity: .7; }
.zawadi-item-sep {
    border-bottom: 1px solid rgba(201,150,60,.1);
}
.zawadi-item-top {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}
.zawadi-item-icon {
    flex-shrink: 0;
    width: 38px;
    height: 38px;
    border-radius: 11px;
    background: rgba(201,150,60,.13);
    border: 1px solid rgba(201,150,60,.25);
    display: flex;
    align-items: center;
    justify-content: center;
}
.zawadi-item-icon svg { width: 18px; height: 18px; stroke: #C9963C; }
.zawadi-item-info { flex: 1; min-width: 0; }
.zawadi-item-title {
    font-size: 14px;
    font-weight: 600;
    color: #e8d5a0;
    margin: 0 0 2px;
    word-break: break-word;
}
.zawadi-item-desc {
    font-size: 12px;
    color: rgba(255,255,255,.38);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.zawadi-item-desc--expanded {
    display: block;
    overflow: visible;
}
.zawadi-read-more {
    background: none;
    border: none;
    padding: 2px 0 0;
    font-size: 11px;
    color: #C9963C;
    cursor: pointer;
    line-height: 1;
}
.zawadi-item-chevron {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    stroke: rgba(201,150,60,.5);
}
.zawadi-progress-wrap { margin-bottom: 10px; }
.zawadi-progress-bar {
    height: 5px;
    background: rgba(255,255,255,.07);
    border-radius: 3px;
    overflow: hidden;
}
.zawadi-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, rgba(201,150,60,.6), #C9963C);
    border-radius: 3px;
    transition: width .4s ease;
    min-width: 3px;
}
.zawadi-item-foot {
    display: flex;
    align-items: center;
    gap: 10px;
}
.zawadi-amounts { flex: 1; min-width: 0; }
.zawadi-funded {
    font-size: 13px;
    font-weight: 700;
    color: #C9963C;
}
.zawadi-target {
    font-size: 12px;
    color: rgba(255,255,255,.35);
}
.zawadi-avatars {
    display: flex;
    align-items: center;
}
.zawadi-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid rgba(22,16,8,.9);
    margin-left: -6px;
    flex-shrink: 0;
}
.zawadi-avatars .zawadi-avatar:first-child { margin-left: 0; }
.zawadi-avatar-more {
    background: rgba(255,255,255,.08);
    color: rgba(255,255,255,.45);
    font-size: 8px;
}
.zawadi-no-gifts {
    font-size: 11px;
    color: rgba(201,150,60,.5);
}

/* ── Gift overlay + sheet ────────────────────────────────────────────────────── */
.gift-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.54);
    z-index: 1200;
    display: flex;
    align-items: flex-end;
}
.gift-sheet {
    width: 100%;
    max-width: 520px;
    margin: 0 auto;
    background: rgba(17,17,20,0.38);
    backdrop-filter: blur(32px);
    -webkit-backdrop-filter: blur(32px);
    border-radius: 28px 28px 0 0;
    border-top: 0.8px solid rgba(255,255,255,0.13);
    border-left: 0.8px solid rgba(255,255,255,0.13);
    border-right: 0.8px solid rgba(255,255,255,0.13);
    padding: 0 24px 40px;
    box-sizing: border-box;
    position: relative;
}
.gift-sheet-handle {
    width: 36px;
    height: 4px;
    background: rgba(255,255,255,.18);
    border-radius: 2px;
    margin: 14px auto 0;
}

/* Header row: back · [icon] title · close */
.gift-hdr-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0 16px;
    gap: 8px;
}
.gift-hdr-identity {
    display: flex;
    align-items: center;
    gap: 9px;
    flex: 1;
}
.gift-hdr-icon {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: rgba(201,150,60,.15);
    border: 1px solid rgba(201,150,60,.28);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.gift-hdr-icon svg { width: 15px; height: 15px; stroke: #C9963C; }
.gift-hdr-title {
    font-size: 17px;
    font-weight: 600;
    color: #EEEEF0;
    margin: 0;
    flex: 1;
    text-align: center;
}
.gift-hdr-identity .gift-hdr-title {
    text-align: left;
}
.gift-hdr-back {
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    cursor: pointer;
    color: #8E8E93;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: color .15s;
}
.gift-hdr-back:hover { color: #EEEEF0; }
.gift-hdr-back svg { width: 20px; height: 20px; }
.gift-sheet-close {
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    cursor: pointer;
    color: #8E8E93;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: color .15s;
}
.gift-sheet-close:hover { color: #EEEEF0; }
.gift-sheet-close svg { width: 18px; height: 18px; }
.gift-sheet-sub {
    font-size: 12.5px;
    color: #8E8E93;
    margin: 0 0 16px;
    text-align: center;
}

/* Preset buttons */
.gift-presets {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
}
.gift-preset {
    background: rgba(255,255,255,.05);
    border: 1.5px solid rgba(255,255,255,.1);
    border-radius: 12px;
    padding: 13px 8px;
    color: #e0c88a;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color .18s, background .18s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}
.gift-preset:hover { background: rgba(201,150,60,.12); border-color: rgba(201,150,60,.4); }
.gift-preset-active { border-color: #C9963C !important; background: rgba(201,150,60,.18) !important; }
.gift-preset-cur { font-size: 10px; font-weight: 400; color: rgba(201,150,60,.7); }

/* Custom amount input */
.gift-custom-wrap {
    display: flex;
    align-items: center;
    background: rgba(255,255,255,.05);
    border: 1.5px solid rgba(255,255,255,.1);
    border-radius: 12px;
    padding: 0 14px;
    margin-bottom: 6px;
    transition: border-color .18s;
}
.gift-custom-wrap:focus-within { border-color: rgba(201,150,60,.5); }
.gift-custom-prefix {
    font-size: 12px;
    color: rgba(201,150,60,.7);
    margin-right: 8px;
    white-space: nowrap;
}
.gift-custom-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: #e8d5a0;
    font-size: 15px;
    padding: 13px 0;
}
.gift-custom-input::placeholder { color: rgba(255,255,255,.25); }
.gift-custom-input::-webkit-outer-spin-button,
.gift-custom-input::-webkit-inner-spin-button { -webkit-appearance: none; }

.gift-err { font-size: 11.5px; color: #e07070; margin: 0 0 10px; }

/* Amount pill */
.gift-amount-pill {
    display: inline-flex;
    align-items: center;
    background: rgba(201,150,60,.18);
    border: 1px solid rgba(201,150,60,.35);
    border-radius: 20px;
    padding: 7px 18px;
    font-size: 17px;
    font-weight: 700;
    color: #e8c870;
    margin: 14px auto 18px;
    display: flex;
    justify-content: center;
}

/* Note textarea */
.gift-note-ta {
    width: 100%;
    box-sizing: border-box;
    background: rgba(255,255,255,.05);
    border: 1.5px solid rgba(255,255,255,.1);
    border-radius: 12px;
    padding: 13px 14px;
    color: #e8d5a0;
    font-size: 14px;
    resize: none;
    outline: none;
    font-family: inherit;
    transition: border-color .18s;
}
.gift-note-ta:focus { border-color: rgba(201,150,60,.45); }
.gift-note-ta::placeholder { color: rgba(255,255,255,.25); }
.gift-char-count { font-size: 11px; color: rgba(255,255,255,.3); text-align: right; margin: 4px 0 14px; }

/* Confirm card */
.gift-confirm-card {
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(201,150,60,.2);
    border-radius: 14px;
    padding: 6px 0;
    margin: 14px 0 10px;
}
.gift-confirm-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 10px 16px;
    border-bottom: 1px solid rgba(255,255,255,.06);
}
.gift-confirm-row:last-child { border-bottom: none; }
.gift-confirm-note-row { flex-direction: column; gap: 5px; }
.gift-confirm-lbl { font-size: 12px; color: rgba(255,255,255,.4); }
.gift-confirm-val { font-size: 14px; color: #e8d5a0; text-align: right; max-width: 60%; word-break: break-word; }
.gift-confirm-amt { font-size: 17px; font-weight: 700; color: #e8c870; }
.gift-confirm-note { font-size: 13px; text-align: left; max-width: 100%; color: rgba(255,255,255,.7); font-style: italic; }
.gift-confirm-disclaimer { font-size: 11px; color: rgba(255,255,255,.3); text-align: center; margin: 0 0 16px; }

/* CTA button */
.gift-cta {
    width: 100%;
    margin-top: 16px;
    padding: 15px;
    border-radius: 14px;
    background: rgba(201,150,60,.18);
    border: 1.5px solid rgba(201,150,60,.4);
    color: #e8c870;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background .18s, border-color .18s, opacity .18s;
}
.gift-cta:hover:not(:disabled) { background: rgba(201,150,60,.28); border-color: #C9963C; }
.gift-cta:disabled { opacity: .45; cursor: not-allowed; }
.gift-cta svg { width: 17px; height: 17px; }
.gift-cta-gold { background: rgba(201,150,60,.28); border-color: #C9963C; }


/* Spinner inside button */
.gift-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(232,200,112,.3);
    border-top-color: #e8c870;
    border-radius: 50%;
    animation: spin .7s linear infinite;
}

/* Done state */
.gift-done { text-align: center; padding: 20px 0 8px; }
.gift-done-icon {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: rgba(61,170,118,.15);
    border: 1.5px solid rgba(61,170,118,.4);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
}
.gift-done-icon svg { width: 32px; height: 32px; stroke: #3DAA76; }
.gift-done-title { font-size: 19px; font-weight: 700; color: #e8d5a0; margin: 0 0 8px; }
.gift-done-sub { font-size: 13.5px; color: rgba(255,255,255,.5); margin: 0 0 24px; }

/* Sheet transition */
/* ── Gift return banner ──────────────────────────────────────────────────────── */
.gift-return-banner {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 32px);
    max-width: 480px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: rgba(17,17,20,0.92);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(201,150,60,.4);
    border-radius: 16px;
    z-index: 1300;
    cursor: pointer;
}
.gift-return-banner svg {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    stroke: #C9963C;
}
.gift-return-title {
    font-size: 13px;
    font-weight: 600;
    color: #e8d5a0;
    margin: 0 0 2px;
}
.gift-return-sub {
    font-size: 11px;
    color: rgba(255,255,255,.4);
    margin: 0;
}
.gift-return-close {
    margin-left: auto;
    background: none;
    border: none;
    color: rgba(255,255,255,.3);
    font-size: 13px;
    cursor: pointer;
    flex-shrink: 0;
}

.gift-overlay-enter-active, .gift-overlay-leave-active { transition: opacity .25s; }
.gift-overlay-enter-from, .gift-overlay-leave-to { opacity: 0; }
.gift-sheet-enter-active, .gift-sheet-leave-active { transition: transform .3s cubic-bezier(.32,1,.4,1); }
.gift-sheet-enter-from, .gift-sheet-leave-to { transform: translateY(100%); }
</style>
