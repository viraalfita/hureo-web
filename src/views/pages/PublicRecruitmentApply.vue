<script setup>
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Divider from 'primevue/divider';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const companyCode = computed(() => route.params.companyCode);
const slug = computed(() => route.params.slug);

const API_BASE = import.meta.env.VITE_API_BASE || '';

/* ------------ State ------------ */
const job = ref(null);
const company = ref(null);
const loading = ref(false);
const submitting = ref(false);

const fullName = ref('');
const email = ref('');
const phone = ref('');
const coverLetter = ref('');
const address = ref('');
const gender = ref('');
const dateOfBirth = ref(null);
const fileInput = ref(null);
const resumeFile = ref(null);

const genders = [
    { label: 'Laki-laki', value: 'male' },
    { label: 'Perempuan', value: 'female' },
    { label: 'Lainnya', value: 'other' }
];

/* ------------ Helpers company from storage ------------ */
function pickCompanyFromStorage() {
    try {
        const raw = localStorage.getItem('company') || sessionStorage.getItem('company');
        const obj = raw ? JSON.parse(raw) : {};
        return {
            id: obj?.id || obj?._id || obj?.companyId || localStorage.getItem('companyId') || '',
            code: obj?.code || obj?.companyCode || localStorage.getItem('companyCode') || companyCode.value || '',
            name: obj?.name || '',
            address: obj?.address || '',
            industry: obj?.industry || '',
            logoUrl: obj?.logoUrl || ''
        };
    } catch {
        return { id: '', code: companyCode.value || '', name: '', address: '', industry: '', logoUrl: '' };
    }
}

/* ------------ Fetch (job only) ------------ */
async function fetchJobOnly() {
    loading.value = true;
    try {
        const r = await fetch(`${API_BASE}/api/public/${companyCode.value}/jobs/${slug.value}`);
        if (!r.ok) throw new Error('Gagal memuat lowongan');
        job.value = await r.json();

        const c = pickCompanyFromStorage();
        company.value = {
            code: c.code,
            name: job.value?.company?.name || c.name || c.code,
            address: job.value?.company?.address || c.address || '',
            industry: job.value?.company?.industry || c.industry || '',
            logoUrl: job.value?.company?.logoUrl || c.logoUrl || ''
        };
    } catch (e) {
        console.warn('Gagal memuat data:', e.message);
        const c = pickCompanyFromStorage();
        company.value = { code: c.code, name: c.name || c.code, address: c.address || '', industry: c.industry || '', logoUrl: c.logoUrl || '' };
    } finally {
        loading.value = false;
    }
}

onMounted(fetchJobOnly);

/* ------------ UI helpers ------------ */
function onPickFile(e) {
    const f = e.target.files?.[0];
    resumeFile.value = f || null;
}

function resetForm() {
    fullName.value = '';
    email.value = '';
    phone.value = '';
    coverLetter.value = '';
    address.value = '';
    gender.value = '';
    dateOfBirth.value = null;
    resumeFile.value = null;
    if (fileInput.value) fileInput.value.value = '';
}

function formatDate(d) {
    if (!d) return '-';
    try {
        return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return d;
    }
}

function timeAgo(d) {
    if (!d) return '';
    const now = new Date();
    const date = new Date(d);
    const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Hari ini';
    if (diff === 1) return 'Kemarin';
    if (diff < 7) return `${diff} hari lalu`;
    if (diff < 30) return `${Math.floor(diff / 7)} minggu lalu`;
    return formatDate(d);
}

