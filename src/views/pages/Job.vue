<script setup>
import { closeJob as closeJobAPI, createJob, deleteJob as deleteJobAPI, listJobs, updateJob } from '@/api/api';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

// ======= utils company from storage =======
function pickCompanyFromStorage() {
    const raw = localStorage.getItem('company') || sessionStorage.getItem('company');
    const obj = raw ? JSON.parse(raw) : {};
    return {
        id: localStorage.getItem('companyId') || obj?.id || obj?._id || obj?.companyId || obj?.company_id || '',
        code: localStorage.getItem('companyCode') || obj?.code || obj?.companyCode || ''
    };
}
const { id: companyId } = pickCompanyFromStorage();

// ======= state =======
const toast = useToast();
const dt = ref(null);
const loading = ref(false);
const jobs = ref([]);
const selectedRows = ref([]);

// filters
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const filterStatus = ref(null); // 'open' | 'closed' | null (semua)
const statusOptions = [
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' }
];

// dialog add/edit
const showDialog = ref(false);
const isEdit = ref(false);
const editingId = ref(null);

const form = ref({
    title: '',
    slug: '',
    department: '',
    employmentType: '',
    location: '',
    description: '',
    requirements: '',
    status: 'open'
});

// dropdown opsi kecil
const employmentTypes = [
    { label: 'Full-time', value: 'Full-time' },
    { label: 'Part-time', value: 'Part-time' },
    { label: 'Contract', value: 'Contract' },
    { label: 'Internship', value: 'Internship' }
];

// ======= helpers =======
function slugify(s) {
    return String(s || '')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}
watch(
    () => form.value.title,
    (v) => {
        if (!isEdit.value) {
            form.value.slug = slugify(v);
        }
    }
);

function resetForm() {
    form.value = {
        title: '',
        slug: '',
        department: '',
        employmentType: '',
        location: '',
        description: '',
        requirements: '',
        status: 'open'
    };
    editingId.value = null;
    isEdit.value = false;
}

function getStatusTag(s) {
    return s === 'open' ? 'success' : 'secondary';
}

function formatDate(d) {
    if (!d) return '-';
    try {
        return new Date(d).toLocaleDateString('id-ID');
    } catch {
        return d;
    }
}

// ======= data =======
async function fetchJobs() {
    loading.value = true;
    try {
        if (!companyId) {
            toast.add({ severity: 'error', summary: 'Perusahaan tidak ditemukan', detail: 'companyId kosong. Silakan login ulang.', life: 3000 });
            return;
        }
        const res = await listJobs({ companyId, status: filterStatus.value || undefined, q: filters.value.global.value || undefined });
        jobs.value = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: err?.response?.data?.error || 'Gagal memuat data jobs', life: 3000 });
    } finally {
        loading.value = false;
    }
}

onMounted(fetchJobs);

// visible rows (tambahan filter di sisi FE supaya responsif meski API sudah filter)
const visibleRows = computed(() => {
    const st = filterStatus.value;
    return (jobs.value || []).filter((j) => {
        const matchStatus = !st || j.status === st;
        return matchStatus;
    });
});

// ======= actions =======
function openNew() {
    resetForm();
    showDialog.value = true;
}

function openEdit(row) {
    isEdit.value = true;
    editingId.value = row._id || row.id;
    form.value = {
        title: row.title || '',
        slug: row.slug || '',
        department: row.department || '',
        employmentType: row.employmentType || '',
        location: row.location || '',
        description: row.description || '',
        requirements: row.requirements || '',
        status: row.status || 'open'
    };
    showDialog.value = true;
}

async function saveJob() {
    if (!form.value.title || !form.value.slug) {
        toast.add({ severity: 'warn', summary: 'Validasi', detail: 'Judul dan Slug wajib diisi', life: 2500 });
        return;
    }
    loading.value = true;
    try {
        if (isEdit.value && editingId.value) {
            await updateJob(editingId.value, { ...form.value });
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Job diperbarui', life: 2000 });
        } else {
            await createJob({ ...form.value, companyId });
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Job ditambahkan', life: 2000 });
        }
        showDialog.value = false;
        await fetchJobs();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: err?.response?.data?.error || 'Gagal menyimpan job', life: 3000 });
    } finally {
        loading.value = false;
    }
}

async function closeJob(row) {
    try {
        await closeJobAPI(row._id || row.id);
        toast.add({ severity: 'success', summary: 'Closed', detail: 'Lowongan ditutup', life: 2000 });
        await fetchJobs();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: err?.response?.data?.error || 'Tidak bisa menutup job', life: 3000 });
    }
}

async function deleteJob(row) {
    try {
        await deleteJobAPI(row._id || row.id);
        toast.add({ severity: 'success', summary: 'Terhapus', detail: 'Lowongan dihapus', life: 2000 });
        await fetchJobs();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: err?.response?.data?.error || 'Tidak bisa menghapus job', life: 3000 });
    }
}

function exportCSV() {
    dt.value?.exportCSV();
}

