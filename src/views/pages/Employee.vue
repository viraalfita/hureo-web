<script setup>
import { createEmployee, deleteEmployee, listEmployees, updateEmployee } from '@/api/api';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

// ======= helpers: ambil company dari storage =======
function pickCompanyFromStorage() {
    const raw = localStorage.getItem('company') || sessionStorage.getItem('company');
    const obj = raw ? JSON.parse(raw) : {};
    return {
        id: localStorage.getItem('companyId') || obj?.id || obj?._id || obj?.companyId || '',
        code: localStorage.getItem('companyCode') || obj?.code || obj?.companyCode || ''
    };
}
const { id: companyId } = pickCompanyFromStorage();

const toast = useToast();
const dt = ref(null);

// ======= state =======
const loading = ref(false);
const rows = ref([]);

// filter/search
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const fDepartment = ref(null);
const fStatus = ref(null);
const fEmployment = ref(null);

const STATUS_OPTIONS = [
    { label: 'Active', value: 'active' },
    { label: 'On Leave', value: 'onleave' },
    { label: 'Resigned', value: 'resigned' }
];
const EMPLOYMENT_OPTIONS = [
    { label: 'Full-time', value: 'fulltime' },
    { label: 'Part-time', value: 'parttime' },
    { label: 'Contract', value: 'contract' },
    { label: 'Intern', value: 'intern' }
];

// ======= create / edit dialog =======
const showForm = ref(false);
const isEdit = ref(false);
const form = ref({
    _id: null,
    fullName: '',
    email: '',
    phone: '',
    address: '',
    gender: '', // male|female|other
    dateOfBirth: null, // Date
    position: '',
    department: '',
    employmentType: '',
    hireDate: null, // Date
    status: 'active',
    resumeUrl: '',
    source: 'recruitment'
});
const genderOptions = [
    { label: 'Pria', value: 'male' },
    { label: 'Wanita', value: 'female' },
    { label: 'Lainnya', value: 'other' }
];

// confirm delete
const confirmDeleteDialog = ref(false);
const deleteTarget = ref(null);

// ======= computed =======
const departmentsDynamic = computed(() => {
    const set = new Set((rows.value || []).map((r) => r.department).filter(Boolean));
    return Array.from(set).map((d) => ({ label: d, value: d }));
});

// FE filter ringan (server juga mendukung query)
const visibleRows = computed(() => {
    const dep = fDepartment.value;
    const st = fStatus.value;
    const emp = fEmployment.value;

    return (rows.value || []).filter((r) => {
        const okDep = !dep || r.department === dep;
        const okSt = !st || r.status === st;
        const okEmp = !emp || r.employmentType === emp;
        return okDep && okSt && okEmp;
    });
});

function formatDate(d) {
    if (!d) return '-';
    try {
        return new Date(d).toLocaleDateString('id-ID');
    } catch {
        return d;
    }
}

// ======= fetch =======
async function fetchEmployees() {
    loading.value = true;
    try {
        const res = await listEmployees({
            companyId,
            department: fDepartment.value || undefined,
            status: fStatus.value || undefined,
            employmentType: fEmployment.value || undefined,
            q: filters.value.global.value || undefined
        });
        rows.value = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: err?.response?.data?.error || 'Gagal memuat karyawan', life: 3000 });
    } finally {
        loading.value = false;
    }
}
onMounted(fetchEmployees);

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
            Alamat: row.address || '-',
            'Jenis Kelamin': row.gender === 'male' ? 'Pria' : row.gender === 'female' ? 'Wanita' : row.gender || '-',
            'Tanggal Lahir': formatDate(row.dateOfBirth),
            Posisi: row.position || '-',
            Departemen: row.department || '-',
            'Tipe Karyawan': row.employmentType || '-',
            'Tanggal Masuk': formatDate(row.hireDate),
            Status: row.status === 'active' ? 'Aktif' : row.status === 'onleave' ? 'Cuti' : row.status === 'resigned' ? 'Resign' : row.status || '-',
            'URL Resume': row.resumeUrl || '-'
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
        XLSX.utils.book_append_sheet(wb, ws, 'Data Karyawan');

        // Format nama file
        const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const suffix = fmt(new Date());

        XLSX.writeFile(wb, `data_karyawan_${suffix}.xlsx`);

        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data karyawan berhasil diekspor ke Excel', life: 3000 });
    } catch (err) {
        console.error('Export error:', err);
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal mengekspor data ke Excel', life: 3000 });
    }
}

