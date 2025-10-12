<script setup>
import { api, deleteCandidate as deleteCandidateAPI, listCandidates, listJobs, updateCandidateStage } from '@/api/api';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

const toast = useToast();
const dt = ref(null);

// --- company from storage ---
function pickCompanyFromStorage() {
    const raw = localStorage.getItem('company') || sessionStorage.getItem('company');
    const obj = raw ? JSON.parse(raw) : {};
    return {
        id: localStorage.getItem('companyId') || obj?.id || obj?._id || obj?.companyId || obj?.company_id || '',
        code: localStorage.getItem('companyCode') || obj?.code || obj?.companyCode || ''
    };
}
const { id: companyId, code: companyCode } = pickCompanyFromStorage();

// --- share links menggunakan frontend URL ---
const FRONTEND_BASE = window.location.origin; // http://localhost:5173
const careersLink = computed(() => (companyCode ? `${FRONTEND_BASE}/careers/${companyCode}` : ''));
const selectedJob = computed(() => (jobs.value || []).find((j) => String(j._id) === String(filterJobId.value)));
const applyLink = computed(() => {
    if (!companyCode || !selectedJob.value?.slug) return '';
    return `${FRONTEND_BASE}/careers/${companyCode}/jobs/${selectedJob.value.slug}`;
});

// --- derive API base & origin (untuk CV preview saja) ---
const API_BASE = (api?.defaults?.baseURL || '').replace(/\/$/, ''); // .../api
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, ''); // ... (tanpa /api)

// --- state ---
const loading = ref(false);
const rows = ref([]);
const jobs = ref([]);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const filterStage = ref(null); // applied|screening|interview|offer|hired|declined
const filterJobId = ref(null);

// stage options
const STAGES = [
    { label: 'Applied', value: 'applied' },
    { label: 'Screening', value: 'screening' },
    { label: 'Interview', value: 'interview' },
    { label: 'Offer', value: 'offer' },
    { label: 'Hired', value: 'hired' },
    { label: 'Declined', value: 'declined' }
];

const stageSeverity = (s) => {
    switch (s) {
        case 'applied':
            return 'info';
        case 'screening':
            return 'secondary';
        case 'interview':
            return 'warn';
        case 'offer':
            return 'help';
        case 'hired':
            return 'success';
        case 'declined':
            return 'danger';
        default:
            return 'info';
    }
};

const selected = ref([]);
const showDetail = ref(false);
const detail = ref(null);

// --- CV Preview dialog ---
const showCV = ref(false);
const cvUrl = ref('');
const cvKind = ref('other'); // 'pdf' | 'image' | 'other'

function resolveResumeUrl(u) {
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    return `${API_ORIGIN}${u}`;
}
function detectKind(url) {
    const lower = (url || '').toLowerCase();
    if (/\.(pdf)(\?|#|$)/.test(lower)) return 'pdf';
    if (/\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/.test(lower)) return 'image';
    return 'other';
}
function openCVPreview(row) {
    const full = resolveResumeUrl(row.resumeUrl);
    if (!full) {
        toast.add({ severity: 'warn', summary: 'Tidak ada CV', life: 2000 });
        return;
    }
    cvUrl.value = full;
    cvKind.value = detectKind(full);
    showCV.value = true;
}

// --- fetch ---
async function fetchJobs() {
    try {
        const res = await listJobs({ companyId });
        jobs.value = Array.isArray(res.data) ? res.data : [];
    } catch {}
}
async function fetchCandidates() {
    loading.value = true;
    try {
        const res = await listCandidates({
            companyId,
            jobId: filterJobId.value || undefined,
            stage: filterStage.value || undefined,
            q: filters.value.global.value || undefined
        });
        rows.value = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: err?.response?.data?.error || 'Gagal memuat kandidat', life: 3000 });
    } finally {
        loading.value = false;
    }
}
onMounted(async () => {
    await Promise.all([fetchJobs(), fetchCandidates()]);
});

