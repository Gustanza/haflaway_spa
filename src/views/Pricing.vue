<script setup>
import { onMounted } from 'vue';
import { CheckIcon, ChatBubbleLeftRightIcon, SparklesIcon, StarIcon } from '@heroicons/vue/24/outline';
import { useRouter } from 'vue-router';

const router = useRouter();

const plans = [
    {
        name: 'Basic',
        swahili: 'Msingi',
        price: '1,000',
        badge: null,
        highlight: false,
        tagline: 'Bora kwa matukio madogo',
        features: [
            { text: 'Tunatuma kadi kupitia WhatsApp & SMS', note: null },
            { text: 'Tunatuma reminder kwa waalikwa wote', note: null },
            { text: 'Tunafika kwa zoezi la kuscan mlangoni', note: '+TZS 25,000 kwa kila mtu wa scan' },
            { text: 'Tunatuma jumbe za shukrani baada ya tukio', note: null },
        ],
        cta: 'Chagua Basic',
        dim: false,
    },
    {
        name: 'Premium',
        swahili: 'Maalum',
        price: '1,500',
        badge: 'Inayopendwa',
        highlight: true,
        tagline: 'Kwa sherehe za hadhi',
        features: [
            { text: 'Vyote vilivyopo kwenye Basic Package', note: null, inherited: true },
            { text: 'Tunaresend kadi zote ikiwa mtu alifuta', note: null },
            { text: 'Report kamili — mialiko + waliohidhuria', note: null },
            { text: 'Tunatuma Google Map ya Ukumbi kwa wageni', note: null },
        ],
        cta: 'Chagua Premium',
        dim: false,
    },
    {
        name: 'Pro',
        swahili: 'Kamili',
        price: '2,000',
        badge: 'Kikamilifu',
        highlight: false,
        tagline: 'Uzoefu wa kipekee kabisa',
        features: [
            { text: 'Vyote vilivyopo kwenye Premium Package', note: null, inherited: true },
            { text: 'Special event page na Gallery ya pre-wedding', note: null },
            { text: 'Comment section + Ratiba + Biography ya Maharusi', note: null },
            { text: 'Kadi yenye multiple pages — Ratiba, Picha & zaidi', note: null },
        ],
        cta: 'Chagua Pro',
        dim: false,
    },
];

