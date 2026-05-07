<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
    SparklesIcon,
    EnvelopeIcon,
    UsersIcon,
    RocketLaunchIcon,
    ChatBubbleLeftRightIcon,
    QrCodeIcon,
    CurrencyDollarIcon,
    PhotoIcon,
    ShieldCheckIcon,
    DevicePhoneMobileIcon,
} from '@heroicons/vue/24/outline';

// ── Scroll ────────────────────────────────────────────────────────────────────
const scrollY = ref(0);
const handleScroll = () => { scrollY.value = window.scrollY; };

// Phone drifts up slowly; inner content scrolls to reveal more app
const phoneStyle   = computed(() => ({ transform: `translateY(${-scrollY.value * 0.07}px)`, willChange: 'transform' }));
const innerScroll  = computed(() => Math.min(scrollY.value * 0.14, 90));
const pill1Style   = computed(() => ({ transform: `translateY(${-scrollY.value * 0.04}px)` }));
const pill2Style   = computed(() => ({ transform: `translateY(${-scrollY.value * 0.09}px)` }));
const pill3Style   = computed(() => ({ transform: `translateY(${-scrollY.value * 0.06}px)` }));

// ── Data ──────────────────────────────────────────────────────────────────────
const steps = [
    { icon: DevicePhoneMobileIcon, title: 'Tengeneza Tukio Lako',               desc: 'Ingiza maelezo ya sherehe yako — jina, tarehe, mahali, na picha. Inachukua dakika chache tu.' },
    { icon: EnvelopeIcon,          title: 'Tengeneza Kadi za Mialiko',           desc: 'Chagua muundo wa kadi, ongeza QR Code, na ukadi utakuwa tayari kutumwa kwa wageni wako.' },
    { icon: UsersIcon,             title: 'Ingiza Orodha ya Wageni',             desc: 'Pakia orodha kutoka Excel, CSV, au contacts za simu yako. Tuma kwa wingi kwa kitufe kimoja.' },
    { icon: QrCodeIcon,            title: 'Scan Mlangoni — Bila Tabu',           desc: 'Timu yetu au wewe mwenyewe unaweza kuscan QR za wageni kwa wakati halisi.' },
    { icon: CurrencyDollarIcon,    title: 'Fuatilia Michango Kwa Wakati Halisi', desc: 'Pokea ahadi za michango, rekodi malipo, na uone muhtasari wa fedha wowote.' },
];
const stats = [
    { value: '10,000+', label: 'Wageni Waliohudumiwa' },
    { value: '500+',    label: 'Matukio Yaliyofanikiwa'  },
    { value: '98%',     label: 'Ukaguzi Uliofanikiwa'    },
    { value: '0',       label: 'Kadi za Karatasi'        },
];

onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    const observer = new IntersectionObserver(
        (entries) => entries.forEach(el => { if (el.isIntersecting) el.target.classList.add('is-visible'); }),
        { threshold: 0.08 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});
onUnmounted(() => window.removeEventListener('scroll', handleScroll));
</script>

