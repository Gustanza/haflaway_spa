<script setup>
import {
    SparklesIcon,
    EnvelopeIcon,
    UsersIcon,
    ClipboardDocumentCheckIcon,
    ArrowRightIcon,
    GlobeAltIcon,
    FingerPrintIcon,
    CheckBadgeIcon,
    RocketLaunchIcon
} from '@heroicons/vue/24/outline';
</script>

<template>
    <div
        class="min-h-screen text-slate-100 font-sans selection:bg-white/20 selection:text-white overflow-x-hidden relative bg-black">

        <!-- Persistent Background Mesh Glows -->
        <div class="fixed inset-0 overflow-hidden pointer-events-none">
            <div
                class="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[140px] animate-radial-glow">
            </div>
            <div class="absolute top-[30%] -right-[15%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[140px] animate-radial-glow"
                style="animation-delay: -5s;"></div>
            <div class="absolute -bottom-[20%] left-[10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[140px] animate-radial-glow"
                style="animation-delay: -10s;"></div>
        </div>

        <!-- Navigation -->
        <nav class="sticky top-0 z-[100] backdrop-blur-xl bg-black/40 border-b border-white/5">
            <div class="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center relative gap-4">
                <div class="flex items-center group cursor-pointer" @click="$router.push('/')">
                    <span
                        class="text-2xl sm:text-3xl font-black tracking-tighter uppercase group-hover:text-white transition-colors google-glow-text">Haflaway</span>
                </div>

                <div class="flex items-center space-x-8">
                    <a href="https://wa.me/255625689904" target="_blank"
                        class="cyber-border text-[10px] font-black uppercase tracking-[0.3em] text-white hover:text-white transition-all px-6 py-2.5 rounded-full overflow-hidden">
                        Wasiliana Nasi
                    </a>
                </div>
            </div>
        </nav>

        <main class="relative z-10">
            <!-- Hero Section -->
            <section class="max-w-6xl mx-auto px-6 py-24 sm:py-32 text-center">
                <div
                    class="inline-flex items-center space-x-2 px-4 py-2 rounded-full apple-glass border-white/10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <SparklesIcon class="size-4 text-indigo-400" />
                    <span class="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">Sherehe za
                        Kidigitali</span>
                </div>

                <h1
                    class="text-5xl sm:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    Boresha Sherehe <br />
                    <span class="google-glow-text">Kwa Kidigitali.</span>
                </h1>

                <p
                    class="text-lg sm:text-2xl text-white/40 max-w-2xl mx-auto mb-12 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
                    Tengeneza kadi za mialiko, pata watoa huduma bora kama MC na wapambaji, na simamia wageni wako kwa
                    urahisi zaidi.
                </p>

                <div
                    class="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                    <button
                        class="cyber-border-light w-full sm:w-auto px-10 py-5 bg-white text-black font-black text-sm uppercase tracking-widest rounded-2xl transition-transform active:scale-95 shadow-2xl hover:shadow-white/10 overflow-hidden">
                        Anza Sasa Bure
                    </button>
                    <button
                        class="cyber-border w-full sm:w-auto px-10 py-5 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-colors hover:bg-white/5 active:scale-95 overflow-hidden">
                        Angalia Zaidi
                    </button>
                </div>
            </section>

            <!-- Features Grid -->
            <section class="max-w-6xl mx-auto px-6 py-24 border-t border-white/5">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <!-- Feature 1 -->
                    <div
                        class="cyber-border apple-glass p-10 rounded-[40px] border border-white/10 hover:border-white/20 transition-all group overflow-hidden">
                        <div
                            class="size-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 border border-indigo-500/20 shadow-xl group-hover:scale-110 transition-transform">
                            <EnvelopeIcon class="size-8 text-indigo-300" />
                        </div>
                        <h3 class="text-2xl font-black text-white mb-4 tracking-tight">Kadi za Kidigitali</h3>
                        <p class="text-white/40 leading-relaxed font-medium">Tengeneza kadi nzuri na zitume kwa WhatsApp
                            au SMS. Kadi zina QR Code kwa ajili ya usalama wa mwaliko.</p>
                    </div>

                    <!-- Feature 2 -->
                    <div
                        class="cyber-border apple-glass p-10 rounded-[40px] border border-white/10 hover:border-white/20 transition-all group overflow-hidden">
                        <div
                            class="size-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-8 border border-purple-500/20 shadow-xl group-hover:scale-110 transition-transform">
                            <UsersIcon class="size-8 text-purple-300" />
                        </div>
                        <h3 class="text-2xl font-black text-white mb-4 tracking-tight">Pata Watoa Huduma</h3>
                        <p class="text-white/40 leading-relaxed font-medium">Tunakuunganisha na MC, wapambaji, na kumbi
                            bora ili kufanya sherehe yako iwe ya kipekee.</p>
                    </div>

                    <!-- Feature 3 -->
                    <div
                        class="cyber-border apple-glass p-10 rounded-[40px] border border-white/10 hover:border-white/20 transition-all group overflow-hidden">
                        <div
                            class="size-16 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-8 border border-pink-500/20 shadow-xl group-hover:scale-110 transition-transform">
                            <ClipboardDocumentCheckIcon class="size-8 text-pink-300" />
                        </div>
                        <h3 class="text-2xl font-black text-white mb-4 tracking-tight">Timu ya Kuscan Kadi</h3>
                        <p class="text-white/40 leading-relaxed font-medium">Usipate tabu mlangoni. Tunatoa timu ya
                            kuscan kadi za QR kusaidia wageni wako kuingia kwa haraka.</p>
                    </div>
                </div>
            </section>

            <!-- Value Proposition / Mission -->
            <section class="max-w-4xl mx-auto px-6 py-32 text-center">
                <div
                    class="cyber-border apple-glass-heavy p-12 sm:p-20 rounded-[60px] border border-white/10 relative overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-pink-500/5">
                    </div>

                    <h2 class="text-3xl sm:text-5xl font-black text-white mb-10 tracking-tight relative z-10">
                        Tunarahisisha Sherehe Yako <br class="hidden sm:block" />
                        <span class="google-glow-text">Kwa Teknolojia.</span>
                    </h2>

                    <p class="text-lg text-white/50 leading-relaxed mb-12 max-w-2xl mx-auto font-medium relative z-10">
                        Haflaway inakusaidia kuepuka kadi za karatasi na usumbufu wa mlangoni. Kila kitu sasa kipo
                        kiganjani kwako kwa usalama zaidi.
                    </p>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-8 relative z-10">
                        <div class="space-y-2">
                            <span class="google-glow-text text-3xl font-black block italic">100%</span>
                            <span
                                class="text-[9px] font-black uppercase tracking-widest text-white/30">Kidigitali</span>
                        </div>
                        <div class="space-y-2">
                            <span class="google-glow-text text-3xl font-black block italic">0</span>
                            <span class="text-[9px] font-black uppercase tracking-widest text-white/30">Bila
                                Karatasi</span>
                        </div>
                        <div class="space-y-2">
                            <span class="google-glow-text text-3xl font-black block italic">Live</span>
                            <span class="text-[9px] font-black uppercase tracking-widest text-white/30">Sync</span>
                        </div>
                        <div class="space-y-2">
                            <span class="google-glow-text text-3xl font-black block italic">Usalama</span>
                            <span class="text-[9px] font-black uppercase tracking-widest text-white/30">Uhakika</span>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <footer class="max-w-6xl mx-auto px-6 py-20 border-t border-white/5 text-center">
            <div class="flex items-center justify-center space-x-2 mb-8 opacity-40">
                <div class="size-7 bg-white rounded-lg overflow-hidden shadow-lg">
                    <img src="/src/assets/icon-512.png" alt="Logo" class="size-full object-cover">
                </div>
                <span class="text-sm font-black tracking-tighter uppercase italic google-glow-text">Haflaway</span>
            </div>
            <p class="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-4">
                © 2026 Haflaway. Kwa ajili ya sherehe bora.
            </p>
            <div class="flex justify-center space-x-6">
                <a href="#"
                    class="text-[9px] font-bold text-white/30 hover:text-white transition-all uppercase tracking-widest">Privacy</a>
                <a href="#"
                    class="text-[9px] font-bold text-white/30 hover:text-white transition-all uppercase tracking-widest">Terms</a>
                <a href="#"
                    class="text-[9px] font-bold text-white/30 hover:text-white transition-all uppercase tracking-widest">Support</a>
            </div>
        </footer>
    </div>
</template>

<style scoped>
/* Utility for smooth radial glows if not already in global style.css */
@keyframes radial-glow {

    0%,
    100% {
        transform: translate(0, 0) scale(1);
        opacity: 0.3;
    }

    33% {
        transform: translate(10%, -5%) scale(1.1);
        opacity: 0.5;
    }

    66% {
        transform: translate(-5%, 10%) scale(0.9);
        opacity: 0.4;
    }
}

.animate-radial-glow {
    animation: radial-glow 20s infinite ease-in-out;
}

@keyframes gradient-text {
    0% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }

    100% {
        background-position: 0% 50%;
    }
}

.animate-gradient-text {
    background-size: 200% auto;
    animation: gradient-text 8s linear infinite;
}
</style>