const visibleRows = computed(() => {
    const st = filterStage.value;
    const jid = filterJobId.value;
    return (rows.value || []).filter((r) => {
        const okStage = !st || r.stage === st;
        const okJob = !jid || String(r.jobId?._id || r.jobId) === String(jid);
        return okStage && okJob;
    });
});

function openDetail(row) {
    detail.value = row;
    showDetail.value = true;
}
async function changeStage(row, nextStage) {
    try {
        await updateCandidateStage(row._id || row.id, nextStage);
        toast.add({ severity: 'success', summary: 'Stage diperbarui', detail: `${row.fullName} → ${nextStage.toUpperCase()}`, life: 2000 });
        await fetchCandidates();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: err?.response?.data?.error || 'Tidak bisa update stage', life: 3000 });
    }
}
async function quickStage(row, next) {
    await changeStage(row, next);
}
async function removeCandidate(row) {
    try {
        await deleteCandidateAPI(row._id || row.id);
        toast.add({ severity: 'success', summary: 'Terhapus', detail: `${row.fullName} dihapus`, life: 2000 });
        await fetchCandidates();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: err?.response?.data?.error || 'Tidak bisa menghapus kandidat', life: 3000 });
    }
}
function formatDate(d) {
    if (!d) return '-';
    try {
        return new Date(d).toLocaleDateString('id-ID');
    } catch {
        return d;
    }
}
async function copy(text, label = 'Tersalin') {
    try {
        await navigator.clipboard.writeText(text);
        toast.add({ severity: 'success', summary: label, life: 1200 });
    } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        toast.add({ severity: 'success', summary: label, life: 1200 });
    }
}