<template>
    <div class="min-h-screen font-sans overflow-x-hidden relative" style="background:#111114; color:#EEEEF0;">

        <!-- ░░ AMBIENT ORBS ░░ -->
        <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <div class="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full orb-hi"></div>
            <div class="absolute top-[60%] -left-20 w-80 h-80 rounded-full orb-lo"></div>
        </div>

        <!-- ░░ NAV ░░ -->
        <nav class="sticky top-0 z-[100] backdrop-blur-xl border-b" style="background:rgba(17,17,20,0.88); border-color:#2C2C2E;">
            <div class="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center gap-4">
                <div class="flex items-center gap-3 cursor-pointer" @click="$router.push('/')">
                    <div class="size-8 rounded-xl overflow-hidden border" style="border-color:#2C2C2E;">
                        <img src="/src/assets/icon-512.png" alt="Haflaway" class="size-full object-cover" />
                    </div>
                    <span class="text-xl font-black tracking-tighter uppercase amber-text">Haflaway</span>
                </div>
                <div class="hidden md:flex items-center gap-8">
                    <a href="#features" class="nav-link">Huduma</a>
                    <a href="#how"      class="nav-link">Jinsi Inavyofanya</a>
                    <a href="#cta"      class="nav-link">Anza</a>
                    <a @click="$router.push('/pricing')" class="nav-link cursor-pointer" style="color:#C9A84C;">Bei</a>
                </div>
                <a href="https://wa.me/255625689904" target="_blank" class="btn-outline text-[10px] px-5 py-2.5 rounded-full">
                    Wasiliana Nasi
                </a>
            </div>
        </nav>

        <main class="relative z-10">

            <!-- ╔══════════════════════════════════════════════════════════╗ -->
            <!-- ║  HERO                                                    ║ -->
            <!-- ╚══════════════════════════════════════════════════════════╝ -->
            <section class="max-w-4xl mx-auto px-6 pt-20 sm:pt-28 pb-0">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-4 items-start">

                    <!-- ── Left: Copy ── -->
                    <div>
                        <!-- Event type pills -->
                        <div class="flex flex-wrap gap-2 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span class="event-pill">💍 Harusi</span>
                            <span class="event-pill">🎀 Kitchen Party</span>
                            <span class="event-pill">🎉 Sendoff</span>
                            <span class="event-pill">🥂 Maadhimisho</span>
                        </div>

                        <h1 class="font-black tracking-tighter leading-[0.9] mb-5 animate-in fade-in slide-in-from-bottom-6 duration-1000"
                            style="font-size:clamp(2rem,4vw,2.8rem);">
                            <span style="color:#EEEEF0;">Mialiko ya Hadhi.</span><br />
                            <span class="amber-text">Wageni Wapokelewe.</span><br />
                            <span style="color:#3A3A3C;">Sherehe Kamili.</span>
                        </h1>

                        <p class="text-sm sm:text-base font-medium leading-relaxed mb-6 max-w-md animate-in fade-in duration-1000 delay-150"
                            style="color:#8E8E93;">
                            Haflaway inakusaidia kupanga harusi, sendoff, kitchen party na hafla yoyote — kadi za kidigitali zenye QR Code, kusimamia wageni, na kupokea michango kwa simu moja.
                        </p>

                        <div class="flex flex-col sm:flex-row gap-3 mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                            <button class="btn-primary px-7 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest">
                                Anza Kupanga Sherehe
                            </button>
                            <a href="https://wa.me/255625689904" target="_blank"
                                class="btn-outline px-7 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                <ChatBubbleLeftRightIcon class="size-4" />
                                Zungumza Nasi
                            </a>
                        </div>

                        <!-- Social proof -->
                        <div class="flex items-center gap-5 animate-in fade-in duration-1000 delay-300">
                            <div class="flex -space-x-3">
                                <div v-for="(c, i) in ['#C9A84C','#8E6E2C','#E8C87C','#A07830']" :key="i"
                                    class="size-9 rounded-full border-2 flex items-center justify-center text-xs font-black"
                                    :style="`background:${c}22; border-color:#111114; color:${c};`">
                                    {{ ['A','F','Z','J'][i] }}
                                </div>
                            </div>
                            <div>
                                <div class="flex items-center gap-1 mb-0.5">
                                    <span class="text-[11px] amber-text font-black">★★★★★</span>
                                </div>
                                <p class="text-[11px] font-medium" style="color:#8E8E93;">
                                    Wapangaji <span style="color:#EEEEF0; font-weight:800;">500+</span> wanategemea Haflaway
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- ── Right: Phone ── -->
                    <div class="relative flex justify-center lg:justify-end items-end pb-12 lg:pb-0 mt-8 lg:mt-0">

                        <!-- Amber glow behind phone -->
                        <div class="absolute inset-0 phone-glow pointer-events-none"></div>

                        <!-- Phone frame -->
                        <div class="relative z-10 phone-shell" :style="phoneStyle">

                            <!-- Physical buttons -->
                            <div class="hw-vol-up"></div>
                            <div class="hw-vol-dn"></div>
                            <div class="hw-power"></div>

                            <!-- Screen (clips inner scroll) -->
                            <div class="screen-area">

                                <!-- Status bar -->
                                <div class="flex items-center justify-between px-5 pt-3 pb-1" style="background:#111114; flex-shrink:0;">
                                    <span style="font-size:10px; font-weight:700; color:#EEEEF0; letter-spacing:-0.2px;">9:41</span>
                                    <div class="dynamic-island-abs"></div>
                                    <div style="display:flex; align-items:center; gap:4px;">
                                        <!-- Signal bars -->
                                        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                                            <rect x="0"  y="7" width="2.5" height="3"  rx="0.5" fill="#EEEEF0"/>
                                            <rect x="3.5" y="5" width="2.5" height="5" rx="0.5" fill="#EEEEF0"/>
                                            <rect x="7"  y="3" width="2.5" height="7"  rx="0.5" fill="#EEEEF0"/>
                                            <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill="#EEEEF0" opacity="0.35"/>
                                        </svg>
                                        <!-- Battery -->
                                        <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
                                            <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="#EEEEF0" stroke-opacity="0.5"/>
                                            <rect x="2"   y="2"   width="14" height="7" rx="1.5" fill="#C9A84C"/>
                                            <path d="M19.5 3.5 C20.6 3.5 21.5 4.4 21.5 5.5 C21.5 6.6 20.6 7.5 19.5 7.5 V3.5Z" fill="#EEEEF0" opacity="0.4"/>
                                        </svg>
                                    </div>
                                </div>

                                <!-- Dynamic island pill -->
                                <div class="dynamic-island-pill"></div>

                                <!-- App content — scrolls with page -->
                                <div class="app-content-scroll" :style="{ transform: `translateY(${-innerScroll}px)` }">

                                    <!-- ══ Top bar (matches _topBar) ══ -->
                                    <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px 6px;">
                                        <div style="display:flex; align-items:center; gap:5px; padding:5px 10px 5px 8px; background:#1C1C1E; border-radius:16px; border:0.8px solid #2C2C2E;">
                                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                                            <span style="font-size:10px; font-weight:600; color:#EEEEF0; font-family:system-ui;">Back</span>
                                        </div>
                                        <div style="padding:7px; background:#1C1C1E; border-radius:10px; border:0.8px solid #2C2C2E;">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#AEAEB2"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                                        </div>
                                    </div>

                                    <!-- ══ Hero block (matches _heroBlock) ══ -->
                                    <div style="padding:10px 14px 16px;">
                                        <!-- LIVE NOW badge -->
                                        <div style="display:inline-flex; align-items:center; gap:5px; padding:4px 9px; background:#2A2210; border-radius:7px; border:0.8px solid rgba(201,168,76,0.35); margin-bottom:13px;">
                                            <div style="width:5px; height:5px; border-radius:50%; background:#C9A84C;"></div>
                                            <span style="font-size:8px; font-weight:800; color:#C9A84C; letter-spacing:0.12em; text-transform:uppercase; font-family:system-ui;">LIVE NOW</span>
                                        </div>
                                        <!-- Event title -->
                                        <div style="font-size:20px; font-weight:800; color:#EEEEF0; letter-spacing:-0.6px; line-height:1.1; margin-bottom:13px; font-family:system-ui;">
                                            Harusi ya<br/>Amina &amp; Said Juma
                                        </div>
                                        <!-- Meta card -->
                                        <div style="padding:10px 12px; background:#1C1C1E; border-radius:13px; border:0.8px solid #2C2C2E;">
                                            <div style="display:flex; align-items:center; gap:7px;">
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                                <span style="font-size:10px; color:#AEAEB2; font-weight:500; font-family:system-ui;">Ijumaa, Jun 14 · 2:00 PM</span>
                                            </div>
                                            <div style="height:0.6px; background:#2C2C2E; margin:8px 0;"></div>
                                            <div style="display:flex; align-items:center; gap:7px;">
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                                <span style="font-size:10px; color:#AEAEB2; font-weight:500; font-family:system-ui; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Dar es Salaam, Tanzania</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- ══ Contributions card (matches _contributionsCard) ══ -->
                                    <div style="margin:0 14px 10px; padding:16px; background:#1C1C1E; border-radius:18px; border:0.8px solid #2C2C2E; box-shadow:0 6px 24px rgba(201,168,76,0.06);">
                                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
                                            <div style="display:flex; align-items:center; gap:8px;">
                                                <div style="padding:6px; background:rgba(201,168,76,0.12); border-radius:8px;">
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>
                                                </div>
                                                <span style="font-size:9px; font-weight:700; color:#8E8E93; letter-spacing:0.11em; text-transform:uppercase; font-family:system-ui;">CONTRIBUTIONS</span>
                                            </div>
                                            <div style="padding:3px 9px; background:#2A2210; border-radius:7px; border:0.6px solid rgba(201,168,76,0.3);">
                                                <span style="font-size:11px; font-weight:800; color:#C9A84C; font-family:system-ui;">75%</span>
                                            </div>
                                        </div>
                                        <div style="font-size:20px; font-weight:800; color:#EEEEF0; letter-spacing:-1px; line-height:1; margin-bottom:14px; font-family:system-ui;">TZS 2,400,000</div>
                                        <!-- Progress bar -->
                                        <div style="height:5px; background:#3A3A3C; border-radius:4px; margin-bottom:9px; overflow:hidden;">
                                            <div style="height:100%; width:75%; background:linear-gradient(90deg,rgba(201,168,76,0.65),#C9A84C); border-radius:4px;"></div>
                                        </div>
                                        <div style="display:flex; justify-content:space-between; align-items:center;">
                                            <span style="font-size:9px; color:#8E8E93; font-family:system-ui;">Goal: TZS 3,200,000</span>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#48484A" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                                        </div>
                                    </div>

                                    <!-- ══ Mini stat row (matches _miniStatRow) ══ -->
                                    <div style="margin:0 14px 10px; display:grid; grid-template-columns:1fr 1fr; gap:9px;">
                                        <!-- Invitations -->
                                        <div style="padding:14px; background:#1C1C1E; border-radius:18px; border:0.8px solid #2C2C2E;">
                                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:11px;">
                                                <span style="font-size:7.5px; font-weight:700; color:#8E8E93; letter-spacing:0.11em; text-transform:uppercase; font-family:system-ui;">INVITATIONS</span>
                                                <div style="padding:5px; background:rgba(201,168,76,0.12); border-radius:7px;">
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2" stroke-linecap="round"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                                                </div>
                                            </div>
                                            <div style="font-size:28px; font-weight:800; color:#EEEEF0; letter-spacing:-1.5px; line-height:1; font-family:system-ui;">247</div>
                                            <div style="font-size:10px; color:#8E8E93; margin-top:3px; font-family:system-ui;">sent</div>
                                        </div>
                                        <!-- Admins -->
                                        <div style="padding:14px; background:#1C1C1E; border-radius:18px; border:0.8px solid #2C2C2E;">
                                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:11px;">
                                                <span style="font-size:7.5px; font-weight:700; color:#8E8E93; letter-spacing:0.11em; text-transform:uppercase; font-family:system-ui;">ADMINS</span>
                                                <div style="padding:5px; background:rgba(201,168,76,0.12); border-radius:7px;">
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                                </div>
                                            </div>
                                            <div style="font-size:28px; font-weight:800; color:#EEEEF0; letter-spacing:-1.5px; line-height:1; font-family:system-ui;">3</div>
                                            <div style="font-size:10px; color:#8E8E93; margin-top:3px; font-family:system-ui;">active</div>
                                        </div>
                                    </div>

                                    <!-- ══ Checkpoints section (matches _checkpointsSection) ══ -->
                                    <div style="display:flex; align-items:center; justify-content:space-between; padding:18px 14px 9px;">
                                        <div style="display:flex; align-items:center; gap:7px;">
                                            <div style="width:2.5px; height:12px; background:#C9A84C; border-radius:2px;"></div>
                                            <span style="font-size:8.5px; font-weight:700; color:#8E8E93; letter-spacing:0.13em; text-transform:uppercase; font-family:system-ui;">SCAN CHECKPOINTS</span>
                                        </div>
                                        <div style="padding:3px 8px; background:#2A2210; border-radius:7px; border:0.6px solid rgba(201,168,76,0.3);">
                                            <span style="font-size:9px; font-weight:700; color:#C9A84C; font-family:system-ui;">Add new</span>
                                        </div>
                                    </div>
                                    <div style="margin:0 14px; display:flex; flex-direction:column; gap:7px;">
                                        <div v-for="cp in ['Mlango Mkuu','VIP Entrance']" :key="cp"
                                            style="display:flex; align-items:center; gap:11px; padding:12px 13px; background:#1C1C1E; border-radius:14px; border:0.8px solid #2C2C2E;">
                                            <div style="padding:7px; background:rgba(201,168,76,0.11); border-radius:9px; flex-shrink:0;">
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9v11a1 1 0 0 0 1 1h7V9"/><path d="M21 9H3"/><rect x="9" y="14" width="6" height="8"/><path d="M15 4h-6v5h6V4z"/></svg>
                                            </div>
                                            <span style="flex:1; font-size:11.5px; font-weight:500; color:#EEEEF0; font-family:system-ui;">{{ cp }}</span>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#48484A" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                                        </div>
                                    </div>

                                    <!-- ══ Event Tools section (matches _toolsSection) ══ -->
                                    <div style="display:flex; align-items:center; padding:18px 14px 9px; gap:7px;">
                                        <div style="width:2.5px; height:12px; background:#C9A84C; border-radius:2px;"></div>
                                        <span style="font-size:8.5px; font-weight:700; color:#8E8E93; letter-spacing:0.13em; text-transform:uppercase; font-family:system-ui;">EVENT TOOLS</span>
                                    </div>
                                    <div style="margin:0 14px 24px; display:grid; grid-template-columns:1fr 1fr; gap:9px;">
                                        <div v-for="tool in [
                                            {icon:'people', count:'34', title:'Contacts',       sub:'Send messages'},
                                            {icon:'wallet', count:'12', title:'Contributions',  sub:'Track payments'},
                                            {icon:'card',   count:'4',  title:'Card Templates', sub:'Design invitations'},
                                            {icon:'chat',   count:'6',  title:'SMS Templates',  sub:'Broadcast messages'},
                                        ]" :key="tool.title"
                                            style="padding:13px; background:#1C1C1E; border-radius:17px; border:0.8px solid #2C2C2E; position:relative;">
                                            <!-- ACTIVE badge -->
                                            <div style="position:absolute; top:8px; right:8px; padding:2px 5px; background:#2A2210; border-radius:4px; border:0.6px solid rgba(201,168,76,0.4);">
                                                <span style="font-size:6px; font-weight:800; color:#C9A84C; text-transform:uppercase; letter-spacing:0.1em; font-family:system-ui;">ACTIVE</span>
                                            </div>
                                            <!-- Icon -->
                                            <div style="padding:7px; background:rgba(201,168,76,0.13); border-radius:10px; width:fit-content; margin-bottom:20px;">
                                                <!-- People icon -->
                                                <svg v-if="tool.icon==='people'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                                <!-- Wallet icon -->
                                                <svg v-if="tool.icon==='wallet'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>
                                                <!-- Card/Desktop icon -->
                                                <svg v-if="tool.icon==='card'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                                                <!-- Chat icon -->
                                                <svg v-if="tool.icon==='chat'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                            </div>
                                            <!-- Count + title -->
                                            <div style="font-size:25px; font-weight:800; color:#EEEEF0; letter-spacing:-1px; line-height:1; font-family:system-ui;">{{ tool.count }}</div>
                                            <div style="font-size:10.5px; font-weight:600; color:#EEEEF0; margin-top:3px; font-family:system-ui;">{{ tool.title }}</div>
                                            <div style="font-size:9px; color:#8E8E93; font-family:system-ui;">{{ tool.sub }}</div>
                                        </div>
                                    </div>

                                </div><!-- end app-content-scroll -->
                            </div><!-- end screen-area -->

                            <!-- Screen glass shine -->
                            <div class="screen-shine"></div>

                        </div><!-- end phone-shell -->

                        <!-- ── Floating pills ── -->
                        <div class="absolute top-8 -right-2 sm:right-0 lg:-right-4 z-30 pill-drift-a" :style="pill1Style">
                            <div class="flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full border shadow-2xl" style="background:#1C1C1E; border-color:#2C2C2E;">
                                <span class="text-base leading-none">📲</span>
                                <div>
                                    <p style="font-size:9px; font-weight:800; color:#EEEEF0; line-height:1.3;">Imetumwa · 247 wageni</p>
                                    <p style="font-size:8px; color:#8E8E93;">WhatsApp ✓✓</p>
                                </div>
                            </div>
                        </div>

                        <div class="absolute bottom-24 -left-2 sm:left-0 lg:-left-6 z-30 pill-drift-b" :style="pill2Style">
                            <div class="flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full border shadow-2xl" style="background:#1C1C1E; border-color:#2C2C2E;">
                                <span class="size-2 rounded-full flex-shrink-0" style="background:#C9A84C;"></span>
                                <div>
                                    <p style="font-size:9px; font-weight:800; color:#C9A84C; line-height:1.3;">Amina Hassan ameingia</p>
                                    <p style="font-size:8px; color:#8E8E93;">Sasa hivi · Mlango Mkuu</p>
                                </div>
                            </div>
                        </div>

                        <div class="absolute top-1/3 -right-2 sm:right-0 lg:-right-6 z-30 pill-drift-c hidden sm:block" :style="pill3Style">
                            <div class="flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full border shadow-2xl" style="background:#1C1C1E; border-color:#2C2C2E;">
                                <span class="text-base leading-none">💰</span>
                                <div>
                                    <p style="font-size:9px; font-weight:800; font-family:system-ui; line-height:1.3;" class="amber-text">TZS 2.4M</p>
                                    <p style="font-size:8px; color:#8E8E93;">Michango iliyokusanywa</p>
                                </div>
                            </div>
                        </div>

                    </div><!-- end right col -->
                </div>

                <div class="mt-16 h-px w-full" style="background:linear-gradient(90deg,transparent,#2C2C2E 30%,#2C2C2E 70%,transparent);"></div>
            </section>

            <!-- ╔═══════════════╗ -->
            <!-- ║  STATS BAND   ║ -->
            <!-- ╚═══════════════╝ -->
            <section class="py-16 reveal">
                <div class="max-w-4xl mx-auto px-6">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
                        <div v-for="stat in stats" :key="stat.value" class="space-y-2">
                            <span class="text-4xl sm:text-5xl font-black amber-text block italic">{{ stat.value }}</span>
                            <span class="text-[9px] font-black uppercase tracking-[0.3em]" style="color:#48484A;">{{ stat.label }}</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ╔══════════════════╗ -->
            <!-- ║  FEATURES GRID   ║ -->
            <!-- ╚══════════════════╝ -->
            <section id="features" class="max-w-4xl mx-auto px-6 py-16 border-t" style="border-color:#2C2C2E;">
                <div class="flex items-center gap-3 mb-4 reveal">
                    <div class="w-0.5 h-3.5 rounded-full" style="background:#C9A84C;"></div>
                    <span class="text-[11px] font-black uppercase tracking-[0.4em]" style="color:#8E8E93;">Huduma Zetu</span>
                </div>
                <h2 class="text-3xl sm:text-4xl font-black tracking-tighter mb-12 reveal" style="color:#EEEEF0;">
                    Kila Kitu Unachohitaji<br /><span class="amber-text">Mahali Pamoja.</span>
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <div class="md:col-span-2 feature-card p-7 reveal">
                        <div class="icon-badge mb-6"><EnvelopeIcon class="size-6 amber-icon" /></div>
                        <h3 class="feature-title text-2xl">Kadi za Kidigitali</h3>
                        <p class="feature-desc max-w-md mb-8">Tengeneza kadi nzuri za mialiko zenye QR Code. Chagua muundo, weka rangi, na tuma kwa WhatsApp au SMS kwa sekunde moja.</p>
                        <div class="flex flex-wrap gap-2">
                            <span v-for="tag in ['Mialiko','QR Code','Save the Date','Michango']" :key="tag" class="tag">{{ tag }}</span>
                        </div>
                    </div>
                    <div class="feature-card p-7 reveal">
                        <div class="icon-badge mb-5"><QrCodeIcon class="size-6 amber-icon" /></div>
                        <h3 class="feature-title text-xl">Scan Mlangoni</h3>
                        <p class="feature-desc text-sm">Timu yetu au wewe mwenyewe unaweza kuscan QR kwa haraka. Hakuna foleni. Hakuna mkanganyiko.</p>
                    </div>
                    <div class="feature-card p-7 reveal">
                        <div class="icon-badge mb-5"><ChatBubbleLeftRightIcon class="size-6 amber-icon" /></div>
                        <h3 class="feature-title text-xl">WhatsApp & SMS</h3>
                        <p class="feature-desc text-sm">Tuma mialiko, vikumbusho, na shukrani kwa wingi. Barua pepe si lazima.</p>
                    </div>
                    <div class="md:col-span-2 feature-card p-7 reveal">
                        <div class="icon-badge mb-6"><UsersIcon class="size-6 amber-icon" /></div>
                        <h3 class="feature-title text-2xl">Simamia Wageni</h3>
                        <p class="feature-desc max-w-sm mb-7 text-sm">Ingiza orodha kutoka Excel, CSV, au contacts. Fuatilia hali ya kila mgeni.</p>
                        <div class="space-y-2.5">
                            <div v-for="(g, i) in [
                                {name:'Amina Hassan',   status:'Amethibitisha',  dot:'#C9A84C'},
                                {name:'John Makwela',   status:'Ameingia',       dot:'#C9A84C'},
                                {name:'Fatma Omar',     status:'Anasubiri',      dot:'#8E8E93'},
                                {name:'Khalid Juma',    status:'Hajathibitisha', dot:'#48484A'},
                            ]" :key="i" class="flex items-center justify-between px-4 py-3 rounded-2xl border" style="background:#28282C; border-color:#2C2C2E;">
                                <div class="flex items-center gap-3">
                                    <div class="size-8 rounded-full flex items-center justify-center text-[11px] font-black" style="background:#3A3A3C; color:#8E8E93;">{{ g.name[0] }}</div>
                                    <span class="text-sm font-medium" style="color:#AEAEB2;">{{ g.name }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="size-1.5 rounded-full" :style="`background:${g.dot};`"></span>
                                    <span class="text-[10px] font-black uppercase tracking-widest" :style="`color:${g.dot};`">{{ g.status }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="feature-card p-7 reveal">
                        <div class="icon-badge mb-5"><CurrencyDollarIcon class="size-6 amber-icon" /></div>
                        <h3 class="feature-title text-xl">Michango</h3>
                        <p class="feature-desc text-sm mb-5">Rekodi ahadi na malipo kwa wakati halisi bila hitaji la karatasi.</p>
                        <div class="space-y-3">
                            <div class="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span style="color:#48484A;">Jumla ya Ahadi</span>
                                <span class="amber-text">TZS 4.8M</span>
                            </div>
                            <div class="h-1.5 rounded-full overflow-hidden" style="background:#3A3A3C;">
                                <div class="h-full rounded-full" style="width:72%; background:#C9A84C;"></div>
                            </div>
                            <div class="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span style="color:#C9A84C;">72% Imepokelewa</span>
                                <span style="color:#48484A;">28% Inakuja</span>
                            </div>
                        </div>
                    </div>
                    <div class="md:col-span-2 feature-card p-7 reveal flex flex-col">
                        <div class="icon-badge mb-5"><PhotoIcon class="size-6 amber-icon" /></div>
                        <h3 class="feature-title text-xl">Ghaleria ya Picha</h3>
                        <p class="feature-desc text-sm mb-5">Hifadhi picha na video za tukio lako. Pagawane na wageni kwa urahisi.</p>
                        <!-- Photo grid mockup -->
                        <div class="grid grid-cols-4 gap-2 mt-auto">
                            <div v-for="(item, i) in [
                                {bg:'#2A2210', opacity:1},
                                {bg:'#28282C', opacity:1},
                                {bg:'#2A2210', opacity:0.7},
                                {bg:'#28282C', opacity:0.9},
                            ]" :key="i"
                                class="rounded-xl flex items-center justify-center"
                                :style="`background:${item.bg}; aspect-ratio:1.8; opacity:${item.opacity};`">
                                <PhotoIcon class="size-4" style="color:#C9A84C; opacity:0.45;" />
                            </div>
                        </div>
                    </div>
                    <div class="md:col-span-3 feature-card p-8 sm:p-10 reveal">
                        <div class="flex flex-col sm:flex-row sm:items-start gap-8">
                            <div class="flex-1">
                                <div class="icon-badge mb-6"><RocketLaunchIcon class="size-6 amber-icon" /></div>
                                <h3 class="feature-title text-2xl sm:text-3xl">Pata Watoa Huduma Bora</h3>
                                <p class="feature-desc max-w-xl text-sm">Tunakuunganisha na MC, wapambaji, kumbi, wasanii, na watoa huduma waliochaguliwa kwa makini.</p>
                            </div>
                            <div class="flex-shrink-0 grid grid-cols-3 gap-3">
                                <div v-for="svc in [{n:'MC',e:'🎤'},{n:'Mapambo',e:'🌸'},{n:'Kumbi',e:'🏛️'},{n:'Wasanii',e:'🎵'},{n:'Picha',e:'📸'},{n:'Chakula',e:'🍽️'}]" :key="svc.n"
                                    class="flex flex-col items-center gap-2 p-4 rounded-2xl border hover:border-[#C9A84C]/30 transition-colors cursor-pointer group/svc"
                                    style="background:#28282C; border-color:#2C2C2E;">
                                    <span class="text-2xl">{{ svc.e }}</span>
                                    <span class="text-[9px] font-black uppercase tracking-widest transition-colors group-hover/svc:text-[#C9A84C]" style="color:#8E8E93;">{{ svc.n }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ╔═══════════════╗ -->
            <!-- ║  HOW IT WORKS ║ -->
            <!-- ╚═══════════════╝ -->
            <section id="how" class="max-w-4xl mx-auto px-6 py-16 border-t" style="border-color:#2C2C2E;">
                <div class="flex items-center gap-3 mb-4 reveal">
                    <div class="w-0.5 h-3.5 rounded-full" style="background:#C9A84C;"></div>
                    <span class="text-[11px] font-black uppercase tracking-[0.4em]" style="color:#8E8E93;">Mwongozo</span>
                </div>
                <h2 class="text-3xl sm:text-4xl font-black tracking-tighter mb-12 reveal" style="color:#EEEEF0;">
                    Jinsi Inavyofanya<br /><span class="amber-text">Kazi.</span>
                </h2>
                <div class="relative">
                    <div class="absolute left-[27px] top-12 bottom-12 w-px hidden sm:block" style="background:linear-gradient(to bottom,rgba(201,168,76,0.35),transparent);"></div>
                    <div class="space-y-4">
                        <div v-for="(step, i) in steps" :key="i"
                            class="relative flex items-start gap-6 feature-card p-8 reveal group" :style="`transition-delay:${i*80}ms`">
                            <div class="flex-shrink-0 size-[54px] rounded-2xl border flex items-center justify-center text-lg font-black group-hover:scale-110 transition-transform duration-300 z-10"
                                style="background:#2A2210; border-color:rgba(201,168,76,0.3); color:#C9A84C;">{{ i + 1 }}</div>
                            <div class="flex-1 pt-1">
                                <h3 class="text-lg font-black mb-2" style="color:#EEEEF0;">{{ step.title }}</h3>
                                <p class="font-medium leading-relaxed text-sm" style="color:#8E8E93;">{{ step.desc }}</p>
                            </div>
                            <component :is="step.icon" class="size-5 flex-shrink-0 mt-1.5" style="color:#48484A;" />
                        </div>
                    </div>
                </div>
            </section>

            <!-- ╔═══════════════╗ -->
            <!-- ║  FINAL CTA    ║ -->
            <!-- ╚═══════════════╝ -->
            <section id="cta" class="max-w-4xl mx-auto px-6 py-16 reveal">
                <div class="rounded-[48px] border p-14 sm:p-24 relative overflow-hidden text-center" style="background:#1C1C1E; border-color:#2C2C2E;">
                    <div class="absolute inset-0 pointer-events-none cta-glow"></div>
                    <div class="relative z-10">
                        <div class="icon-badge mx-auto mb-10"><SparklesIcon class="size-8 amber-icon" /></div>
                        <h2 class="text-3xl sm:text-5xl font-black tracking-tighter mb-6 leading-tight" style="color:#EEEEF0;">
                            Uko Tayari Kubadilisha<br /><span class="amber-text">Sherehe Yako?</span>
                        </h2>
                        <p class="text-lg font-medium mb-14 max-w-lg mx-auto leading-relaxed" style="color:#8E8E93;">
                            Jiunge na maelfu ya wapangaji sherehe wanaotumia Haflaway kufanya harusi, sendoff, na kitchen party zao ziwe za kipekee.
                        </p>
                        <div class="flex flex-col sm:flex-row gap-5 justify-center">
                            <button class="btn-primary px-12 py-5 rounded-2xl text-sm font-black uppercase tracking-widest">Anza Bure Leo</button>
                            <a href="https://wa.me/255625689904" target="_blank"
                                class="btn-outline px-12 py-5 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3">
                                <ChatBubbleLeftRightIcon class="size-4" />WhatsApp Sasa
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <!-- ░░ FOOTER ░░ -->
        <footer class="max-w-4xl mx-auto px-6 py-14 border-t" style="border-color:#2C2C2E;">
            <div class="flex flex-col md:flex-row justify-between items-center gap-8">
                <div class="flex items-center gap-3 cursor-pointer opacity-50 hover:opacity-80 transition-opacity" @click="$router.push('/')">
                    <div class="size-8 rounded-xl overflow-hidden border" style="border-color:#2C2C2E;"><img src="/src/assets/icon-512.png" alt="Logo" class="size-full object-cover" /></div>
                    <span class="text-sm font-black tracking-tighter uppercase amber-text">Haflaway</span>
                </div>
                <div class="flex items-center gap-8">
                    <a href="#" class="footer-link">Privacy</a>
                    <a href="#" class="footer-link">Terms</a>
                    <a href="https://wa.me/255625689904" target="_blank" class="footer-link">Support</a>
                </div>
                <p class="text-[9px] font-black uppercase tracking-[0.35em]" style="color:#3A3A3C;">© 2026 Haflaway.</p>
            </div>
        </footer>
    </div>
</template>

<style scoped>
/* ── Orbs ── */
.orb-hi { background:rgba(201,168,76,0.11); filter:blur(110px); }
.orb-lo { background:rgba(201,168,76,0.06); filter:blur(90px);  }

/* ── Amber text shimmer ── */
.amber-text {
    background-image: linear-gradient(90deg,#C9A84C,#E8C87C,#C9A84C);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: amber-slide 5s linear infinite;
}
@keyframes amber-slide {
    0%   { background-position:0%   50%; }
    100% { background-position:200% 50%; }
}

/* ── Utilities ── */
.nav-link { font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.2em; color:#8E8E93; transition:color .2s; }
.nav-link:hover { color:#EEEEF0; }

.btn-primary { background:#C9A84C; color:#000; transition:transform .15s, box-shadow .15s; box-shadow:0 8px 32px rgba(201,168,76,0.2); }
.btn-primary:hover  { box-shadow:0 12px 40px rgba(201,168,76,0.35); }
.btn-primary:active { transform:scale(.97); }

.btn-outline { border:1px solid rgba(201,168,76,0.3); color:#C9A84C; transition:background .2s, transform .15s; }
.btn-outline:hover  { background:rgba(42,34,16,0.8); }
.btn-outline:active { transform:scale(.97); }

.event-pill { padding:.4rem .9rem; border-radius:100px; border:1px solid rgba(201,168,76,0.2); background:rgba(42,34,16,0.6); color:#C9A84C; font-size:11px; font-weight:800; }

.feature-card  { background:#1C1C1E; border:1px solid #2C2C2E; border-radius:32px; transition:border-color .3s; }
.feature-card:hover { border-color:rgba(201,168,76,0.2); }

.feature-title { font-weight:900; color:#EEEEF0; letter-spacing:-.03em; margin-bottom:.75rem; }
.feature-desc  { color:#8E8E93; line-height:1.65; font-weight:500; }

.icon-badge { width:3.5rem; height:3.5rem; background:#2A2210; border:1px solid rgba(201,168,76,0.2); border-radius:1rem; display:flex; align-items:center; justify-content:center; transition:transform .3s; }
.feature-card:hover .icon-badge { transform:scale(1.08); }
.amber-icon { color:#C9A84C; }

.tag { padding:.35rem .75rem; border-radius:100px; background:#2A2210; border:1px solid rgba(201,168,76,0.18); color:#C9A84C; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:.1em; }

.footer-link { font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:.15em; color:#48484A; transition:color .2s; }
.footer-link:hover { color:#AEAEB2; }

.cta-glow { background:radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 65%); }

/* ── Phone shell ── */
.phone-shell {
    width: 224px;
    height: 462px;
    background: #0A0A0C;
    border-radius: 43px;
    border: 1.5px solid #3A3A3C;
    position: relative;
    box-shadow:
        0 60px 120px -30px rgba(0,0,0,0.95),
        0 0 0 1px rgba(255,255,255,0.05) inset,
        0 1px 0 rgba(255,255,255,0.08) inset;
    flex-shrink: 0;
    overflow: visible;
}

/* Hardware side buttons */
.hw-vol-up, .hw-vol-dn, .hw-power { position:absolute; background:#2C2C2E; border-radius:2px 0 0 2px; z-index:5; }
.hw-vol-up { left:-4px; top:99px; width:4px; height:23px; }
.hw-vol-dn { left:-4px; top:130px; width:4px; height:23px; }
.hw-power  { right:-4px; top:115px; width:4px; height:36px; border-radius:0 2px 2px 0; }

/* Screen area — clips scrolling content */
.screen-area {
    position: absolute;
    inset: 3px;
    border-radius: 40px;
    background: #111114;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* Dynamic island — absolute on top of status bar */
.dynamic-island-abs {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 65px;
    height: 22px;
    background: #0A0A0C;
    border-radius: 100px;
    z-index: 10;
}

/* Separate pill element in the layout flow */
.dynamic-island-pill {
    width: 65px;
    height: 22px;
    background: #0A0A0C;
    border-radius: 100px;
    margin: -16px auto 4px;
    flex-shrink: 0;
    position: relative;
    z-index: 10;
}

/* Scrollable app content */
.app-content-scroll {
    flex: 1;
    overflow: hidden;
    transition: transform 0.05s linear;
    will-change: transform;
}

/* Glass shine overlay */
.screen-shine {
    position: absolute;
    inset: 4px;
    border-radius: 48px;
    background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 45%);
    pointer-events: none;
    z-index: 20;
}

/* Amber glow behind phone */
.phone-glow {
    background: radial-gradient(ellipse at center, rgba(201,168,76,0.12) 0%, transparent 65%);
    filter: blur(20px);
    z-index: 0;
}

/* ── Floating pill animations ── */
.pill-drift-a { animation: pill-a 5s ease-in-out infinite; }
.pill-drift-b { animation: pill-b 6s ease-in-out infinite; }
.pill-drift-c { animation: pill-c 7s ease-in-out infinite; }

@keyframes pill-a { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
@keyframes pill-b { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
@keyframes pill-c { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

/* ── Scroll reveal ── */
.reveal { opacity:0; transform:translateY(28px); transition:opacity .65s cubic-bezier(.16,1,.3,1),transform .65s cubic-bezier(.16,1,.3,1); }
.reveal.is-visible { opacity:1; transform:translateY(0); }
</style>