// auto-refetch saat filter/search berubah (sederhana)
watch([fDepartment, fStatus, fEmployment, () => filters.value.global.value], fetchEmployees);

// ======= actions =======
function openCreate() {
    isEdit.value = false;
    form.value = {
        _id: null,
        fullName: '',
        email: '',
        phone: '',
        address: '',
        gender: '',
        dateOfBirth: null,
        position: '',
        department: '',
        employmentType: '',
        hireDate: null,
        status: 'active',
        resumeUrl: '',
        source: 'recruitment'
    };
    showForm.value = true;
}

function openEdit(row) {
    isEdit.value = true;
    form.value = {
        _id: row._id,
        fullName: row.fullName || '',
        email: row.email || '',
        phone: row.phone || '',
        address: row.address || '',
        gender: row.gender || '',
        dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
        position: row.position || '',
        department: row.department || '',
        employmentType: row.employmentType || '',
        hireDate: row.hireDate ? new Date(row.hireDate) : null,
        status: row.status || 'active',
        resumeUrl: row.resumeUrl || '',
        source: row.source || 'recruitment'
    };
    showForm.value = true;
}

async function submitForm() {
    if (!form.value.fullName || !form.value.email) {
        toast.add({ severity: 'warn', summary: 'Nama & email wajib', life: 2000 });
        return;
    }
    try {
        const payload = {
            companyId,
            ...form.value,
            dateOfBirth: form.value.dateOfBirth || null,
            hireDate: form.value.hireDate || null
        };
        if (isEdit.value && form.value._id) {
            await updateEmployee(form.value._id, payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data karyawan diperbarui', life: 2000 });
        } else {
            await createEmployee(payload);
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Karyawan ditambahkan', life: 2000 });
        }
        showForm.value = false;
        await fetchEmployees();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: err?.response?.data?.error || 'Tidak bisa menyimpan', life: 3000 });
    }
}

function confirmDelete(row) {
    deleteTarget.value = row;
    confirmDeleteDialog.value = true;
}
async function doDelete() {
    if (!deleteTarget.value) return;
    try {
        await deleteEmployee(deleteTarget.value._id, { companyId });
        toast.add({ severity: 'success', summary: 'Terhapus', life: 1500 });
        await fetchEmployees();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: err?.response?.data?.error || 'Tidak bisa menghapus', life: 3000 });
    } finally {
        confirmDeleteDialog.value = false;
        deleteTarget.value = null;
    }
}

function severityByStatus(s) {
    switch (s) {
        case 'active':
            return 'success';
        case 'onleave':
            return 'warn';
        case 'resigned':
            return 'danger';
        default:
            return 'info';
    }
}
</script>

