<script setup>
import { api, getCompany, publicListJobs } from '@/api/api';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const companyCode = route.params.companyCode || localStorage.getItem('companyCode') || '';

const loading = ref(false);
const jobs = ref([]);
const company = ref(null);

// filters/search
const filters = ref({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
});
const filterDept = ref(null);
const filterType = ref(null);

const typeOptions = [
    { label: 'Semua Tipe', value: null },
    { label: 'Full-time', value: 'Full-time' },
    { label: 'Part-time', value: 'Part-time' },
    { label: 'Contract', value: 'Contract' },
    { label: 'Internship', value: 'Internship' }
];
const deptOptions = computed(() => {
    const set = new Set((jobs.value || []).map((j) => j.department).filter(Boolean));
    return [{ label: 'Semua Departemen', value: null }, ...Array.from(set).map((d) => ({ label: d, value: d }))];
});

// computed
const totalOpen = computed(() => (jobs.value || []).filter((j) => j.status === 'open').length);

// helpers
function formatDate(d) {
    if (!d) return '-';
    try {
        return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return d;
    }
}

function timeAgo(d) {
    if (!d) return '';
    const now = new Date();
    const date = new Date(d);
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hari ini';
    if (diffDays === 2) return 'Kemarin';
    if (diffDays < 7) return `${diffDays - 1} hari lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
    return formatDate(d);
}

function initials(name) {
    const s = (name || '').trim();
    if (!s) return '?';
    const parts = s.split(/\s+/).slice(0, 2);
    return parts
        .map((p) => p[0])
        .join('')
        .toUpperCase();
}

function getEmploymentTypeColor(type) {
    const colors = {
        'Full-time': 'bg-blue-100 text-blue-800 border-blue-200',
        'Part-time': 'bg-green-100 text-green-800 border-green-200',
        Contract: 'bg-orange-100 text-orange-800 border-orange-200',
        Internship: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
}

// fetch
async function fetchCompany() {
    if (!companyCode) return;
    try {
        const res = await getCompany(companyCode);
        company.value = res.data || null;
    } catch (err) {
        company.value = null;
    }
}

async function fetchJobs() {
    if (!companyCode) return;
    loading.value = true;
    try {
        const res = await publicListJobs(companyCode);
        jobs.value = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: err?.response?.data?.error || 'Gagal memuat lowongan', life: 3000 });
    } finally {
        loading.value = false;
    }
}

onMounted(async () => {
    await Promise.all([fetchCompany(), fetchJobs()]);
});

// filtering
const filtered = computed(() => {
    const q = (filters.value.global.value || '').toString().toLowerCase().trim();
    const dept = filterDept.value;
    const typ = filterType.value;

    return (jobs.value || []).filter((j) => {
        const qmatch = !q || [j.title, j.department, j.employmentType, j.location, j.description].filter(Boolean).join(' ').toLowerCase().includes(q);
        const dmatch = !dept || j.department === dept;
        const tmatch = !typ || (j.employmentType || '').toLowerCase() === typ;
        const statusMatch = j.status === 'open'; // Hanya tampilkan yang open

        return qmatch && dmatch && tmatch && statusMatch;
    });
});

// nav
function goDetail(job) {
    if (router.hasRoute('PublicJobDetail')) {
        router.push({ name: 'PublicJobDetail', params: { companyCode, slug: job.slug } });
    } else {
        const base = (api?.defaults?.baseURL || '').replace(/\/$/, '');
        window.open(`${base}/public/${companyCode}/jobs/${job.slug}`, '_blank', 'noopener');
    }
}

function goApply(job) {
    if (router.hasRoute('PublicApply')) {
        router.push({ name: 'PublicApply', params: { companyCode, slug: job.slug } });
    } else {
        goDetail(job);
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 flex flex-col">
        <!-- Header -->
        <div class="bg-white border-b border-gray-200 flex-shrink-0">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="py-8">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                {{ initials(company?.name || company?.companyName || companyCode) }}
                            </div>
                            <div>
                                <h1 class="text-3xl font-bold text-gray-900">{{ company?.name || company?.companyName || 'Perusahaan' }}</h1>
                                <p class="text-gray-600 mt-1 flex items-center space-x-4">
                                    <span class="flex items-center">
                                        <i class="pi pi-briefcase mr-2"></i>
                                        <span>{{ totalOpen }} lowongan tersedia</span>
                                    </span>
                                    <span class="flex items-center">
                                        <i class="pi pi-map-marker mr-2"></i>
                                        <span>{{ company?.address || 'Lokasi tidak tersedia' }}</span>
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <main class="flex-1 pb-16">
            <!-- Padding bottom untuk footer fixed -->
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <!-- Search and Filters -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h2 class="text-xl font-semibold text-gray-900">Temukan Posisi yang Tepat</h2>
                            <p class="text-gray-600 mt-1">Jelajahi lowongan yang sesuai dengan keahlian dan minat Anda</p>
                        </div>

                        <div class="flex flex-col sm:flex-row gap-3">
                            <IconField class="w-full sm:w-64">
                                <InputIcon class="pi pi-search" />
                                <InputText v-model="filters.global.value" placeholder="Cari posisi, departemen..." class="w-full" />
                            </IconField>

                            <div class="flex gap-3">
                                <Dropdown v-model="filterDept" :options="deptOptions" optionLabel="label" optionValue="value" placeholder="Departemen" class="w-40" />
                                <Dropdown v-model="filterType" :options="typeOptions" optionLabel="label" optionValue="value" placeholder="Tipe Kerja" class="w-40" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Results Count -->
                <div class="flex items-center justify-between mb-6">
                    <div class="text-gray-600">
                        Menampilkan <span class="font-semibold text-gray-900">{{ filtered.length }}</span> dari <span class="font-semibold text-gray-900">{{ totalOpen }}</span> lowongan tersedia
                    </div>
                </div>

                <!-- Jobs Grid -->
                <div v-if="loading" class="flex justify-center items-center py-16">
                    <div class="text-center">
                        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" class="mb-4" />
                        <p class="text-gray-600">Memuat lowongan...</p>
                    </div>
                </div>

                <div v-else-if="!filtered.length && jobs.length > 0" class="text-center py-16">
                    <div class="max-w-md mx-auto">
                        <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="pi pi-search text-3xl text-gray-400"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Tidak ada lowongan yang cocok</h3>
                        <p class="text-gray-600 mb-6">Coba ubah kata kunci pencarian atau filter yang Anda gunakan</p>
                        <Button
                            label="Reset Filter"
                            icon="pi pi-refresh"
                            outlined
                            @click="
                                filters.global.value = '';
                                filterDept = null;
                                filterType = null;
                            "
                        />
                    </div>
                </div>

                <div v-else-if="jobs.length === 0" class="text-center py-16">
                    <div class="max-w-md mx-auto">
                        <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i class="pi pi-inbox text-4xl text-gray-400"></i>
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Belum ada lowongan</h3>
                        <p class="text-gray-600">Perusahaan ini belum membuka lowongan pekerjaan saat ini</p>
                    </div>
                </div>

                <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div v-for="job in filtered" :key="job._id" class="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-blue-300 group">
                        <div class="p-6 h-full flex flex-col">
                            <!-- Header -->
                            <div class="flex justify-between items-start mb-4">
                                <div class="flex-1">
                                    <h3 class="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {{ job.title }}
                                    </h3>
                                    <p class="text-gray-600 mt-1 flex items-center">
                                        <i class="pi pi-map-marker text-sm mr-2"></i>
                                        {{ job.location || 'Remote' }}
                                    </p>
                                </div>
                                <div class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    <i class="pi pi-briefcase text-blue-600"></i>
                                </div>
                            </div>

                            <!-- Tags -->
                            <div class="flex flex-wrap gap-2 mb-4">
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border" :class="getEmploymentTypeColor(job.employmentType)">
                                    {{ (job.employmentType || 'Full-time').replace('-', ' ').toUpperCase() }}
                                </span>
                                <span v-if="job.department" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                    {{ job.department }}
                                </span>
                            </div>

                            <!-- Description Preview -->
                            <div class="text-gray-600 flex-1 mb-4 leading-relaxed">
                                {{ job.description || 'Deskripsi tidak tersedia' }}
                            </div>

                            <!-- Footer -->
                            <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div class="text-sm text-gray-500">
                                    <i class="pi pi-clock mr-1"></i>
                                    {{ timeAgo(job.createdAt) }}
                                </div>
                                <div class="flex gap-2">
                                    <Button label="Detail" icon="pi pi-eye" outlined size="small" @click="goDetail(job)" />
                                    <Button label="Lamar" icon="pi pi-send" size="small" @click="goApply(job)" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Fixed Footer -->
        <footer class="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div class="text-center text-gray-600">
                    <p class="text-sm">&copy; {{ new Date().getFullYear() }} {{ company?.name || 'Perusahaan' }}. All rights reserved.</p>
                </div>
            </div>
        </footer>
    </div>
</template>
