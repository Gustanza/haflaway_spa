<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import {
    PlusIcon,
    PencilSquareIcon,
    BanknotesIcon,
    UsersIcon,
    CheckCircleIcon,
    ArrowUpRightIcon,
    TrophyIcon,
    SparklesIcon,
    UserCircleIcon,
    XMarkIcon,
    WalletIcon,
    RocketLaunchIcon,
    InformationCircleIcon,
    PhoneIcon
} from '@heroicons/vue/24/outline';
import { db } from '@/firebase';
import {
    collection,
    query,
    onSnapshot,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp,
    increment
} from 'firebase/firestore';

// Muktadha na Haliw
const route = useRoute();
const currentUserId = computed(() => route.params.userId || '1003');
const eventId = computed(() => route.params.eventId || 'FT1NPqCC9VQRCGyYHpxX');

const contributions = ref([]);
const eventData = ref({
    title: 'Inapakia...',
    description: '',
    supportPhone: ''
});
const loading = ref(true);

// HALI YA AWALI: Kusawazisha na Firestore
let unsubscribeAttendees = null;
let unsubscribeEvent = null;

const startSync = () => {
    if (unsubscribeAttendees) unsubscribeAttendees();
    if (unsubscribeEvent) unsubscribeEvent();
    if (!eventId.value) return;

    // 1. Sawazisha Maelezo ya Event
    const eventDocRef = doc(db, 'events', eventId.value);
    unsubscribeEvent = onSnapshot(eventDocRef, (doc) => {
        if (doc.exists()) {
            eventData.value = doc.data();
        }
    });

    // 2. Sawazisha Wachangiaji
    const attendeesColRef = collection(db, 'events', eventId.value, 'attendees');
    unsubscribeAttendees = onSnapshot(attendeesColRef, (snapshot) => {
        contributions.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        contributions.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        loading.value = false;
    }, (error) => {
        console.error("Firestore sync error:", error);
        loading.value = false;
    });
};

onMounted(() => {
    addManualPayment()
    startSync();
});

// Tazama mabadiliko ya vigezo vya route
watch([eventId, currentUserId], () => {
    loading.value = true;
    startSync();
});

onUnmounted(() => {
    if (unsubscribeAttendees) unsubscribeAttendees();
    if (unsubscribeEvent) unsubscribeEvent();
});

// Hali ya Rekodi ya Binafsi
const myRecord = computed(() => {
    const userIdStr = String(currentUserId.value).trim();
    return contributions.value.find(c => String(c.id).trim() === userIdStr) || {
        fullName: `Mshiriki #${userIdStr}`,
        pledgedAmount: 0,
        paidAmount: 0
    };
});

// Hali ya Tabu
const activeTab = ref('yangu'); // 'yangu' au 'jamii'

// Hali ya Maelezo (Read More)
const isExpanded = ref(false);

// Hali ya Madirisha (Modals)
const showPledgeModal = ref(false);
const showPaymentModal = ref(false);
const showIframeModal = ref(false);

const paymentUrl = ref('');
const pledgeInput = ref(0);
const paymentInput = ref(0);
const isProcessing = ref(false);
const paymentError = ref('');

// Vitendo
const setTab = (tab) => {
    activeTab.value = tab;
};

const openPledgeModal = () => {
    pledgeInput.value = myRecord.value.pledgedAmount || 0;
    showPledgeModal.value = true;
};

const openPaymentModal = () => {
    paymentInput.value = 0;
    showPaymentModal.value = true;
};

const updateStatus = (pledged, paid) => {
    if (pledged === 0) return 'Ameweka Ahadi';
    if (paid >= pledged) return 'Amekamilisha';
    if (paid > 0) return 'Amelipa Kiasi';
    return 'Ameweka Ahadi';
};

const savePledge = async () => {
    const attendeeDocRef = doc(db, 'events', eventId.value, 'attendees', currentUserId.value);
    try {
        // Hakikisha thamani ni double (Float)
        const amount = parseFloat(pledgeInput.value) || 0;
        await updateDoc(attendeeDocRef, {
            pledgedAmount: amount
        });
        showPledgeModal.value = false;
    } catch (error) {
        console.error("Error updating pledge:", error);
    }
};

const addManualPayment = async () => {
    const OrderTrackingId = route.query.OrderTrackingId;
    const OrderMerchantReference = route.query.OrderMerchantReference;
    if (!OrderTrackingId || !OrderMerchantReference) return;

    const payload = {
        OrderTrackingId,
        OrderMerchantReference,
    }
    var response = await axios.get("https://resolvemchango-frbu33fema-uc.a.run.app",
        {
            params: payload,
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            }
        });
    var data = response.data;
    if (data.error) return console.log("Shida", data.error);
    console.log(data);

}

