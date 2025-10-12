<script setup>
import { publicGetJob } from '@/api/api';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const companyCode = route.params.companyCode || '';
const slug = route.params.slug || '';

const loading = ref(false);
const job = ref(null);
const notFound = ref(false);

function formatDate(d) {
    if (!d) return '-';
    try {
        return new Date(d).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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

function getEmploymentTypeColor(type) {
    const colors = {
        'full-time': 'bg-blue-100 text-blue-800 border-blue-200',
        'part-time': 'bg-green-100 text-green-800 border-green-200',
        contract: 'bg-orange-100 text-orange-800 border-orange-200',
        internship: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
}

const reqList = computed(() => {
    const raw = job.value?.requirements;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    return String(raw)
        .split(/\r?\n|•|- |\u2022/g)
        .map((s) => s.trim())
        .filter(Boolean);
});

async function fetchDetail() {
    if (!companyCode || !slug) return;
    loading.value = true;
    notFound.value = false;
    job.value = null;
    try {
        const res = await publicGetJob(companyCode, slug);
        job.value = res.data;
    } catch (err) {
        notFound.value = true;
        toast.add({
            severity: 'warn',
            summary: 'Lowongan tidak ditemukan',
            detail: err?.response?.data?.error || 'Lowongan tidak tersedia',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

function shareJob() {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Link berhasil disalin', life: 3000 });
}

function goBack() {
    if (router.hasRoute('PublicCareers')) {
        router.push({ name: 'PublicCareers', params: { companyCode } });
    } else {
        router.back();
    }
}

function goApply() {
    router.push({ name: 'PublicApply', params: { companyCode, slug } });
}

onMounted(fetchDetail);
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <div class="bg-white border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="py-6">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <Button icon="pi pi-arrow-left" text rounded severity="secondary" class="hover:bg-gray-100" @click="goBack" />
                            <div>
                                <h1 class="text-2xl font-bold text-gray-900">Detail Lowongan</h1>
                                <p class="text-gray-600 mt-1">Informasi lengkap tentang posisi ini</p>
                            </div>
                        </div>
                        <Button label="Lamar Sekarang" icon="pi pi-send" size="large" class="bg-blue-600 hover:bg-blue-700 border-blue-600 hidden lg:flex" :disabled="!job || job.status === 'closed'" @click="goApply" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Loading State -->
            <div v-if="loading" class="flex justify-center items-center py-16">
                <div class="text-center">
                    <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" class="mb-4" />
                    <p class="text-gray-600">Memuat detail lowongan...</p>
                </div>
            </div>

            <!-- Not Found State -->
            <div v-else-if="notFound" class="text-center py-16">
                <div class="max-w-md mx-auto">
                    <div class="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="pi pi-exclamation-triangle text-3xl text-yellow-600"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">Lowongan Tidak Ditemukan</h3>
                    <p class="text-gray-600 mb-6">Lowongan ini mungkin sudah ditutup atau tidak tersedia</p>
                    <Button label="Kembali ke Daftar Lowongan" icon="pi pi-arrow-left" outlined @click="goBack" />
                </div>
            </div>

            <!-- Job Content -->
            <div v-else-if="job" class="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <!-- Main Content - 3/4 width -->
                <div class="lg:col-span-3">
                    <div class="bg-white rounded-2xl shadow-sm border border-gray-200">
                        <!-- Job Header -->
                        <div class="p-8 border-b border-gray-100">
                            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                <div class="flex-1">
                                    <div class="flex items-center gap-3 mb-3">
                                        <h1 class="text-3xl font-bold text-gray-900">{{ job.title }}</h1>
                                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border" :class="getEmploymentTypeColor(job.employmentType)">
                                            {{ (job.employmentType || 'full-time').replace('-', ' ').toUpperCase() }}
                                        </span>
                                    </div>

                                    <div class="flex flex-wrap items-center gap-4 text-gray-600">
                                        <div class="flex items-center">
                                            <i class="pi pi-building mr-2"></i>
                                            <span>{{ job.department || 'Tidak tersedia' }}</span>
                                        </div>
                                        <div class="flex items-center">
                                            <i class="pi pi-map-marker mr-2"></i>
                                            <span>{{ job.location || 'Remote' }}</span>
                                        </div>
                                        <div class="flex items-center">
                                            <i class="pi pi-clock mr-2"></i>
                                            <span>Diposting {{ timeAgo(job.createdAt) }}</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex flex-col items-end gap-2">
                                    <Tag :value="job.status === 'open' ? 'DIBUKA' : 'DITUTUP'" :severity="job.status === 'open' ? 'success' : 'secondary'" class="text-sm font-semibold" />
                                    <Button label="Lamar Sekarang" icon="pi pi-send" class="bg-blue-600 hover:bg-blue-700 border-blue-600 lg:hidden" :disabled="job.status === 'closed'" @click="goApply" />
                                </div>
                            </div>
                        </div>

                        <!-- Job Description -->
                        <div class="p-8">
                            <div class="prose prose-lg max-w-none">
                                <h3 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                    <i class="pi pi-file text-blue-600 mr-3"></i>
                                    Deskripsi Pekerjaan
                                </h3>

                                <div class="text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl p-6">
                                    {{ job.description || 'Deskripsi tidak tersedia' }}
                                </div>
                            </div>

                            <!-- Requirements -->
                            <div v-if="reqList.length" class="mt-8">
                                <h3 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                    <i class="pi pi-check-circle text-green-600 mr-3"></i>
                                    Kualifikasi & Persyaratan
                                </h3>

                                <div class="bg-gray-50 rounded-xl p-6">
                                    <ul class="space-y-3">
                                        <li v-for="(requirement, index) in reqList" :key="index" class="flex items-start gap-3 text-gray-700">
                                            <i class="pi pi-check text-green-500 mt-1 flex-shrink-0"></i>
                                            <span class="leading-relaxed">{{ requirement }}</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <!-- Call to Action Bottom -->
                            <div class="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
                                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h4 class="font-semibold text-blue-900 mb-1">Tertarik dengan posisi ini?</h4>
                                        <p class="text-blue-700 text-sm">Kirim lamaran Anda sekarang dan jadilah bagian dari tim kami</p>
                                    </div>
                                    <Button label="Lamar Posisi Ini" icon="pi pi-send" size="large" class="bg-blue-600 hover:bg-blue-700 border-blue-600 whitespace-nowrap" :disabled="job.status === 'closed'" @click="goApply" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sidebar - 1/4 width -->
                <div class="lg:col-span-1">
                    <div class="space-y-6">
                        <!-- Job Summary -->
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 class="font-semibold text-gray-900 mb-4 flex items-center">
                                <i class="pi pi-info-circle text-blue-600 mr-2"></i>
                                Ringkasan
                            </h3>

                            <div class="space-y-4">
                                <div class="flex items-start gap-3">
                                    <i class="pi pi-building text-gray-400 mt-1"></i>
                                    <div>
                                        <div class="text-sm text-gray-500">Departemen</div>
                                        <div class="font-medium text-gray-900">{{ job.department || '-' }}</div>
                                    </div>
                                </div>

                                <div class="flex items-start gap-3">
                                    <i class="pi pi-briefcase text-gray-400 mt-1"></i>
                                    <div>
                                        <div class="text-sm text-gray-500">Tipe Pekerjaan</div>
                                        <div class="font-medium text-gray-900">
                                            {{ job.employmentType ? job.employmentType.replace('-', ' ').toUpperCase() : '-' }}
                                        </div>
                                    </div>
                                </div>

                                <div class="flex items-start gap-3">
                                    <i class="pi pi-map-marker text-gray-400 mt-1"></i>
                                    <div>
                                        <div class="text-sm text-gray-500">Lokasi</div>
                                        <div class="font-medium text-gray-900">{{ job.location || 'Remote' }}</div>
                                    </div>
                                </div>

                                <div class="flex items-start gap-3">
                                    <i class="pi pi-calendar text-gray-400 mt-1"></i>
                                    <div>
                                        <div class="text-sm text-gray-500">Diposting</div>
                                        <div class="font-medium text-gray-900">{{ formatDate(job.createdAt) }}</div>
                                    </div>
                                </div>

                                <div class="flex items-start gap-3">
                                    <i class="pi pi-tag text-gray-400 mt-1"></i>
                                    <div>
                                        <div class="text-sm text-gray-500">ID Lowongan</div>
                                        <div class="font-medium text-gray-900 font-mono text-sm">{{ job.slug }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Quick Actions -->
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 class="font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
                            <div class="space-y-3">
                                <Button label="Lamar Sekarang" icon="pi pi-send" class="w-full justify-center bg-blue-600 hover:bg-blue-700 border-blue-600" :disabled="job.status === 'closed'" @click="goApply" />
                                <Button label="Bagikan" icon="pi pi-share-alt" outlined severity="secondary" class="w-full justify-center" @click="shareJob" />
                                <Button label="Kembali" icon="pi pi-arrow-left" text severity="secondary" class="w-full justify-center" @click="goBack" />
                            </div>
                        </div>

                        <!-- Status Info -->
                        <div v-if="job.status === 'closed'" class="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                            <div class="flex items-start gap-3">
                                <i class="pi pi-info-circle text-orange-600 mt-1"></i>
                                <div>
                                    <div class="font-medium text-orange-900">Lowongan Ditutup</div>
                                    <div class="text-orange-700 text-sm mt-1">Posisi ini sudah tidak menerima lamaran baru.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