async function exportExcel() {
    try {
        if (!visibleRows.value?.length) {
            toast.add({ severity: 'warn', summary: 'Tidak ada data', detail: 'Tidak ada data untuk diekspor', life: 2500 });
            return;
        }
        const XLSX = await import('xlsx');
        const rows = visibleRows.value.map((j, i) => ({
            No: i + 1,
            Judul: j.title || '-',
            Slug: j.slug || '-',
            Departemen: j.department || '-',
            'Employment Type': j.employmentType || '-',
            Lokasi: j.location || '-',
            Status: (j.status || '-').toUpperCase(),
            Dibuat: formatDate(j.createdAt)
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const headers = Object.keys(rows[0] || { No: '' });
        ws['!cols'] = headers.map((key) => {
            const maxLen = rows.reduce((acc, r) => Math.max(acc, String(r[key] ?? '').length), key.length);
            return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
        });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Jobs');
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        XLSX.writeFile(wb, `jobs_${yyyy}-${mm}-${dd}.xlsx`);
    } catch {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal ekspor Excel', life: 3000 });
    }
}

// refetch saat filter status / search global berubah (UX cepat)
watch([filterStatus, () => filters.value.global.value], fetchJobs);
</script>

<template>
    <div class="card">
        <!-- Toolbar -->
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Tambah" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
            </template>
            <template #end>
                <div class="flex gap-3">
                    <IconField>
                        <InputIcon><i class="pi pi-search" /></InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Cari (judul/departemen/d)" />
                    </IconField>
                    <div class="w-14rem">
                        <Dropdown v-model="filterStatus" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Semua Status" showClear fluid />
                    </div>
                    <Button label="Export" icon="pi pi-file-excel" severity="success" outlined @click="exportExcel" :disabled="loading || !visibleRows.length" />
                </div>
            </template>
        </Toolbar>

        <!-- DataTable -->
        <DataTable
            ref="dt"
            v-model:selection="selectedRows"
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
                <div class="flex justify-between items-center">
                    <h4 class="m-0">Manajemen Posisi</h4>
                    <div class="text-600 text-sm flex items-center gap-2">
                        <i class="pi pi-database" />
                        <span
                            >Total: <span class="font-semibold text-color">{{ visibleRows.length }}</span></span
                        >
                    </div>
                </div>
            </template>

            <Column field="title" header="Judul" sortable />
            <Column field="department" header="Departemen" sortable />
            <Column field="employmentType" header="Type" sortable />
            <Column field="location" header="Lokasi" sortable />
            <Column field="status" header="Status" sortable>
                <template #body="{ data }">
                    <Tag :value="(data.status || '').toUpperCase()" :severity="getStatusTag(data.status)" />
                </template>
            </Column>
            <Column field="createdAt" header="Dibuat" sortable>
                <template #body="{ data }">
                    {{ formatDate(data.createdAt) }}
                </template>
            </Column>

            <Column :exportable="false" header="Aksi" style="min-width: 14rem">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-1" @click="openEdit(data)" />
                        <Button v-if="data.status === 'open'" label="Close" icon="pi pi-lock" size="small" severity="warning" outlined @click="closeJob(data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="deleteJob(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Dialog Add/Edit -->
        <Dialog v-model:visible="showDialog" :style="{ width: '720px' }" :header="isEdit ? 'Edit Posisi' : 'Tambah Posisi'" :modal="true">
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-8">
                    <div class="flex flex-col gap-3">
                        <div>
                            <label class="block font-bold mb-2">Judul</label>
                            <InputText v-model="form.title" placeholder="Contoh: Digital Marketing" fluid />
                        </div>
                        <div>
                            <label class="block font-bold mb-2">Slug</label>
                            <InputText v-model="form.slug" placeholder="digital-marketing" fluid />
                        </div>
                        <div class="grid grid-cols-12 gap-3">
                            <div class="col-span-12 md:col-span-6">
                                <label class="block font-bold mb-2">Departemen</label>
                                <InputText v-model="form.department" placeholder="Marketing" fluid />
                            </div>
                            <div class="col-span-12 md:col-span-6">
                                <label class="block font-bold mb-2">Employment Type</label>
                                <Dropdown v-model="form.employmentType" :options="employmentTypes" optionLabel="label" optionValue="value" placeholder="Pilih tipe" fluid />
                            </div>
                        </div>
                        <div>
                            <label class="block font-bold mb-2">Lokasi</label>
                            <InputText v-model="form.location" placeholder="Jakarta / Remote" fluid />
                        </div>
                        <div>
                            <label class="block font-bold mb-2">Deskripsi</label>
                            <Textarea v-model="form.description" rows="4" autoResize placeholder="Tugas, tanggung jawab…" fluid />
                        </div>
                        <div>
                            <label class="block font-bold mb-2">Requirements</label>
                            <Textarea v-model="form.requirements" rows="4" autoResize placeholder="Kualifikasi, pengalaman…" fluid />
                        </div>
                    </div>
                </div>

                <div class="col-span-12 md:col-span-4">
                    <div class="surface-section p-3 border-1 surface-border border-round flex flex-col gap-3">
                        <div>
                            <label class="block font-bold mb-2">Status</label>
                            <Dropdown v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Status" fluid />
                        </div>
                        <div class="text-600 text-sm">
                            <ul class="m-0 pl-3 list-disc">
                                <li><b>Slug</b> digunakan untuk URL publik.</li>
                                <li><b>Close</b> akan menyembunyikan dari halaman rekrutmen publik.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="showDialog = false" />
                <Button :label="isEdit ? 'Simpan Perubahan' : 'Simpan'" icon="pi pi-check" :loading="loading" @click="saveJob" />
            </template>
        </Dialog>
    </div>
</template>