const absoluteUrl = computed(() => {
    return window.location.origin + route.fullPath
})

const addPayment = async () => {
    isProcessing.value = true;
    paymentError.value = '';
    try {
        const amount = parseFloat(paymentInput.value) || 0.00;
        const eveId = eventId.value;
        const payload = {
            amount: amount,
            eventId: eveId,
            userId: currentUserId.value,
            attendee: myRecord.value,
            callback_url: absoluteUrl.value,
        }
        const response = await axios.post("https://lipamchango-frbu33fema-uc.a.run.app", JSON.stringify(payload), {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            }
        })
        const data = response.data;

        if (data.error) {
            paymentError.value = data.error.message || 'Kushindwa kuchakata malipo. Jaribu tena.';
            return;
        }

        const redirect_url = data.redirect_url;
        if (redirect_url) {
            paymentUrl.value = redirect_url;
            showPaymentModal.value = false;
            showIframeModal.value = true;
        }

    } catch (error) {
        console.error(error);
        paymentError.value = 'Itifaki ya mfumo imeshindwa. Tafadhali angalia mtandao wako.';
    } finally {
        isProcessing.value = false;
    }
};

// Takwimu za Jumla
const totalStats = computed(() => {
    const totalPledged = contributions.value.reduce((acc, curr) => acc + (curr.pledgedAmount || 0), 0);
    const totalPaid = contributions.value.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
    return {
        totalPledged,
        totalPaid,
        progress: totalPledged > 0 ? (totalPaid / totalPledged * 100).toFixed(1) : 0
    };
});

const communityData = computed(() =>
    contributions.value
        .filter(c => c.id !== currentUserId.value)
        .map(c => ({
            ...c,
            statusDisplay: updateStatus(c.pledgedAmount || 0, c.paidAmount || 0)
        }))
        .sort((a, b) => (b.paidAmount || 0) - (a.paidAmount || 0))
);

const formatCurrency = (val) => {
    if (val === undefined || val === null) return 'TSh 0';
    return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency: 'TZS',
        maximumFractionDigits: 0,
        currencyDisplay: 'code'
    }).format(val).replace('TZS', 'TSh');
};
</script>

