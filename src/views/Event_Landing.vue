<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '@/firebase';
import { doc, onSnapshot, updateDoc, collection, addDoc, getDocs, serverTimestamp, query, orderBy, increment, limit, startAfter } from 'firebase/firestore';

const route   = useRoute();
const eventId = computed(() => route.params.eventId);
const userId  = computed(() => route.params.userId); 

const eventData    = ref(null);
const attendeeData = ref(null); 
const loading      = ref(true);
const hasError     = ref(false);

let unsubEvent = null, unsubAttendee = null, unsubComments = null;

const startSync = () => {
    if (unsubEvent)    unsubEvent();
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

onMounted(startSync);
watch([eventId, userId], startSync);
onUnmounted(() => {
    if (unsubEvent)    unsubEvent();
    if (unsubAttendee) unsubAttendee();
    if (unsubComments) unsubComments();
});

// ── Computed ─────────────────────────────────────────────────────────────────
const isPublished = computed(() => (eventData.value?.status || '').toLowerCase() === 'published');

const fmtDate = iso => {
    if (!iso) return null;
    try { return new Date(iso).toLocaleString('en-TZ', { weekday: 'short', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return null; }
};
const startFmt = computed(() => fmtDate(eventData.value?.startDate));
const endFmt   = computed(() => fmtDate(eventData.value?.endDate));

const attendeeName    = computed(() => attendeeData.value?.fullName || 'Guest');
const attendeePhone   = computed(() => attendeeData.value?.phone || '');
const attendeeInitial = computed(() => attendeeName.value.charAt(0).toUpperCase());

const palette = [
    { bg: '#1A3A28', fg: '#3DAA76' }, { bg: '#1A2838', fg: '#5A8ADB' },
    { bg: '#2A1A38', fg: '#BF5AF2' }, { bg: '#38200A', fg: '#E07040' },
    { bg: '#2A2210', fg: '#C9A84C' },
];
const ac = computed(() => palette[attendeeName.value.charCodeAt(0) % palette.length]);

const hasInvitation  = computed(() => !!attendeeData.value?.cards?.invitation);
const cardBadge = computed(() => hasInvitation.value ? 'Invited Guest' : 'Attendee');

const aboutExpanded = ref(false);
const activeTab     = ref('details');

// ── Gallery ───────────────────────────────────────────────────────────────────
const PAGE_SIZE      = 20;
const lightboxPhoto  = ref(null);
const galleryPhotos  = ref([]);
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
            id:   d.id,
            url:  d.data().url,
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
const rsvpSaving  = ref(false);
const showRsvp    = ref(false);
let   rsvpChecked = false;

watch(attendeeData, (val) => {
    if (val && !rsvpChecked) {
        rsvpChecked = true;
        if (!val.attendanceStatus) showRsvp.value = true;
    }
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
const comments        = ref([]);
const commentText     = ref('');
const commentPosting  = ref(false);
const replyingTo      = ref(null);
const replyTexts      = ref({});
const replyPosting    = ref({});
const expandedReplies = ref({});

const fmtCommentTime = (ts) => {
    if (!ts?.toDate) return '';
    const d = ts.toDate(), now = new Date();
    const s = Math.floor((now - d) / 1000);
    if (s < 60)    return 'just now';
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return d.toLocaleDateString('en-TZ', { day: 'numeric', month: 'short' });
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
        replyTexts.value  = { ...replyTexts.value, [comment.id]: '' };
        replyingTo.value  = null;
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


        <!-- Loading -->
        <div v-if="loading" class="center-screen">
            <div class="spin-ring"></div>
            <p class="spin-lbl">Loading</p>
        </div>

        <!-- Error -->
        <div v-else-if="hasError" class="center-screen">
            <div class="err-circle">✕</div>
            <p class="err-h">Not Found</p>
            <p class="err-p">This event link is invalid or expired.</p>
        </div>

        <!-- Main -->
        <template v-if="!loading && !hasError && eventData">

            <!-- RSVP Prompt — overlays the page so user can see context behind it -->
            <Transition name="rsvp-fade">
                <div v-if="showRsvp" class="rsvp-overlay">
                    <div class="rsvp-card">
                        <div class="rsvp-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/>
                            </svg>
                        </div>
                        <h2 class="rsvp-title">Will you be attending?</h2>
                        <p class="rsvp-event">{{ eventData?.title }}</p>
                        <p class="rsvp-sub">Please confirm your attendance so the host can plan accordingly.</p>
                        <div class="rsvp-actions">
                            <button class="rsvp-btn rsvp-confirm" :disabled="rsvpSaving" @click="submitRsvp('Confirmed')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 13l4 4L19 7"/></svg>
                                <span>{{ rsvpSaving ? 'Saving…' : 'Confirm Attendance' }}</span>
                            </button>
                            <button class="rsvp-btn rsvp-decline" :disabled="rsvpSaving" @click="submitRsvp('Declined')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                <span>Decline</span>
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>

            <div class="wrap">

                <!-- ── TICKET CARD ── -->
                <div class="ticket">

                    <!-- Thumbnail strip -->
                    <div class="thumb-wrap">
                        <img v-if="eventData.eventThumbnail"
                             :src="eventData.eventThumbnail"
                             class="thumb-img" alt="" />
                        <div v-else class="thumb-placeholder">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
                            </svg>
                        </div>
                        <!-- Gradient bottom fade -->
                        <div class="thumb-fade"></div>
                        <!-- Status badge overlaid -->
                        <span :class="['ev-status', isPublished ? 's-live' : 's-draft']">
                            <span class="s-dot"></span>
                            {{ isPublished ? 'Published' : (eventData.status || 'Draft') }}
                        </span>
                    </div>

                    <!-- Event info -->
                    <div class="ev-info">
                        <h1 class="ev-title">{{ eventData.title }}</h1>

                        <div class="ev-meta">
                            <div class="ev-meta-row" v-if="startFmt">
                                <div class="ev-meta-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                        <line x1="8"  y1="2" x2="8"  y2="6"/>
                                        <line x1="3"  y1="10" x2="21" y2="10"/>
                                    </svg>
                                </div>
                                <div class="ev-meta-text">
                                    <span class="ev-meta-primary">{{ startFmt }}</span>
                                    <span v-if="endFmt" class="ev-meta-end">
                                        <span class="ev-meta-until">until</span> {{ endFmt }}
                                    </span>
                                </div>
                            </div>

                            <div class="ev-meta-row" v-if="eventData.location">
                                <div class="ev-meta-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                                        <circle cx="12" cy="9" r="2.5"/>
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
                        <p class="stub-eyebrow">Guest Pass</p>

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

                        <div :class="['stub-status', attendeeData?.attendanceStatus === 'Confirmed' ? 'status-in' : 'status-pending']"
                             @click="showRsvp = true" title="Change RSVP">
                            <div class="status-indicator">
                                <div :class="['status-led', attendeeData?.attendanceStatus === 'Confirmed' ? 'led-green' : 'led-amber']"></div>
                                <span>{{ attendeeData?.attendanceStatus || 'Pending' }}</span>
                            </div>
                            <svg v-if="attendeeData?.attendanceStatus === 'Confirmed'" class="check-mark" viewBox="0 0 24 24" fill="none" stroke="#30D158" stroke-width="2.5">
                                <path d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                    </div>
                </div>
                <!-- /ticket -->

                <!-- ── Tab bar ── -->
                <div class="tab-bar">
                    <button :class="['tab', activeTab === 'details' && 'tab-active']" @click="activeTab = 'details'">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <rect x="3" y="3" width="18" height="18" rx="3"/>
                            <line x1="3" y1="9" x2="21" y2="9"/>
                            <line x1="9" y1="21" x2="9" y2="9"/>
                        </svg>
                        Details
                    </button>
                    <button :class="['tab', activeTab === 'gallery' && 'tab-active']" @click="activeTab = 'gallery'">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                            <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                            <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                            <rect x="14" y="14" width="7" height="7" rx="1.5"/>
                        </svg>
                        Gallery
                    </button>
                </div>

                <!-- ── Details tab ── -->
                <template v-if="activeTab === 'details'">
                    <!-- About -->
                    <div v-if="eventData.description" class="section-card anim" style="--d:.05s">
                        <div class="s-hdr">
                            <div class="s-bar"></div>
                            <span class="s-lbl">About</span>
                        </div>
                        <p :class="['about-text', { 'about-clamped': !aboutExpanded }]">{{ eventData.description }}</p>
                        <button v-if="eventData.description.length > 180" class="about-toggle" @click="aboutExpanded = !aboutExpanded">
                            {{ aboutExpanded ? 'Show less' : 'Read more' }}
                        </button>
                    </div>

                    <!-- Comments -->
                    <div class="section-card anim" style="--d:.1s">
                        <div class="s-hdr">
                            <div class="s-bar"></div>
                            <span class="s-lbl">Comments<span v-if="comments.length" class="cmnt-count"> ({{ comments.length }})</span></span>
                        </div>

                        <div class="cmnt-list" v-if="comments.length">
                            <div v-for="c in comments" :key="c.id" class="cmnt-item">
                                <div class="cmnt-avatar" :style="{ background: c.userColor?.bg, color: c.userColor?.fg }">{{ c.userInitial }}</div>
                                <div class="cmnt-body">
                                    <div class="cmnt-meta">
                                        <span class="cmnt-name">{{ c.userName }}</span>
                                        <span class="cmnt-time">{{ fmtCommentTime(c.createdAt) }}</span>
                                    </div>
                                    <p class="cmnt-text">{{ c.text }}</p>
                                    <div class="cmnt-actions">
                                        <button class="cmnt-reply-btn" @click="openReply(c.id)">Reply</button>
                                        <button v-if="c.replyCount > 0" class="cmnt-view-replies" @click="toggleReplies(c)">
                                            {{ expandedReplies[c.id] ? 'Hide replies' : `${c.replyCount} ${c.replyCount === 1 ? 'reply' : 'replies'}` }}
                                        </button>
                                    </div>

                                    <div v-if="replyingTo === c.id" class="cmnt-reply-form">
                                        <input v-model="replyTexts[c.id]" class="cmnt-input" placeholder="Write a reply…"
                                            @keydown.enter.prevent="postReply(c)" />
                                        <button class="cmnt-send" :disabled="!replyTexts[c.id]?.trim() || replyPosting[c.id]" @click="postReply(c)">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                            </svg>
                                        </button>
                                    </div>

                                    <div v-if="expandedReplies[c.id]" class="cmnt-replies">
                                        <div v-for="r in expandedReplies[c.id]" :key="r.id" class="cmnt-item">
                                            <div class="cmnt-avatar cmnt-avatar-sm" :style="{ background: r.userColor?.bg, color: r.userColor?.fg }">{{ r.userInitial }}</div>
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

                        <p v-else class="cmnt-empty">No comments yet. Be the first!</p>

                        <div class="cmnt-compose">
                            <div class="cmnt-avatar cmnt-avatar-sm" :style="{ background: ac?.bg, color: ac?.fg }">{{ attendeeInitial }}</div>
                            <input v-model="commentText" class="cmnt-input" placeholder="Write a comment…"
                                @keydown.enter.prevent="postComment" />
                            <button class="cmnt-send" :disabled="!commentText.trim() || commentPosting" @click="postComment">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Support -->
                    <a v-if="eventData.supportPhone"
                       :href="`https://wa.me/${eventData.supportPhone.replace(/\D/g,'')}`"
                       target="_blank" class="support-link anim" style="--d:.15s">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                        </svg>
                        Contact Support
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
                                <rect x="3" y="3" width="18" height="18" rx="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <path d="m21 15-5-5L5 21"/>
                            </svg>
                        </div>
                        <p class="gallery-empty-txt">No photos yet</p>
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
                        <button v-if="galleryHasMore" class="gallery-more-btn"
                                :disabled="galleryLoading" @click="fetchGallery(false)">
                            {{ galleryLoading ? 'Loading…' : 'Load more' }}
                        </button>
                    </template>

                </template>

                <!-- Lightbox (always mounted) -->
                <Teleport to="body">
                    <Transition name="lb-fade">
                        <div v-if="lightboxPhoto" class="lb-overlay" @click.self="lightboxPhoto = null">
                            <button class="lb-close" @click="lightboxPhoto = null">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Page ─────────────────────────────────────────────────────────────────── */
.page {
    min-height: 100vh;
    background: #111114;
    color: #EEEEF0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
}
.wrap {
    max-width: 480px;
    margin: 0 auto;
    padding: 24px 16px;
}

/* ── Loading / Error ──────────────────────────────────────────────────────── */
.center-screen {
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 14px; padding: 32px;
}
.spin-ring {
    width: 38px; height: 38px;
    border: 2px solid rgba(201,168,76,.15);
    border-top-color: #C9A84C;
    border-radius: 50%;
    animation: spin .75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.spin-lbl { font-size: 11px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: #48484A; }
.err-circle {
    width: 64px; height: 64px; border-radius: 50%;
    background: rgba(201,168,76,.08); border: 1px solid rgba(201,168,76,.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; color: #C9A84C;
}
.err-h { font-size: 20px; font-weight: 800; }
.err-p { font-size: 13px; color: #8E8E93; text-align: center; line-height: 1.6; }

/* ── TICKET ───────────────────────────────────────────────────────────────── */
.ticket {
    background: #1C1C1E;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 24px;
    overflow: hidden;
    margin-bottom: 14px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.45);
    animation: fadeUp .55s cubic-bezier(.22,1,.36,1) both;
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
    background: #111114;
}
.thumb-img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
}
.thumb-placeholder {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: #151518;
}
.thumb-placeholder svg { width: 48px; height: 48px; opacity: .4; }
.thumb-fade {
    position: absolute; bottom: 0; left: 0; right: 0; height: 80px;
    background: linear-gradient(to bottom, transparent, #1C1C1E);
}

/* Status badge */
.ev-status {
    position: absolute; top: 14px; right: 14px;
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px;
    border-radius: 99px;
    font-size: 10px; font-weight: 800; letter-spacing: 1px;
    backdrop-filter: blur(12px);
}
.s-live  { background: rgba(17,17,20,.82); border: .8px solid rgba(201,168,76,.5); color: #C9A84C; }
.s-draft { background: rgba(17,17,20,.82); border: .8px solid rgba(72,72,74,.6);   color: #48484A; }
.s-dot   { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

/* Event info */
.ev-info { padding: 16px 20px 20px; }
.ev-title {
    font-size: 22px; font-weight: 800;
    color: #EEEEF0; letter-spacing: -.5px; line-height: 1.2;
    margin-bottom: 14px;
}
.ev-meta       { display: flex; flex-direction: column; gap: 10px; }
.ev-meta-row   { display: flex; align-items: flex-start; gap: 10px; }
.ev-meta-icon  {
    width: 30px; height: 30px; flex-shrink: 0;
    background: rgba(201,168,76,.10);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
}
.ev-meta-icon svg { width: 14px; height: 14px; color: #C9A84C; }
.ev-meta-text     { display: flex; flex-direction: column; gap: 2px; padding-top: 5px; }
.ev-meta-primary  { font-size: 13px; color: #E0E0E0; font-weight: 500; line-height: 1.4; }
.ev-meta-end      { font-size: 12px; color: #8E8E93; display: flex; align-items: center; gap: 4px; }
.ev-meta-until    { font-size: 10px; text-transform: uppercase; letter-spacing: .6px; color: #C9A84C; font-weight: 600; }

/* ── Tear / perforation ────────────────────────────────────────────────────── */
.tear {
    display: flex;
    align-items: center;
    margin: 0 -1px; /* bleed over border */
}
.tear-notch {
    width: 20px; height: 20px;
    border-radius: 50%;
    background: #111114;
    flex-shrink: 0;
    border: 1px solid rgba(255,255,255,.07);
}
.tear-l { border-left: none; border-radius: 0 50% 50% 0; margin-left: -1px; }
.tear-r { border-right: none; border-radius: 50% 0 0 50%; margin-right: -1px; }
.tear-line {
    flex: 1;
    border-top: 1.5px dashed rgba(255,255,255,0.07);
}

/* ── Attendee stub ─────────────────────────────────────────────────────────── */
.stub { padding: 20px 20px 22px; }

.stub-eyebrow {
    font-size: 10px; font-weight: 800;
    letter-spacing: 1.4px; text-transform: uppercase;
    color: #C9A84C; margin-bottom: 16px;
    display: flex; align-items: center; gap: 7px;
}
.stub-eyebrow::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(201,168,76,.15);
}

.stub-main {
    display: flex; align-items: center; gap: 16px;
    margin-bottom: 18px;
}

/* Avatar */
.stub-avatar {
    width: 64px; height: 64px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    position: relative;
}
.stub-initial { font-size: 26px; font-weight: 800; letter-spacing: -.5px; line-height: 1; }
.stub-avatar-ring {
    position: absolute; inset: -3px;
    border-radius: 50%;
    border: 1.5px solid;
}

.stub-info { min-width: 0; }
.stub-badge {
    display: inline-flex;
    padding: 3px 10px;
    background: rgba(42,34,16,.9);
    border: .7px solid rgba(201,168,76,.35);
    border-radius: 99px;
    font-size: 9px; font-weight: 800;
    letter-spacing: .8px; text-transform: uppercase;
    color: #C9A84C; margin-bottom: 6px;
}
.stub-name {
    font-size: 24px; font-weight: 800;
    color: #EEEEF0; letter-spacing: -.6px; line-height: 1.1;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 3px;
}
.stub-phone { font-size: 12px; color: #8E8E93; }

/* Status */
.stub-status {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px;
    border-radius: 12px;
    cursor: pointer;
}
.status-in      { background: rgba(48,209,88,.07);  border: 1px solid rgba(48,209,88,.18);  }
.status-pending { background: rgba(255,159,10,.07); border: 1px solid rgba(255,159,10,.18); }
.status-indicator { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
.status-in      .status-indicator { color: #30D158; }
.status-pending .status-indicator { color: #FF9F0A; }
.status-led {
    width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}
.led-green { background: #30D158; box-shadow: 0 0 7px rgba(48,209,88,.6); animation: blink 2s ease infinite; }
.led-amber { background: #FF9F0A; }
@keyframes blink { 0%,100%{opacity:1}50%{opacity:.4} }
.check-mark { width: 20px; height: 20px; }

/* ── Section cards ────────────────────────────────────────────────────────── */
.section-card {
    background: #1C1C1E;
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 20px;
    padding: 18px;
    margin-bottom: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,.25);
}
.anim { animation: fadeUp .5s cubic-bezier(.22,1,.36,1) both var(--d, 0s); }

.s-hdr { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.s-bar { width: 3px; height: 13px; background: #C9A84C; border-radius: 2px; flex-shrink: 0; }
.s-lbl { font-size: 11px; font-weight: 700; letter-spacing: 1.3px; text-transform: uppercase; color: #8E8E93; }


/* ── Tab bar ──────────────────────────────────────────────────────────────── */
.tab-bar {
    display: flex;
    background: #1C1C1E;
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 16px;
    padding: 4px;
    gap: 4px;
    margin-bottom: 12px;
}
.tab {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 10px 0;
    border: none; border-radius: 12px; cursor: pointer;
    font-size: 12px; font-weight: 600; letter-spacing: .4px;
    font-family: inherit; background: transparent; color: #636366;
    transition: background .18s, color .18s;
}
.tab svg { width: 14px; height: 14px; flex-shrink: 0; }
.tab-active { background: #2C2C2E; color: #E0E0E0; }

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
    background: #2C2C2E;
}
.gallery-cell.gallery-tall { grid-row: span 2; }
.gallery-cell img {
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform .3s ease, opacity .3s;
    display: block;
}
.gallery-cell:active img { transform: scale(1.04); opacity: .85; }

/* Gallery extras */
.gallery-spinner {
    display: flex; justify-content: center; padding: 48px 0;
}
.gallery-empty {
    display: flex; flex-direction: column; align-items: center;
    gap: 12px; padding: 56px 32px;
}
.gallery-empty-icon {
    width: 56px; height: 56px; border-radius: 50%;
    background: rgba(201,168,76,.08);
    border: 1px solid rgba(201,168,76,.2);
    display: flex; align-items: center; justify-content: center;
    color: #C9A84C;
}
.gallery-empty-icon svg { width: 24px; height: 24px; }
.gallery-empty-txt { font-size: 14px; color: #48484A; font-weight: 600; }
.gallery-more-btn {
    display: block; width: 100%; margin-top: 10px;
    padding: 13px;
    background: #1C1C1E;
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 14px;
    font-size: 13px; font-weight: 600;
    color: #C9A84C; font-family: inherit; cursor: pointer;
    transition: background .18s, border-color .18s;
}
.gallery-more-btn:disabled { opacity: .4; cursor: default; }
.gallery-more-btn:not(:disabled):active { background: rgba(42,34,16,.6); border-color: rgba(201,168,76,.3); }

/* Lightbox */
.lb-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,.92);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 24px;
}
.lb-close {
    position: absolute; top: 20px; right: 20px;
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(255,255,255,.1); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center; color: #fff;
}
.lb-close svg { width: 16px; height: 16px; }
.lb-img {
    max-width: 100%; max-height: 75vh;
    border-radius: 14px;
    object-fit: contain;
    box-shadow: 0 24px 60px rgba(0,0,0,.6);
}
.lb-caption {
    margin-top: 14px; font-size: 13px; color: #8E8E93; text-align: center;
}
.lb-fade-enter-active, .lb-fade-leave-active { transition: opacity .2s; }
.lb-fade-enter-from, .lb-fade-leave-to { opacity: 0; }

/* About */
.about-text    { font-size: 14px; color: #8E8E93; line-height: 1.75; }
.about-clamped { display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.about-toggle  {
    background: none; border: none; cursor: pointer; padding: 6px 0 0;
    font-size: 12px; font-weight: 600; color: #C9A84C; font-family: inherit;
    letter-spacing: .3px;
}

/* Support */
.support-link {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 13px;
    background: #1C1C1E;
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 16px;
    font-size: 13px; font-weight: 600;
    color: #8E8E93; text-decoration: none;
    transition: color .2s, border-color .2s, background .2s;
    margin-bottom: 12px;
}
.support-link svg  { width: 15px; height: 15px; }
.support-link:hover { color: #C9A84C; border-color: rgba(201,168,76,.3); background: rgba(42,34,16,.5); }

/* ── RSVP Overlay ─────────────────────────────────────────────────────────── */
.rsvp-overlay {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(10,10,10,.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: flex-end; justify-content: center;
    padding: 0 16px 32px;
}
@media (min-height: 600px) {
    .rsvp-overlay { align-items: center; padding: 24px 16px; }
}
.rsvp-card {
    width: 100%; max-width: 420px;
    background: #1C1C1E;
    border: 1px solid rgba(255,255,255,.09);
    border-radius: 28px;
    padding: 32px 24px 28px;
    box-shadow: 0 24px 60px rgba(0,0,0,.6);
    display: flex; flex-direction: column; align-items: center; gap: 0;
    animation: rsvpUp .45s cubic-bezier(.22,1,.36,1) both;
}
@keyframes rsvpUp {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0); }
}
.rsvp-icon {
    width: 56px; height: 56px;
    background: rgba(201,168,76,.12);
    border: 1px solid rgba(201,168,76,.25);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: #C9A84C; margin-bottom: 18px;
}
.rsvp-icon svg { width: 24px; height: 24px; }
.rsvp-title {
    font-size: 22px; font-weight: 800;
    color: #EEEEF0; letter-spacing: -.4px;
    margin-bottom: 6px; text-align: center;
}
.rsvp-event {
    font-size: 13px; font-weight: 600;
    color: #C9A84C; margin-bottom: 10px; text-align: center;
}
.rsvp-sub {
    font-size: 13px; color: #8E8E93;
    line-height: 1.6; text-align: center;
    margin-bottom: 28px;
}
.rsvp-actions {
    width: 100%; display: flex; flex-direction: column; gap: 10px;
}
.rsvp-btn {
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 9px;
    padding: 15px;
    border-radius: 16px;
    border: none; cursor: pointer;
    font-size: 15px; font-weight: 700;
    font-family: inherit;
    transition: opacity .15s, transform .1s;
}
.rsvp-btn:disabled { opacity: .5; cursor: not-allowed; }
.rsvp-btn svg { width: 18px; height: 18px; flex-shrink: 0; }
.rsvp-confirm {
    background: rgba(48,209,88,.15);
    border: 1px solid rgba(48,209,88,.35);
    color: #30D158;
}
.rsvp-confirm:not(:disabled):active { opacity: .75; transform: scale(.98); }
.rsvp-decline {
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.1);
    color: #8E8E93;
}
.rsvp-decline:not(:disabled):active { opacity: .75; transform: scale(.98); }

/* transition */
.rsvp-fade-enter-active, .rsvp-fade-leave-active { transition: opacity .3s; }
.rsvp-fade-enter-from, .rsvp-fade-leave-to { opacity: 0; }

/* ── Comments ─────────────────────────────────────────────────────────────── */
.cmnt-count       { color: #C9A84C; font-weight: 700; }
.cmnt-list        { display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; max-height: 380px; overflow-y: auto; padding-right: 4px; }
.cmnt-item        { display: flex; gap: 10px; }
.cmnt-avatar      {
    width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
}
.cmnt-avatar-sm   { width: 28px; height: 28px; font-size: 11px; }
.cmnt-body        { flex: 1; min-width: 0; }
.cmnt-meta        { display: flex; align-items: baseline; gap: 8px; margin-bottom: 3px; }
.cmnt-name        { font-size: 13px; font-weight: 600; color: #E0E0E0; }
.cmnt-time        { font-size: 11px; color: #48484A; }
.cmnt-text        { font-size: 13px; color: #AEAEB2; line-height: 1.5; }
.cmnt-actions     { display: flex; gap: 12px; margin-top: 6px; }
.cmnt-reply-btn, .cmnt-view-replies {
    background: none; border: none; cursor: pointer; padding: 0;
    font-size: 11px; font-weight: 600; letter-spacing: .4px; text-transform: uppercase; font-family: inherit;
}
.cmnt-reply-btn    { color: #C9A84C; }
.cmnt-view-replies { color: #48484A; }
.cmnt-replies      {
    margin-top: 10px; padding-left: 10px;
    border-left: 2px solid rgba(255,255,255,.07);
    display: flex; flex-direction: column; gap: 12px;
}
.cmnt-reply-form  { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.cmnt-empty       { font-size: 13px; color: #48484A; text-align: center; padding: 12px 0 16px; }
.cmnt-compose     {
    display: flex; align-items: center; gap: 8px;
    padding-top: 14px;
    border-top: 1px solid rgba(255,255,255,.07);
}
.cmnt-input {
    flex: 1; background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.09); border-radius: 20px;
    padding: 9px 14px; font-size: 13px; color: #E0E0E0;
    outline: none; font-family: inherit;
}
.cmnt-input::placeholder { color: #3A3A3C; }
.cmnt-input:focus         { border-color: rgba(201,168,76,.4); }
.cmnt-send {
    width: 34px; height: 34px; border-radius: 50%;
    background: #C9A84C; border: none; cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: opacity .15s;
}
.cmnt-send:disabled   { opacity: .3; cursor: default; }
.cmnt-send svg        { width: 13px; height: 13px; color: #111; }
</style>