<template>
    <div class="card">
        <!-- Toolbar -->
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Tambah" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openCreate" />
            </template>
            <template #end>
                <div class="flex gap-2">
                    <IconField>
                        <InputIcon><i class="pi pi-search" /></InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Cari nama/email/telepon/posisi/departemen..." />
                    </IconField>

                    <div class="w-14rem">
                        <Dropdown v-model="fDepartment" :options="departmentsDynamic" optionLabel="label" optionValue="value" placeholder="Semua Departemen" showClear fluid />
                    </div>
                    <div class="w-14rem">
                        <Dropdown v-model="fEmployment" :options="EMPLOYMENT_OPTIONS" optionLabel="label" optionValue="value" placeholder="Semua Tipe" showClear fluid />
                    </div>
                    <div class="w-12rem">
                        <Dropdown v-model="fStatus" :options="STATUS_OPTIONS" optionLabel="label" optionValue="value" placeholder="Semua Status" showClear fluid />
                    </div>
                    <Button label="Export" icon="pi pi-file-excel" severity="success" outlined :disabled="loading || !visibleRows.length" @click="exportExcel" />
                </div>
            </template>
        </Toolbar>

        <!-- Table -->
        <DataTable
            ref="dt"
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
                    <h4 class="m-0">Data Karyawan</h4>
                    <div class="text-600 text-sm flex items-center gap-2">
                        <i class="pi pi-database" />
                        <span
                            >Total: <span class="font-semibold text-color">{{ visibleRows.length }}</span></span
                        >
                    </div>
                </div>
            </template>

            <Column field="fullName" header="Nama" sortable />
            <Column field="email" header="Email" sortable />
            <Column field="phone" header="Telepon" />
            <Column field="position" header="Posisi" sortable />
            <Column field="department" header="Departemen" sortable />
            <Column field="employmentType" header="Tipe" sortable>
                <template #body="{ data }">
                    <Tag :value="(data.employmentType || '').toUpperCase()" severity="secondary" />
                </template>
            </Column>
            <Column field="hireDate" header="Tgl Masuk" sortable>
                <template #body="{ data }">{{ formatDate(data.hireDate) }}</template>
            </Column>
            <Column field="status" header="Status" sortable>
                <template #body="{ data }">
                    <Tag :value="(data.status || '').toUpperCase()" :severity="severityByStatus(data.status)" />
                </template>
            </Column>
            <Column header="Aksi" :exportable="false" style="min-width: 12rem">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" outlined rounded @click="openEdit(data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Dialog Form (Create/Edit) -->
        <Dialog v-model:visible="showForm" :style="{ width: '720px' }" :header="isEdit ? 'Ubah Karyawan' : 'Tambah Karyawan'" :modal="true">
            <div class="grid">
                <div class="col-12 md:col-6">
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Nama</label>
                        <InputText v-model="form.fullName" placeholder="Nama lengkap" />
                    </div>
                </div>
                <div class="col-12 md:col-6">
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Email</label>
                        <InputText v-model="form.email" placeholder="email@domain.com" />
                    </div>
                </div>

                <div class="col-12 md:col-6">
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Telepon</label>
                        <InputText v-model="form.phone" placeholder="08xxxx" />
                    </div>
                </div>
                <div class="col-12 md:col-6">
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Jenis Kelamin</label>
                        <Dropdown v-model="form.gender" :options="genderOptions" optionLabel="label" optionValue="value" placeholder="Pilih" showClear fluid />
                    </div>
                </div>

                <div class="col-12">
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Alamat</label>
                        <Textarea v-model="form.address" rows="2" autoResize placeholder="Alamat lengkap" />
                    </div>
                </div>

                <div class="col-12 md:col-6">
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Tanggal Lahir</label>
                        <Calendar v-model="form.dateOfBirth" dateOnly showIcon placeholder="Pilih tanggal" class="w-full" />
                    </div>
                </div>
                <div class="col-12 md:col-6">
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Tanggal Masuk</label>
                        <Calendar v-model="form.hireDate" dateOnly showIcon placeholder="Pilih tanggal" class="w-full" />
                    </div>
                </div>

                <div class="col-12 md:col-6">
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Posisi</label>
                        <InputText v-model="form.position" placeholder="Contoh: Frontend Engineer" />
                    </div>
                </div>
                <div class="col-12 md:col-6">
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Departemen</label>
                        <InputText v-model="form.department" placeholder="Contoh: Engineering" />
                    </div>
                </div>

                <div class="col-12 md:col-6">
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Tipe Karyawan</label>
                        <Dropdown
                            v-model="form.employmentType"
                            :options="[
                                { label: 'Full-time', value: 'Full-time' },
                                { label: 'Part-time', value: 'Part-time' },
                                { label: 'Contract', value: 'Contract' },
                                { label: 'Internship', value: 'Internship' }
                            ]"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Pilih tipe"
                            showClear
                            fluid
                        />
                    </div>
                </div>
                <div class="col-12 md:col-6">
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Status</label>
                        <Dropdown v-model="form.status" :options="STATUS_OPTIONS" optionLabel="label" optionValue="value" placeholder="Pilih status" showClear fluid />
                    </div>
                </div>

                <div class="col-12">
                    <div class="flex flex-col gap-2">
                        <label class="font-medium">Resume URL (opsional)</label>
                        <InputText v-model="form.resumeUrl" placeholder="/uploads/resumes/xxx.pdf atau https://..." />
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="showForm = false" />
                <Button :label="isEdit ? 'Simpan Perubahan' : 'Simpan'" icon="pi pi-check" @click="submitForm" />
            </template>
        </Dialog>

        <!-- Dialog konfirmasi hapus -->
        <Dialog v-model:visible="confirmDeleteDialog" :style="{ width: '420px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-3">
                <i class="pi pi-exclamation-triangle !text-3xl"></i>
                <span v-if="deleteTarget"
                    >Hapus karyawan <b>{{ deleteTarget.fullName }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="confirmDeleteDialog = false" />
                <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="doDelete" />
            </template>
        </Dialog>
    </div>
</template>