<template>
    <div
        class="min-h-screen text-slate-100 font-sans selection:bg-white/20 selection:text-white overflow-x-hidden relative bg-black">
        <!-- Floating Mesh Glows (Apple Style) -->
        <div class="fixed inset-0 overflow-hidden pointer-events-none">
            <div
                class="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-indigo-600/20 rounded-full blur-[120px] animate-radial-glow">
            </div>
            <div class="absolute top-[20%] -right-[10%] w-[60%] h-[60%] bg-purple-600/15 rounded-full blur-[120px] animate-radial-glow"
                style="animation-delay: -5s;"></div>
            <div class="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] bg-pink-600/10 rounded-full blur-[120px] animate-radial-glow"
                style="animation-delay: -10s;"></div>
        </div>

        <!-- Apple invited Hero Background -->
        <div class="fixed inset-0 -z-10 bg-black">
            <!-- The Hero Image -->
            <div class="absolute top-0 inset-x-0 h-[60vh] overflow-hidden">
                <img :src="eventData.eventThumbnail || '/src/assets/celebration_bg.png'"
                    class="w-full h-full object-cover animate-subtle-zoom" alt="Hero Image">
                <!-- Smooth gradient transition to black -->
                <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black"></div>
            </div>

            <!-- Global Overlays -->
            <div class="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>
        </div>

        <!-- Loading Overlay -->
        <div v-if="loading"
            class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-3xl">
            <div class="flex flex-col items-center space-y-4">
                <div class="size-12 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
                <p class="text-white/40 font-medium text-[10px] tracking-widest uppercase">Kupakia...</p>
            </div>
        </div>

        <div class="max-w-md mx-auto px-6 py-12 relative z-10 min-h-screen flex flex-col">
            <!-- Header Section -->
            <header class="text-center mb-10">
                <div
                    class="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full apple-glass border-white/10 mb-6 mx-auto">
                    <SparklesIcon class="size-3 text-indigo-400" />
                    <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">{{ eventData.title
                    }}</span>
                </div>

                <h1 class="text-4xl font-black text-white tracking-tight mb-4 leading-tight">
                    {{ myRecord.fullName }}
                </h1>
                <div v-if="eventData.description" class="max-w-xs mx-auto text-center">
                    <p
                        :class="['text-white/50 text-sm leading-relaxed transition-all duration-300', !isExpanded ? 'line-clamp-5' : '']">
                        {{ eventData.description }}
                    </p>
                    <button v-if="eventData.description.length > 150" @click="isExpanded = !isExpanded"
                        class="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
                        {{ isExpanded ? 'Onyesha Kidogo' : 'Soma Zaidi...' }}
                    </button>
                </div>
            </header>

            <!-- Apple-style Segmented Control (Tabs) -->
            <nav class="segmented-control flex mb-8 mx-auto w-full max-w-[280px]">
                <button @click="setTab('yangu')"
                    :class="['segmented-control-item', activeTab === 'yangu' ? 'active' : '']">
                    Status Yangu
                </button>
                <button @click="setTab('jamii')"
                    :class="['segmented-control-item', activeTab === 'jamii' ? 'active' : '']">
                    Wachangiaji
                </button>
            </nav>

            <!-- Main Content Area -->
            <main class="flex-1">
                <!-- Tab: My Status -->
                <div v-if="activeTab === 'yangu'"
                    class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <!-- Progress Card -->
                    <div class="apple-glass-heavy rounded-[32px] p-8 text-center relative overflow-hidden group">
                        <div class="relative z-10">
                            <h3 class="text-white/40 text-[10px] font-black uppercase tracking-widest mb-6">Lengo la
                                Jamii
                            </h3>
                            <div class="flex items-end justify-center space-x-2 mb-2">
                                <span class="text-4xl font-black text-white tracking-tighter">{{ totalStats.progress
                                }}%</span>
                                <span class="text-white/30 text-xs font-bold mb-1.5">Imekamilika</span>
                            </div>

                            <!-- Integrated Progress Bar -->
                            <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-6">
                                <div class="h-full bg-white rounded-full transition-all duration-1000"
                                    :style="{ width: `${totalStats.progress}%` }"></div>
                            </div>

                            <div
                                class="flex justify-between items-center text-[10px] font-black uppercase text-white/40">
                                <span>{{ formatCurrency(totalStats.totalPaid) }}</span>
                                <span>{{ formatCurrency(totalStats.totalPledged) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Personal Status Card -->
                    <div class="apple-glass rounded-[32px] p-8 flex flex-col items-center justify-center min-h-[300px]">
                        <div v-if="myRecord.pledgedAmount === 0" class="text-center space-y-6">
                            <div class="size-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
                                <RocketLaunchIcon class="size-8 text-white/40" />
                            </div>
                            <h3 class="text-xl font-bold text-white">Anza Leo</h3>
                            <p class="text-white/40 text-sm max-w-[200px]">Usiachwe nyuma, weka ahadi yako sasa.</p>
                            <button @click="openPledgeModal"
                                class="bg-white text-black font-black px-8 py-4 rounded-2xl text-sm transition-transform active:scale-95 shadow-[0_10px_30px_-10px_rgba(255,255,255,0.3)]">
                                Weka Ahadi
                            </button>
                        </div>

                        <div v-else class="w-full space-y-8 text-center">
                            <div>
                                <p class="text-[10px] font-black uppercase text-white/40 tracking-widest mb-2">Salio
                                    Lako
                                </p>
                                <h2 class="text-5xl font-black text-white tracking-tighter tabular-nums">
                                    {{ formatCurrency(myRecord.pledgedAmount - myRecord.paidAmount) }}
                                </h2>
                            </div>

                            <div
                                class="grid grid-cols-2 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/5">
                                <div class="bg-black/20 p-4">
                                    <p class="text-[9px] font-bold text-white/30 uppercase mb-1">Ahadi</p>
                                    <p class="text-sm font-black text-white">{{ formatCurrency(myRecord.pledgedAmount)
                                        }}
                                    </p>
                                </div>
                                <div class="bg-black/20 p-4">
                                    <p class="text-[9px] font-bold text-white/30 uppercase mb-1">Malipo</p>
                                    <p class="text-sm font-black text-emerald-400">{{
                                        formatCurrency(myRecord.paidAmount) }}
                                    </p>
                                </div>
                            </div>

                            <div class="space-y-3">
                                <button @click="openPaymentModal"
                                    class="w-full bg-white text-black font-black py-4 rounded-2xl text-sm transition-transform active:scale-95">
                                    Ongeza Mchango
                                </button>
                                <button @click="openPledgeModal"
                                    class="text-white/30 text-[10px] font-bold uppercase py-2">
                                    Hariri Ahadi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab: Community -->
                <div v-if="activeTab === 'jamii'"
                    class="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div class="apple-glass rounded-[32px] overflow-hidden">
                        <div class="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 class="text-xs font-black uppercase tracking-widest text-white/60">Wachangiaji</h3>
                            <span class="text-[10px] font-bold text-white/30">{{ contributions.length }} Jumla</span>
                        </div>
                        <div class="max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div v-for="person in communityData" :key="person.id"
                                class="flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                <div class="flex items-center space-x-4">
                                    <div
                                        class="size-10 rounded-full bg-white/5 flex items-center justify-center text-xs font-black text-white/60 border border-white/10">
                                        {{ person.fullName?.charAt(0) }}
                                    </div>
                                    <div>
                                        <p class="text-sm font-bold text-white tracking-tight">{{ person.fullName }}</p>
                                        <p class="text-[10px] font-medium text-white/30 lowercase">{{
                                            person.statusDisplay }}
                                        </p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-sm font-black text-white">{{ formatCurrency(person.paidAmount) }}</p>
                                    <p class="text-[9px] font-bold text-white/20">{{
                                        formatCurrency(person.pledgedAmount) }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <!-- Footer Help -->
            <footer v-if="eventData.supportPhone" class="mt-8 pb-12 text-center">
                <a :href="`https://wa.me/${eventData.supportPhone.replace(/[^0-9]/g, '')}`" target="_blank"
                    class="inline-flex items-center space-x-2 text-white/30 hover:text-white/50 transition-colors py-2 px-4 rounded-full border border-white/5 text-[10px] font-bold uppercase tracking-widest">
                    <PhoneIcon class="size-3" />
                    <span>Msaada</span>
                </a>
            </footer>
        </div>

        <!-- MODAL: PLEDGE / PAYMENT (Apple Style) -->
        <div v-if="showPledgeModal || showPaymentModal"
            class="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-2xl animate-in fade-in duration-300">
            <div
                class="apple-glass-heavy w-full max-w-sm p-8 rounded-[40px] animate-in slide-in-from-bottom-10 duration-500 mb-4 sm:mb-0">
                <div class="flex justify-between items-center mb-8">
                    <div>
                        <h3 class="text-xl font-black text-white tracking-tight">{{ showPledgeModal ? 'Weka Ahadi' :
                            'Mchango' }}</h3>
                        <p class="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">{{ showPledgeModal
                            ? 'Jumla ya ahadi' : 'Kiasi unacholipa' }}</p>
                    </div>
                    <button @click="showPledgeModal = false; showPaymentModal = false"
                        class="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                        <XMarkIcon class="size-5" />
                    </button>
                </div>

                <div class="space-y-8">
                    <div class="space-y-2">
                        <label class="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Kiasi
                            (TSh)</label>
                        <div class="relative">
                            <input v-if="showPledgeModal" v-model.number="pledgeInput" type="number" autofocus
                                class="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-6 text-2xl font-black text-white focus:outline-none focus:bg-white/10 transition-all placeholder:text-white/10">
                            <input v-else v-model.number="paymentInput" type="number" autofocus
                                class="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-6 text-2xl font-black text-white focus:outline-none focus:bg-white/10 transition-all placeholder:text-white/10">
                        </div>
                    </div>

                    <div v-if="paymentError"
                        class="apple-glass border-red-500/20 bg-red-500/5 p-4 rounded-2xl animate-in fade-in zoom-in-95 duration-300">
                        <p
                            class="text-[10px] font-black text-red-400 uppercase tracking-widest leading-relaxed text-center">
                            {{ paymentError }}
                        </p>
                    </div>

                    <button @click="showPledgeModal ? savePledge() : addPayment()" :disabled="isProcessing"
                        class="w-full bg-white text-black font-black py-4 rounded-2xl text-sm transition-all active:scale-95 shadow-xl disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center space-x-2">
                        <div v-if="isProcessing && showPaymentModal"
                            class="size-4 border-2 border-black/10 border-t-black rounded-full animate-spin"></div>
                        <span>{{ isProcessing && showPaymentModal ? 'Inachakata...' : (showPledgeModal ? 'Hifadhi Ahadi'
                            : 'Lipa Sasa') }}</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- MODAL: IFRAME (Apple Style) -->
        <div v-if="showIframeModal"
            class="fixed inset-0 z-[300] flex flex-col bg-black animate-in fade-in duration-500">
            <div class="flex justify-between items-center p-6 border-b border-white/5">
                <div class="flex items-center space-x-3">
                    <div class="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span class="text-[10px] font-black uppercase tracking-widest text-white/40">Malipo Salama</span>
                </div>
                <button @click="showIframeModal = false; paymentUrl = ''" class="text-white/40 hover:text-white">
                    <XMarkIcon class="size-6" />
                </button>
            </div>
            <div class="flex-1 bg-white">
                <iframe :src="paymentUrl" class="w-full h-full border-0" allow="payment"></iframe>
            </div>
            <div class="p-6 bg-black text-center">
                <p class="text-[9px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">
                    Tafadhali usifunge ukurasa huu mpaka upate ujumbe wa kukamilisha.
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    border: 2px solid transparent;
    background-clip: content-box;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
    background-clip: content-box;
}
</style>