onMounted(() => {
    const observer = new IntersectionObserver(
        (entries) => entries.forEach(el => { if (el.isIntersecting) el.target.classList.add('is-visible'); }),
        { threshold: 0.08 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});
</script>

<template>
    <div class="min-h-screen font-sans overflow-x-hidden relative" style="background:#111114; color:#EEEEF0;">

        <!-- ░░ ORBS ░░ -->
        <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <div class="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full" style="background:rgba(201,168,76,0.09); filter:blur(120px);"></div>
            <div class="absolute bottom-0 -left-20 w-96 h-96 rounded-full" style="background:rgba(201,168,76,0.05); filter:blur(100px);"></div>
        </div>

        <!-- ░░ NAV ░░ -->
        <nav class="sticky top-0 z-[100] backdrop-blur-xl border-b" style="background:rgba(17,17,20,0.88); border-color:#2C2C2E;">
            <div class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center gap-4">
                <div class="flex items-center gap-3 cursor-pointer" @click="router.push('/')">
                    <div class="size-8 rounded-xl overflow-hidden border" style="border-color:#2C2C2E;">
                        <img src="/src/assets/icon-512.png" alt="Haflaway" class="size-full object-cover" />
                    </div>
                    <span class="text-xl font-black tracking-tighter uppercase amber-text">Haflaway</span>
                </div>
                <div class="hidden md:flex items-center gap-8">
                    <a @click="router.push('/')"      class="nav-link cursor-pointer">Nyumbani</a>
                    <a @click="router.push('/#features')" class="nav-link cursor-pointer">Huduma</a>
                    <span class="nav-link-active">Bei</span>
                </div>
                <a href="https://wa.me/255625689904" target="_blank" class="btn-outline text-[10px] px-5 py-2.5 rounded-full">
                    Wasiliana Nasi
                </a>
            </div>
        </nav>

        <main class="relative z-10">

            <!-- ╔══════════════╗ -->
            <!-- ║  HERO        ║ -->
            <!-- ╚══════════════╝ -->
            <section class="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
                <!-- Section label -->
                <div class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700"
                    style="background:#2A2210; border-color:rgba(201,168,76,0.35);">
                    <SparklesIcon class="size-3.5" style="color:#C9A84C;" />
                    <span class="text-[10px] font-black uppercase tracking-[0.35em]" style="color:#C9A84C;">Mchanganuo wa Bei</span>
                </div>

                <h1 class="font-black tracking-tighter leading-[0.9] mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000"
                    style="font-size:clamp(2.4rem,6vw,4.5rem); color:#EEEEF0;">
                    Bei Zetu Wazi.<br />
                    <span class="amber-text">Bila Mshangao.</span>
                </h1>

                <!-- The greeting from user -->
                <div class="max-w-2xl mx-auto animate-in fade-in duration-1000 delay-150">
                    <p class="text-base sm:text-lg font-medium leading-relaxed" style="color:#8E8E93;">
                        Karibu Haflaway — huu ndiyo mchanganuo wa bei zetu. Bei ni kwa kila kadi moja iliyotengenezwa na kutumwa.
                    </p>
                </div>
            </section>

            <!-- ╔════════════════════╗ -->
            <!-- ║  PRICING CARDS     ║ -->
            <!-- ╚════════════════════╝ -->
            <section class="max-w-6xl mx-auto px-6 pb-24">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">

                    <div v-for="(plan, i) in plans" :key="plan.name"
                        class="reveal flex flex-col rounded-[32px] border relative overflow-hidden"
                        :class="plan.highlight ? 'plan-highlight' : 'plan-base'"
                        :style="`transition-delay:${i * 100}ms`">

                        <!-- Highlight top glow bar -->
                        <div v-if="plan.highlight" class="h-1 w-full" style="background:linear-gradient(90deg,#C9A84C,#E8C87C,#C9A84C);"></div>

                        <!-- Badge -->
                        <div v-if="plan.badge" class="absolute top-5 right-5">
                            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest"
                                :style="plan.highlight
                                    ? 'background:#2A2210; border-color:rgba(201,168,76,0.4); color:#C9A84C;'
                                    : 'background:#28282C; border-color:#3A3A3C; color:#8E8E93;'">
                                <StarIcon class="size-2.5" />
                                {{ plan.badge }}
                            </div>
                        </div>

                        <!-- Card body -->
                        <div class="flex flex-col flex-1 p-8 sm:p-10">

                            <!-- Plan name -->
                            <div class="mb-6">
                                <p class="text-[10px] font-black uppercase tracking-[0.3em] mb-2" style="color:#8E8E93;">{{ plan.swahili }}</p>
                                <h2 class="text-2xl font-black tracking-tight" :style="plan.highlight ? 'color:#EEEEF0;' : 'color:#EEEEF0;'">
                                    {{ plan.name }} Package
                                </h2>
                                <p class="text-sm mt-1" style="color:#8E8E93;">{{ plan.tagline }}</p>
                            </div>

                            <!-- Price -->
                            <div class="mb-8 pb-8 border-b" style="border-color:#2C2C2E;">
                                <div class="flex items-end gap-1.5">
                                    <span class="text-[11px] font-black mt-1" style="color:#8E8E93;">TZS</span>
                                    <span class="font-black tracking-tighter leading-none amber-text" style="font-size:3rem;">{{ plan.price }}</span>
                                    <span class="text-sm font-black mb-1" style="color:#8E8E93;">/ Kadi</span>
                                </div>
                            </div>

                            <!-- Features -->
                            <ul class="space-y-4 flex-1">
                                <li v-for="feat in plan.features" :key="feat.text" class="flex items-start gap-3">
                                    <!-- Checkmark -->
                                    <div class="size-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border"
                                        :style="feat.inherited
                                            ? 'background:#28282C; border-color:#3A3A3C;'
                                            : 'background:#2A2210; border-color:rgba(201,168,76,0.3);'">
                                        <CheckIcon class="size-3"
                                            :style="feat.inherited ? 'color:#8E8E93;' : 'color:#C9A84C;'" />
                                    </div>
                                    <div>
                                        <p class="text-sm font-medium leading-snug"
                                            :style="feat.inherited ? 'color:#8E8E93;' : 'color:#AEAEB2;'">
                                            {{ feat.text }}
                                        </p>
                                        <!-- Additional cost note -->
                                        <p v-if="feat.note" class="text-[10px] font-black mt-1 px-2 py-0.5 rounded-md inline-block"
                                            style="background:#28282C; color:#C9A84C; border:0.5px solid rgba(201,168,76,0.2);">
                                            {{ feat.note }}
                                        </p>
                                    </div>
                                </li>
                            </ul>

                            <!-- CTA -->
                            <a href="https://wa.me/255625689904" target="_blank"
                                class="mt-10 block text-center py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-[0.97]"
                                :class="plan.highlight ? 'cta-primary' : 'cta-secondary'">
                                {{ plan.cta }}
                            </a>
                        </div>

                    </div>
                </div>

                <!-- ── Additional notes ── -->
                <div class="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 reveal">

                    <!-- Scanner note -->
                    <div class="rounded-[24px] border p-7 flex items-start gap-5" style="background:#1C1C1E; border-color:#2C2C2E;">
                        <div class="size-10 rounded-xl flex items-center justify-center flex-shrink-0 border" style="background:#2A2210; border-color:rgba(201,168,76,0.2);">
                            <span class="text-lg">📋</span>
                        </div>
                        <div>
                            <p class="text-sm font-black mb-1" style="color:#EEEEF0;">Mtu wa Kuscan</p>
                            <p class="text-xs leading-relaxed" style="color:#8E8E93;">
                                Kwa kila mtu wa kuscan anayefika tukiini, kamati italipa <span style="color:#C9A84C; font-weight:800;">TZS 25,000/=</span> kwa siku. Bei hii haijaingizwa katika pakiti.
                            </p>
                        </div>
                    </div>

                    <!-- Custom deal note -->
                    <div class="rounded-[24px] border p-7 flex items-start gap-5" style="background:#1C1C1E; border-color:#2C2C2E;">
                        <div class="size-10 rounded-xl flex items-center justify-center flex-shrink-0 border" style="background:#2A2210; border-color:rgba(201,168,76,0.2);">
                            <span class="text-lg">🤝</span>
                        </div>
                        <div>
                            <p class="text-sm font-black mb-1" style="color:#EEEEF0;">Matukio Makubwa?</p>
                            <p class="text-xs leading-relaxed" style="color:#8E8E93;">
                                Kwa matukio yenye wageni wengi au mahitaji maalum, wasiliana nasi moja kwa moja kupata bei ya mazungumzo.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ╔═══════════════╗ -->
            <!-- ║  BOTTOM CTA   ║ -->
            <!-- ╚═══════════════╝ -->
            <section class="max-w-4xl mx-auto px-6 pb-28 reveal">
                <div class="rounded-[48px] border p-12 sm:p-20 relative overflow-hidden text-center" style="background:#1C1C1E; border-color:#2C2C2E;">
                    <div class="absolute inset-0 pointer-events-none" style="background:radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 65%);"></div>
                    <div class="relative z-10">
                        <div class="size-14 rounded-2xl border flex items-center justify-center mx-auto mb-8" style="background:#2A2210; border-color:rgba(201,168,76,0.2);">
                            <ChatBubbleLeftRightIcon class="size-7" style="color:#C9A84C;" />
                        </div>
                        <h2 class="text-2xl sm:text-4xl font-black tracking-tighter mb-4" style="color:#EEEEF0;">
                            Una Maswali?<br />
                            <span class="amber-text">Tuzungumze.</span>
                        </h2>
                        <p class="text-base font-medium mb-10 max-w-md mx-auto leading-relaxed" style="color:#8E8E93;">
                            Tutakusaidia kuchagua pakiti inayofaa sherehe yako na kujibu maswali yoyote unayoyakuwa nayo.
                        </p>
                        <a href="https://wa.me/255625689904" target="_blank"
                            class="inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest active:scale-[0.97] transition-transform"
                            style="background:#C9A84C; color:#000; box-shadow:0 8px 32px rgba(201,168,76,0.25);">
                            <ChatBubbleLeftRightIcon class="size-4" />
                            Ongea Nasi WhatsApp
                        </a>
                    </div>
                </div>
            </section>

        </main>

        <!-- ░░ FOOTER ░░ -->
        <footer class="max-w-6xl mx-auto px-6 py-14 border-t" style="border-color:#2C2C2E;">
            <div class="flex flex-col md:flex-row justify-between items-center gap-8">
                <div class="flex items-center gap-3 cursor-pointer opacity-50 hover:opacity-80 transition-opacity" @click="router.push('/')">
                    <div class="size-8 rounded-xl overflow-hidden border" style="border-color:#2C2C2E;">
                        <img src="/src/assets/icon-512.png" alt="Logo" class="size-full object-cover" />
                    </div>
                    <span class="text-sm font-black tracking-tighter uppercase amber-text">Haflaway</span>
                </div>
                <div class="flex items-center gap-8">
                    <a href="#" class="text-[9px] font-black uppercase tracking-widest transition-colors hover:opacity-60" style="color:#48484A;">Privacy</a>
                    <a href="#" class="text-[9px] font-black uppercase tracking-widest transition-colors hover:opacity-60" style="color:#48484A;">Terms</a>
                    <a href="https://wa.me/255625689904" target="_blank" class="text-[9px] font-black uppercase tracking-widest transition-colors hover:opacity-60" style="color:#48484A;">Support</a>
                </div>
                <p class="text-[9px] font-black uppercase tracking-[0.35em]" style="color:#3A3A3C;">© 2026 Haflaway.</p>
            </div>
        </footer>
    </div>
</template>

<style scoped>
.amber-text {
    background-image: linear-gradient(90deg, #C9A84C, #E8C87C, #C9A84C);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: amber-slide 5s linear infinite;
}
@keyframes amber-slide {
    0%   { background-position: 0%   50%; }
    100% { background-position: 200% 50%; }
}

.nav-link { font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.2em; color:#8E8E93; transition:color .2s; }
.nav-link:hover { color:#EEEEF0; }
.nav-link-active { font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.2em; color:#C9A84C; }

.btn-outline { border:1px solid rgba(201,168,76,0.3); color:#C9A84C; transition:background .2s; }
.btn-outline:hover { background:rgba(42,34,16,0.8); }

/* Pricing cards */
.plan-base {
    background: #1C1C1E;
    border-color: #2C2C2E;
}
.plan-highlight {
    background: #1C1C1E;
    border-color: rgba(201,168,76,0.35);
    box-shadow: 0 0 0 1px rgba(201,168,76,0.1), 0 32px 64px -16px rgba(0,0,0,0.6), 0 0 80px rgba(201,168,76,0.06);
}

/* CTA buttons on cards */
.cta-primary {
    background: #C9A84C;
    color: #000;
    box-shadow: 0 8px 24px rgba(201,168,76,0.25);
}
.cta-primary:hover { box-shadow: 0 12px 32px rgba(201,168,76,0.4); }

.cta-secondary {
    border: 1px solid rgba(201,168,76,0.25);
    color: #C9A84C;
}
.cta-secondary:hover { background: rgba(42,34,16,0.8); }

/* Scroll reveal */
.reveal { opacity:0; transform:translateY(28px); transition:opacity .65s cubic-bezier(.16,1,.3,1), transform .65s cubic-bezier(.16,1,.3,1); }
.reveal.is-visible { opacity:1; transform:translateY(0); }
</style>
