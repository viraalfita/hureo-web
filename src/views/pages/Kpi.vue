<script setup>
import { getCompanyKPI } from '@/api/api';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

const toast = useToast();

// ===== ambil company dari storage
function pickCompanyFromStorage() {
    const raw = localStorage.getItem('company') || sessionStorage.getItem('company');
    const obj = raw ? JSON.parse(raw) : {};
    return {
        id: localStorage.getItem('companyId') || obj?.id || obj?._id || obj?.companyId || '',
        code: localStorage.getItem('companyCode') || obj?.code || obj?.companyCode || ''
    };
}
const { id: companyId } = pickCompanyFromStorage();

// ===== state
const loading = ref(false);
const month = ref(new Date()); // Calendar month view
const metric = ref('score'); // 'score' | 'presence' | 'punctuality'
const search = ref('');

const kpi = ref({ month: '', items: [] }); // API result

// ===== derived
const monthParam = computed(() => {
    const d = month.value instanceof Date ? month.value : new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
});

// filter + sort
const filteredSorted = computed(() => {
    const q = search.value.trim().toLowerCase();
    const m = metric.value; // key to sort & display
    const src = Array.isArray(kpi.value.items) ? kpi.value.items : [];
    const fil = q
        ? src.filter((x) =>
              String(x.name || '')
                  .toLowerCase()
                  .includes(q)
          )
        : src;
    // nilai dipakai: score (0-100), presence (0-100), punctuality (0-100)
    return [...fil].sort((a, b) => Number(b[m] || 0) - Number(a[m] || 0));
});

// ===== helpers UI
function widthPct(n) {
    const v = Math.max(0, Math.min(100, Number(n || 0)));
    return `${v}%`;
}
function colorByValue(v) {
    const x = Number(v || 0);
    if (x >= 85) return 'bg-primary';
    if (x >= 70) return 'bg-green-500';
    if (x >= 50) return 'bg-orange-500';
    return 'bg-pink-500';
}
function metricLabel(m) {
    switch (m) {
        case 'presence':
            return 'Presence';
        case 'punctuality':
            return 'Punctuality';
        default:
            return 'Score';
    }
}

// ===== fetch
async function fetchKPI() {
    if (!companyId) {
        toast.add({ severity: 'error', summary: 'Perusahaan kosong', detail: 'companyId tidak ditemukan', life: 2500 });
        return;
    }
    loading.value = true;
    try {
        const res = await getCompanyKPI(companyId, { month: monthParam.value });
        kpi.value = res?.data || { month: monthParam.value, items: [] };
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: err?.response?.data?.error || 'Gagal memuat KPI', life: 3000 });
    } finally {
        loading.value = false;
    }
}
onMounted(fetchKPI);
watch(month, fetchKPI);
</script>

<template>
    <div class="card">
        <!-- header -->
        <div class="flex justify-between items-center mb-6">
            <div class="font-semibold text-xl">KPI Karyawan ({{ monthParam }})</div>
            <div class="flex items-center gap-3">
                <IconField>
                    <InputIcon><i class="pi pi-search" /></InputIcon>
                    <InputText v-model="search" placeholder="Cari karyawan..." />
                </IconField>
                <div class="w-14rem">
                    <Select
                        v-model="metric"
                        :options="[
                            { label: 'Score', value: 'score' },
                            { label: 'Presence', value: 'presence' },
                            { label: 'Punctuality', value: 'punctuality' }
                        ]"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Pilih metrik"
                        fluid
                    />
                </div>
                <Calendar v-model="month" view="month" dateFormat="yy-mm" showIcon :manualInput="false" class="w-12rem" />
                <Button icon="pi pi-refresh" outlined @click="fetchKPI" :loading="loading" />
            </div>
        </div>

        <!-- list karyawan (satu bar per orang, urut tertinggi) -->
        <ul class="list-none p-0 m-0">
            <li v-for="(it, idx) in filteredSorted" :key="it.userId" class="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div class="min-w-0">
                    <span class="text-surface-900 dark:text-surface-0 font-medium mr-2 mb-1 md:mb-0 truncate block">{{ idx + 1 }}. {{ it.name }}</span>
                    <div class="mt-1 text-muted-color text-sm">
                        Score: <b>{{ Math.round(it.score) }}</b> • Presence: <b>{{ Math.round(it.presence) }}%</b> • Punctuality: <b>{{ Math.round(it.punctuality) }}%</b>
                    </div>
                </div>

                <div class="mt-2 md:mt-0 flex items-center md:ml-6 w-full md:w-auto">
                    <div class="bg-surface-300 dark:bg-surface-500 rounded-border overflow-hidden w-full md:w-40 lg:w-56" style="height: 8px">
                        <div :class="['h-full', colorByValue(it[metric])]" :style="{ width: widthPct(it[metric]) }"></div>
                    </div>
                    <span class="ml-4 font-medium" :class="colorByValue(it[metric]).replace('bg-', 'text-')"> {{ Math.round(it[metric]) }}% </span>
                </div>
            </li>

            <li v-if="!loading && !filteredSorted.length" class="text-center text-600 py-5">Tidak ada data untuk periode ini.</li>
        </ul>
    </div>
</template>
