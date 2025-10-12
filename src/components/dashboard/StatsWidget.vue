<script setup>
import { fetchAllLeaves, fetchTodayAttendanceByCompany, fetchUsersByCompany } from '@/api/api';
import { computed, onMounted, ref } from 'vue';

const companyId = localStorage.getItem('companyId');
const loading = ref(true);

const users = ref([]);
const today = ref([]);
const leaves = ref([]);

onMounted(async () => {
    try {
        const [u, t, l] = await Promise.all([fetchUsersByCompany(companyId), fetchTodayAttendanceByCompany(companyId, 'Asia/Jakarta'), fetchAllLeaves()]);
        users.value = u ?? [];
        today.value = t ?? [];
        leaves.value = Array.isArray(l) ? l.filter((it) => it.companyId === companyId) : [];
    } finally {
        loading.value = false;
    }
});

const totalKaryawan = computed(() => users.value.length);
const hadirHariIni = computed(() => today.value.filter((a) => (a.status ?? '').toLowerCase() === 'present').length);
const terlambatHariIni = computed(() => today.value.filter((a) => a.isLate === true || (a.status ?? '').toLowerCase() === 'late').length);
const cutiPending = computed(() => leaves.value.filter((l) => (l.status ?? '').toLowerCase() === 'pending').length);

const cards = computed(() => [
    { label: 'Karyawan', value: totalKaryawan.value, icon: 'pi pi-users', bg: 'bg-cyan-100 dark:bg-cyan-400/10', iconColor: 'text-cyan-500' },
    { label: 'Hadir (Hari Ini)', value: hadirHariIni.value, icon: 'pi pi-check-circle', bg: 'bg-green-100 dark:bg-green-400/10', iconColor: 'text-green-500' },
    { label: 'Terlambat (Hari Ini)', value: terlambatHariIni.value, icon: 'pi pi-clock', bg: 'bg-orange-100 dark:bg-orange-400/10', iconColor: 'text-orange-500' },
    { label: 'Cuti Pending', value: cutiPending.value, icon: 'pi pi-inbox', bg: 'bg-purple-100 dark:bg-purple-400/10', iconColor: 'text-purple-500' }
]);
</script>

<template>
    <template v-for="card in cards" :key="card.label">
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">{{ card.label }}</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                            <span v-if="!loading">{{ card.value }}</span>
                            <span v-else class="opacity-60">…</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-center rounded-border" :class="card.bg" style="width: 2.5rem; height: 2.5rem">
                        <i class="!text-xl" :class="[card.icon, card.iconColor]"></i>
                    </div>
                </div>
                <span class="text-muted-color">Diperbarui hari ini</span>
            </div>
        </div>
    </template>
</template>
