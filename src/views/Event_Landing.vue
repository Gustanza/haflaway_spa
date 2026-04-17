<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const route   = useRoute();
const eventId = computed(() => route.params.eventId);
const userId  = computed(() => route.params.userId);

const eventData    = ref(null);
const attendeeData = ref(null);
const loading      = ref(true);
const hasError     = ref(false);

let unsubEvent = null, unsubAttendee = null;

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
};

onMounted(startSync);
watch([eventId, userId], startSync);
onUnmounted(() => { if (unsubEvent) unsubEvent(); if (unsubAttendee) unsubAttendee(); });

// ── Computed ─────────────────────────────────────────────────────────────────
const isPublished = computed(() => (eventData.value?.status || '').toLowerCase() === 'published');

const fmtDate = iso => {
    if (!iso) return null;
    try { return new Date(iso).toLocaleString('en-TZ', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
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
const hasContribution= computed(() => !!attendeeData.value?.cards?.contribution);
const cardBadge = computed(() => hasInvitation.value ? 'Invited Guest' : hasContribution.value ? 'Contributor' : 'Attendee');
const isCheckedIn = computed(() => {
    const inv = attendeeData.value?.cards?.invitation;
    return inv?.attendance === true || inv?.attendance === 'checked';
});

const pledged    = computed(() => attendeeData.value?.pledgedAmount || 0);
const paid       = computed(() => attendeeData.value?.paidAmount    || 0);
const remaining  = computed(() => Math.max(pledged.value - paid.value, 0));
const pct        = computed(() => pledged.value > 0 ? Math.min((paid.value / pledged.value) * 100, 100) : 0);

const fmt = v => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(v || 0);
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
                                    <span>{{ startFmt }}</span>
                                    <span v-if="endFmt" class="ev-meta-end"> → {{ endFmt }}</span>
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

                        <div :class="['stub-status', isCheckedIn ? 'status-in' : 'status-pending']">
                            <div class="status-indicator">
                                <div :class="['status-led', isCheckedIn ? 'led-green' : 'led-amber']"></div>
                                <span>{{ isCheckedIn ? 'Checked In' : 'Pending Arrival' }}</span>
                            </div>
                            <svg v-if="isCheckedIn" class="check-mark" viewBox="0 0 24 24" fill="none" stroke="#30D158" stroke-width="2.5">
                                <path d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                    </div>
                </div>
                <!-- /ticket -->

                <!-- ── Contribution ── -->
                <div v-if="hasContribution" class="section-card anim" style="--d:.05s">
                    <div class="s-hdr">
                        <div class="s-bar"></div>
                        <span class="s-lbl">Contribution</span>
                    </div>

                    <div class="contrib-top">
                        <div>
                            <p class="c-sub">Remaining</p>
                            <p class="c-amount">{{ fmt(remaining) }}</p>
                        </div>
                        <div class="c-badge">{{ pct.toFixed(0) }}%</div>
                    </div>

                    <div class="c-track">
                        <div class="c-fill" :style="{ '--w': pct + '%' }"></div>
                    </div>

                    <div class="c-row">
                        <div class="c-cell">
                            <span class="c-cell-lbl">Pledged</span>
                            <span class="c-cell-val">{{ fmt(pledged) }}</span>
                        </div>
                        <div class="c-divider"></div>
                        <div class="c-cell" style="align-items:flex-end">
                            <span class="c-cell-lbl">Paid</span>
                            <span class="c-cell-val" style="color:#30D158">{{ fmt(paid) }}</span>
                        </div>
                    </div>
                </div>

                <!-- ── About ── -->
                <div v-if="eventData.description" class="section-card anim" style="--d:.1s">
                    <div class="s-hdr">
                        <div class="s-bar"></div>
                        <span class="s-lbl">About</span>
                    </div>
                    <p class="about-text">{{ eventData.description }}</p>
                </div>

                <!-- ── Support ── -->
                <a v-if="eventData.supportPhone"
                   :href="`https://wa.me/${eventData.supportPhone.replace(/\D/g,'')}`"
                   target="_blank" class="support-link anim" style="--d:.15s">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    Contact Support
                </a>

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
.ev-meta-text  { font-size: 13px; color: #AEAEB2; line-height: 1.5; padding-top: 6px; }
.ev-meta-end   { color: #8E8E93; display: block; font-size: 12px; }

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

/* Contribution */
.contrib-top { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 14px; }
.c-sub    { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #48484A; margin-bottom: 4px; }
.c-amount { font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -1px; line-height: 1; }
.c-badge  {
    padding: 4px 11px;
    background: rgba(42,34,16,.9); border: .7px solid rgba(201,168,76,.35);
    border-radius: 9px; font-size: 13px; font-weight: 800; color: #C9A84C;
    flex-shrink: 0; margin-bottom: 2px;
}
.c-track {
    height: 4px; background: rgba(255,255,255,.06); border-radius: 99px;
    overflow: hidden; margin-bottom: 14px;
}
.c-fill {
    height: 100%; width: var(--w, 0%);
    background: linear-gradient(90deg, rgba(201,168,76,.6), #C9A84C);
    border-radius: 99px;
    animation: fillBar 1s cubic-bezier(.22,1,.36,1) both .3s;
}
@keyframes fillBar { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
.c-row { display: flex; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.05); border-radius: 12px; overflow: hidden; }
.c-cell { flex: 1; padding: 11px 14px; display: flex; flex-direction: column; gap: 3px; }
.c-divider { width: 1px; background: rgba(255,255,255,.05); flex-shrink: 0; }
.c-cell-lbl { font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #48484A; }
.c-cell-val { font-size: 13px; font-weight: 700; color: #AEAEB2; }

/* About */
.about-text { font-size: 14px; color: #8E8E93; line-height: 1.75; }

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
</style>