// --- Export Excel ---
async function exportExcel() {
    try {
        if (!visibleRows.value.length) {
            toast.add({ severity: 'warn', summary: 'Tidak ada data', detail: 'Tidak ada data untuk diekspor.', life: 2500 });
            return;
        }

        const XLSX = await import('xlsx');
        const data = visibleRows.value.map((row, idx) => ({
            No: idx + 1,
            Nama: row.fullName || '-',
            Email: row.email || '-',
            Telepon: row.phone || '-',
            Lowongan: row.jobId?.title || '-',
            Stage:
                row.stage === 'applied'
                    ? 'Applied'
                    : row.stage === 'screening'
                      ? 'Screening'
                      : row.stage === 'interview'
                        ? 'Interview'
                        : row.stage === 'offer'
                          ? 'Offer'
                          : row.stage === 'hired'
                            ? 'Hired'
                            : row.stage === 'declined'
                              ? 'Declined'
                              : row.stage || '-',
            'Tanggal Apply': formatDate(row.createdAt),
            Alamat: row.address || '-',
            'Jenis Kelamin': row.gender === 'male' ? 'Pria' : row.gender === 'female' ? 'Wanita' : row.gender || '-',
            'Tanggal Lahir': formatDate(row.dateOfBirth),
            'Cover Letter': row.coverLetter || '-',
            'URL CV': row.resumeUrl || '-'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const headers = Object.keys(data[0] || { No: '' });

        // Atur lebar kolom otomatis
        ws['!cols'] = headers.map((key) => {
            const maxLen = data.reduce((acc, row) => {
                const val = row[key] != null ? String(row[key]) : '';
                return Math.max(acc, val.length);
            }, key.length);
            return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data Kandidat');

        // Format nama file
        const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const suffix = fmt(new Date());

        XLSX.writeFile(wb, `data_kandidat_${suffix}.xlsx`);

        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data kandidat berhasil diekspor ke Excel', life: 3000 });
    } catch (err) {
        console.error('Export error:', err);
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal mengekspor data ke Excel', life: 3000 });
    }
}

// --- Refresh function ---
async function refreshData() {
    await Promise.all([fetchJobs(), fetchCandidates()]);
}

watch([filterStage, filterJobId, () => filters.value.global.value], fetchCandidates);
</script>

<template>
    <div class="card">
        <!-- Refresh dan Share Links dalam satu baris -->
        <div class="mb-4 flex items-end justify-between gap-4">
            <!-- Kiri: Refresh Button -->
            <div></div>
        </div>

        <!-- Toolbar / filter -->
        <Toolbar class="mb-6">
            <template #start>
                <div class="flex gap-3 items-end">
                    <Button label="Refresh" icon="pi pi-refresh" severity="secondary" :loading="loading" @click="refreshData" />
                </div>
            </template>
            <template #end>
                <div class="text-600 text-sm flex items-center gap-2">
                    <IconField>
                        <InputIcon><i class="pi pi-search" /></InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Cari nama/email/telepon..." />
                    </IconField>
                    <div class="w-16rem">
                        <Dropdown v-model="filterJobId" :options="(jobs || []).map((j) => ({ label: j.title, value: j._id }))" optionLabel="label" optionValue="value" placeholder="Semua Lowongan" showClear fluid />
                    </div>
                    <div class="w-14rem">
                        <Dropdown v-model="filterStage" :options="STAGES" optionLabel="label" optionValue="value" placeholder="Semua Stage" showClear fluid />
                    </div>
                    <Button label="Export" icon="pi pi-file-excel" severity="success" outlined :disabled="loading || !visibleRows.length" @click="exportExcel" />
                </div>
            </template>
        </Toolbar>
        <!-- Kanan: Share Links -->
        <div class="flex gap-3 align-items-end">
            <div class="flex-1">
                <div class="flex flex-col gap-2">
                    <label class="text-900 font-medium">Link Careers (semua lowongan)</label>
                    <div class="flex gap-2">
                        <InputText :value="careersLink" readonly class="w-full" style="min-width: 300px" />
                        <Button icon="pi pi-copy" severity="secondary" outlined @click="copy(careersLink, 'Link careers tersalin')" :disabled="!careersLink" />
                    </div>
                </div>
            </div>
            <div class="flex-1">
                <div class="flex flex-col gap-2">
                    <label class="text-900 font-medium">Link Apply per-Lowongan</label>
                    <div class="flex gap-2">
                        <InputText :value="applyLink" readonly class="w-full" placeholder="Pilih lowongan dulu..." style="min-width: 300px" />
                        <Button icon="pi pi-copy" severity="secondary" outlined @click="copy(applyLink, 'Link apply tersalin')" :disabled="!applyLink" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Table -->
        <DataTable
            ref="dt"
            v-model:selection="selected"
            :value="visibleRows"
            dataKey="_id"
            :loading="loading"
            :paginator="true"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[10, 20, 50]"
            currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} data"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Data Kandidat</h4>
                    <div class="text-600 text-sm flex items-center gap-2">
                        <i class="pi pi-database" />
                        <span
                            >Total: <span class="font-semibold text-color">{{ visibleRows.length }}</span></span
                        >
                    </div>
                </div>
            </template>

            <Column selectionMode="multiple" headerStyle="width:3rem" :exportable="false" />
            <Column field="fullName" header="Nama" sortable />
            <Column field="jobId.title" header="Lowongan" sortable>
                <template #body="{ data }">{{ data.jobId?.title || '-' }}</template>
            </Column>
            <Column field="email" header="Email" sortable />
            <Column field="stage" header="Stage" sortable>
                <template #body="{ data }">
                    <div class="flex items-center gap-2">
                        <Dropdown v-model="data.stage" :options="STAGES" optionLabel="label" optionValue="value" class="w-10rem" @change="changeStage(data, data.stage)" />
                        <Tag :value="(data.stage || '').toUpperCase()" :severity="stageSeverity(data.stage)" />
                    </div>
                </template>
            </Column>
            <Column field="createdAt" header="Diajukan" sortable>
                <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
            </Column>
            <Column header="Aksi" :exportable="false">
                <template #body="{ data }">
                    <div class="flex flex-wrap gap-2">
                        <Button label="Detail" icon="pi pi-eye" size="small" outlined @click="openDetail(data)" />
                        <Button icon="pi pi-trash" rounded outlined severity="danger" @click="removeCandidate(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="showDetail" :style="{ width: '980px' }" header="Detail Kandidat" :modal="true">
            <div v-if="detail" class="grid">
                <div class="col-12 md:col-6 flex flex-column gap-3 pr-2">
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <div class="text-600 text-sm">Nama</div>
                            <div class="font-medium">{{ detail.fullName }}</div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="text-600 text-sm">Email</div>
                            <div class="font-medium">{{ detail.email }}</div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="text-600 text-sm">Telepon</div>
                            <div class="font-medium">{{ detail.phone || '-' }}</div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="text-600 text-sm">Lowongan</div>
                            <div class="font-medium">{{ detail.jobId?.title || '-' }}</div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="text-600 text-sm">Stage</div>
                            <Tag :value="(detail.stage || '').toUpperCase()" :severity="stageSeverity(detail.stage)" />
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="text-600 text-sm">Diajukan</div>
                            <div class="font-medium">{{ formatDate(detail.createdAt) }}</div>
                        </div>
                        <div class="col-12">
                            <div class="text-600 text-sm">Alamat</div>
                            <div class="font-medium">{{ detail.address || '-' }}</div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="text-600 text-sm">Jenis Kelamin</div>
                            <div class="font-medium">{{ detail.gender || '-' }}</div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="text-600 text-sm">Tanggal Lahir</div>
                            <div class="font-medium">{{ detail.dateOfBirth ? formatDate(detail.dateOfBirth) : '-' }}</div>
                        </div>
                        <div class="col-12">
                            <div class="text-600 text-sm">Cover Letter</div>
                            <div class="font-medium whitespace-pre-line">{{ detail.coverLetter || '-' }}</div>
                        </div>
                        <div class="col-12">
                            <div class="text-600 text-sm">Resume (Buka di tab baru)</div>
                            <div class="font-medium">
                                <a v-if="detail.resumeUrl" :href="resolveResumeUrl(detail.resumeUrl)" target="_blank" rel="noopener">Buka</a>
                                <span v-else>-</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 md:col-6 pl-2">
                    <div class="text-900 font-medium mb-2">Preview CV</div>
                    <div v-if="detail.resumeUrl" class="w-full border-1 surface-border border-round p-2">
                        <template v-if="detectKind(resolveResumeUrl(detail.resumeUrl)) === 'image'">
                            <img :src="resolveResumeUrl(detail.resumeUrl)" alt="CV" class="w-full" style="max-height: 72vh; object-fit: contain" />
                        </template>

                        <template v-else-if="detectKind(resolveResumeUrl(detail.resumeUrl)) === 'pdf'">
                            <iframe :src="resolveResumeUrl(detail.resumeUrl)" class="w-full" style="height: 72vh" title="CV PDF"></iframe>
                        </template>

                        <template v-else>
                            <div class="p-3">
                                <p>Format file tidak dapat di-preview. Silakan unduh di tautan:</p>
                                <a :href="resolveResumeUrl(detail.resumeUrl)" target="_blank" rel="noopener" class="font-medium">Unduh / Buka CV</a>
                            </div>
                        </template>
                    </div>
                    <div v-else class="text-600">Tidak ada CV.</div>
                </div>
            </div>

            <template #footer>
                <Button label="Tutup" icon="pi pi-times" text @click="showDetail = false" />
            </template>
        </Dialog>

        <Dialog v-model:visible="showCV" :style="{ width: '900px' }" header="Preview CV" :modal="true">
            <div v-if="cvUrl" class="w-full">
                <div v-if="cvKind === 'image'" class="w-full">
                    <img :src="cvUrl" alt="CV" class="w-full border-1 surface-border border-round" />
                </div>
                <div v-else-if="cvKind === 'pdf'" class="w-full" style="height: 70vh">
                    <iframe :src="cvUrl" title="CV PDF" class="w-full h-full" />
                </div>
                <div v-else class="p-3 border-1 surface-border border-round">
                    <p>Format file tidak dapat di-preview. Silakan unduh:</p>
                    <a :href="cvUrl" target="_blank" rel="noopener" class="font-medium">Unduh / Buka CV</a>
                </div>
            </div>
            <template #footer>
                <Button label="Tutup" icon="pi pi-times" text @click="showCV = false" />
            </template>
        </Dialog>
    </div>
</template>