function getEmploymentTypeColor(type) {
    const t = String(type || '').toLowerCase();
    const map = {
        fulltime: 'bg-blue-100 text-blue-800 border-blue-200',
        'full-time': 'bg-blue-100 text-blue-800 border-blue-200',
        parttime: 'bg-green-100 text-green-800 border-green-200',
        'part-time': 'bg-green-100 text-green-800 border-green-200',
        contract: 'bg-orange-100 text-orange-800 border-orange-200',
        intern: 'bg-purple-100 text-purple-800 border-purple-200',
        internship: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return map[t] || 'bg-gray-100 text-gray-800 border-gray-200';
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

/* ------------ Submit ------------ */
async function submit() {
    if (!fullName.value?.trim() || !email.value?.trim()) {
        toast.add({ severity: 'warn', summary: 'Validasi', detail: 'Nama lengkap dan email wajib diisi.', life: 2500 });
        return;
    }
    if (!resumeFile.value) {
        toast.add({ severity: 'warn', summary: 'Validasi', detail: 'File resume/CV wajib diupload.', life: 2500 });
        return;
    }

    try {
        submitting.value = true;
        const fd = new FormData();
        fd.set('fullName', fullName.value.trim());
        fd.set('email', email.value.trim());
        if (phone.value) fd.set('phone', phone.value.trim());
        if (coverLetter.value) fd.set('coverLetter', coverLetter.value.trim());
        if (address.value) fd.set('address', address.value.trim());
        if (gender.value) fd.set('gender', gender.value);
        if (dateOfBirth.value) fd.set('dateOfBirth', new Date(dateOfBirth.value).toISOString());
        if (resumeFile.value) fd.set('resume', resumeFile.value, resumeFile.value.name);

        const r = await fetch(`${API_BASE}/api/public/${companyCode.value}/jobs/${slug.value}/apply`, { method: 'POST', body: fd });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || 'Gagal melamar');

        toast.add({ severity: 'success', summary: 'Lamaran Terkirim!', detail: 'Terima kasih! Tim rekruter akan meninjau lamaran Anda.', life: 4000 });
        resetForm();
        setTimeout(() => router.push(`/users/c/${companyCode.value}/jobs`), 2000);
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal Mengirim', detail: e.message || 'Terjadi kesalahan saat mengirim lamaran.', life: 4000 });
    } finally {
        submitting.value = false;
    }
}

function goBack() {
    router.push(`/c/${companyCode.value}/jobs/${slug.value}`);
}
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <div class="bg-white border-b border-gray-200">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="py-6">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <Button icon="pi pi-arrow-left" text rounded severity="secondary" class="hover:bg-gray-100" @click="goBack" />
                            <div>
                                <h1 class="text-2xl font-bold text-gray-900">Kirim Lamaran</h1>
                                <p class="text-gray-600 mt-1">Lamar posisi {{ job?.title || '' }} di {{ company?.name || 'Perusahaan' }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Job Info Header -->
            <div v-if="job" class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3">
                            <h2 class="text-xl font-bold text-gray-900">{{ job.title }}</h2>
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border" :class="getEmploymentTypeColor(job.employmentType)">
                                {{ (job.employmentType || 'full-time').replace('-', ' ').toUpperCase() }}
                            </span>
                        </div>

                        <div class="flex flex-wrap items-center gap-4 text-gray-600 text-sm">
                            <div class="flex items-center">
                                <i class="pi pi-building mr-2"></i>
                                <span>{{ company?.name || 'Perusahaan' }}</span>
                            </div>
                            <div class="flex items-center">
                                <i class="pi pi-briefcase mr-2"></i>
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
                    </div>
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="flex justify-center items-center py-16">
                <div class="text-center">
                    <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" class="mb-4" />
                    <p class="text-gray-600">Memuat formulir...</p>
                </div>
            </div>

            <!-- Main Form -->
            <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-200">
                <!-- Form Header -->
                <div class="p-6 border-b border-gray-100">
                    <h2 class="text-xl font-bold text-gray-900 mb-2">Formulir Lamaran</h2>
                    <p class="text-gray-600">Isi data diri Anda dengan lengkap dan benar</p>
                </div>

                <!-- Form Content -->
                <div class="p-6">
                    <div class="space-y-6">
                        <!-- Personal Information -->
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <i class="pi pi-user text-blue-600 mr-3"></i>
                                Data Pribadi
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2"> Nama Lengkap <span class="text-red-500">*</span> </label>
                                    <InputText v-model="fullName" placeholder="Masukkan nama lengkap" class="w-full" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2"> Email <span class="text-red-500">*</span> </label>
                                    <InputText v-model="email" type="email" placeholder="nama@email.com" class="w-full" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2"> Nomor Telepon </label>
                                    <InputText v-model="phone" placeholder="08xxxxxxxxxx" class="w-full" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2"> Jenis Kelamin </label>
                                    <Dropdown v-model="gender" :options="genders" optionLabel="label" optionValue="value" placeholder="Pilih jenis kelamin" class="w-full" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2"> Tanggal Lahir </label>
                                    <Calendar v-model="dateOfBirth" dateFormat="dd/mm/yy" showIcon iconDisplay="input" class="w-full" :maxDate="new Date()" />
                                </div>
                            </div>
                        </div>

                        <Divider />

                        <!-- Additional Information -->
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <i class="pi pi-map-marker text-green-600 mr-3"></i>
                                Informasi Tambahan
                            </h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2"> Alamat Lengkap </label>
                                    <InputText v-model="address" placeholder="Alamat tempat tinggal saat ini" class="w-full" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2"> Surat Lamaran (Cover Letter) </label>
                                    <Textarea v-model="coverLetter" rows="5" autoResize placeholder="Ceritakan mengapa Anda tertarik dengan posisi ini dan pengalaman yang relevan..." class="w-full" />
                                    <small class="text-gray-500 mt-1"> Optional - Maksimal 500 kata </small>
                                </div>
                            </div>
                        </div>

                        <Divider />

                        <!-- Resume Upload -->
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <i class="pi pi-file-pdf text-red-600 mr-3"></i>
                                Upload Dokumen
                            </h3>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2"> Resume / CV <span class="text-red-500">*</span> </label>
                                <input
                                    ref="fileInput"
                                    type="file"
                                    accept=".pdf,.doc,.docx,.rtf"
                                    @change="onPickFile"
                                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                <div class="mt-2 text-sm text-gray-500">
                                    <p>• Format: PDF, DOC, DOCX, RTF</p>
                                    <p>• Maksimal ukuran: 10MB</p>
                                    <p v-if="resumeFile" class="text-green-600 font-medium mt-1">✓ File terpilih: {{ resumeFile.name }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Submit Section -->
                        <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h4 class="font-semibold text-gray-900 mb-1">Siap mengirim lamaran?</h4>
                                    <p class="text-gray-600 text-sm">Pastikan semua data sudah benar sebelum mengirim</p>
                                </div>
                                <div class="flex gap-3">
                                    <Button label="Kembali" icon="pi pi-arrow-left" severity="secondary" outlined @click="goBack" />
                                    <Button label="Kirim Lamaran" icon="pi pi-send" :loading="submitting" class="bg-blue-600 hover:bg-blue-700 border-blue-600" @click="submit" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
