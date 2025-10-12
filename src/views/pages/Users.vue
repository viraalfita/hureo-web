<script setup>
import { deleteUser as deleteUserAPI, getUsersByCompany, registerAdmin, registerEmployee } from '@/api/api';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

// ======= state & refs =======
const toast = useToast();
const dt = ref(null);

function pickCompanyFromStorage() {
    const raw = localStorage.getItem('company') || sessionStorage.getItem('company');
    const obj = raw ? JSON.parse(raw) : {};
    return {
        id: localStorage.getItem('companyId') || obj?.id || obj?._id || obj?.companyId || obj?.company_id || '',
        code: localStorage.getItem('companyCode') || obj?.code || obj?.companyCode || ''
    };
}
const { id: companyId, code: companyCode } = pickCompanyFromStorage();

const users = ref([]);
const loading = ref(false);

// filters (global search + role)
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const filterRole = ref(null); // null = semua

// selection (opsional bulk delete)
const selectedUsers = ref([]);

// add/edit (kita pakai add aja sesuai kebutuhan kamu)
const showAddModal = ref(false);
const username = ref('');
const password = ref('');
const selectedRole = ref('employee');
const roleOptions = [
    { label: 'Employee', value: 'employee' },
    { label: 'Admin', value: 'admin' }
];

// confirm dialogs
const deleteDialog = ref(false);
const deleteTarget = ref(null);
const deleteSelectedDialog = ref(false);

// ======= computed =======
const dynamicRoleOptions = computed(() => {
    const roles = new Set((users.value || []).map((u) => u.role || 'employee'));
    return Array.from(roles).map((r) => ({
        label: r.charAt(0).toUpperCase() + r.slice(1),
        value: r
    }));
});

// Note: pencarian global ditangani DataTable via `filters`.
// Filter peran kita terapkan di computed ini.
const visibleRows = computed(() => {
    const roleF = filterRole.value;
    return (users.value || []).filter((u) => {
        const currentRole = u.role || 'employee';
        const matchRole = !roleF || currentRole === roleF;
        return matchRole;
    });
});

// ======= lifecycle =======
onMounted(fetchUsers);

// ======= methods =======
async function fetchUsers() {
    loading.value = true;
    try {
        if (!companyId) {
            toast.add({ severity: 'error', summary: 'Data perusahaan tidak ditemukan', detail: 'Silakan login ulang (companyId kosong).', life: 3000 });
            return;
        }

        const res = await getUsersByCompany(companyId);
        users.value = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: err?.response?.data?.error || 'Gagal memuat data pengguna', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function openNew() {
    username.value = '';
    password.value = '';
    selectedRole.value = 'employee';
    showAddModal.value = true;
}

function hideAddDialog() {
    showAddModal.value = false;
}

async function saveUser() {
    loading.value = true;
    try {
        if (selectedRole.value === 'admin') {
            await registerAdmin({ username: username.value, password: password.value, companyCode });
        } else {
            await registerEmployee({ username: username.value, password: password.value, companyCode });
        }
        showAddModal.value = false;
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pengguna ditambahkan', life: 3000 });
        await fetchUsers();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: err?.response?.data?.error || 'Gagal menambah pengguna', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function confirmDeleteUser(row) {
    deleteTarget.value = row;
    deleteDialog.value = true;
}

async function deleteUser() {
    if (!deleteTarget.value) return;
    try {
        await deleteUserAPI(deleteTarget.value._id || deleteTarget.value.id);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pengguna dihapus', life: 3000 });
        await fetchUsers();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: err?.response?.data?.error || 'Gagal menghapus pengguna', life: 3000 });
    } finally {
        deleteDialog.value = false;
        deleteTarget.value = null;
    }
}

function confirmDeleteSelected() {
    if (!selectedUsers.value?.length) return;
    deleteSelectedDialog.value = true;
}

async function deleteSelectedUsers() {
    try {
        const list = [...selectedUsers.value];
        for (const u of list) {
            await deleteUserAPI(u._id || u.id);
        }
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pengguna terpilih dihapus', life: 3000 });
        selectedUsers.value = [];
        await fetchUsers();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: err?.response?.data?.error || 'Gagal menghapus beberapa pengguna', life: 3000 });
    } finally {
        deleteSelectedDialog.value = false;
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
        const rows = visibleRows.value.map((u, idx) => ({
            No: idx + 1,
            Username: u.username || '-',
            Peran: (u.role || 'employee').toUpperCase()
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const headers = Object.keys(rows[0] || { No: '' });
        ws['!cols'] = headers.map((key) => {
            const maxLen = rows.reduce((acc, row) => {
                const val = row[key] != null ? String(row[key]) : '';
                return Math.max(acc, val.length);
            }, key.length);
            return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pengguna');

        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        XLSX.writeFile(wb, `daftar-pengguna_${yyyy}-${mm}-${dd}.xlsx`);
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal ekspor Excel', life: 3000 });
    }
}

function getRoleTag(role) {
    return 'info';
}
</script>

<template>
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="Tambah" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                <Button label="Hapus Terpilih" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedUsers || !selectedUsers.length" />
            </template>

            <template #end>
                <div class="flex gap-2">
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Cari username..." />
                    </IconField>

                    <div class="w-14rem">
                        <Dropdown v-model="filterRole" :options="dynamicRoleOptions.length ? dynamicRoleOptions : roleOptions" optionLabel="label" optionValue="value" placeholder="Semua Peran" showClear fluid />
                    </div>
                    <Button label="Export" icon="pi pi-file-excel" severity="success" outlined @click="exportExcel" :disabled="loading || !visibleRows.length" />
                </div>
            </template>
        </Toolbar>

        <DataTable
            ref="dt"
            v-model:selection="selectedUsers"
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
                    <h4 class="m-0">Manajemen Pengguna</h4>
                    <div class="text-600 text-sm flex items-center gap-2">
                        <i class="pi pi-database" />
                        <span
                            >Total: <span class="font-semibold text-color">{{ visibleRows.length }}</span></span
                        >
                    </div>
                </div>
            </template>

            <Column selectionMode="multiple" headerStyle="width:3rem" :exportable="false" />

            <Column field="username" header="Username" sortable />
            <Column field="role" header="Peran" sortable>
                <template #body="{ data }">
                    <Tag :value="data.role || 'employee'" :severity="getRoleTag(data.role)" />
                </template>
            </Column>

            <Column :exportable="false" header="Aksi" style="width: 10rem">
                <template #body="{ data }">
                    <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteUser(data)" />
                </template>
            </Column>
        </DataTable>

        <!-- Dialog Tambah -->
        <Dialog v-model:visible="showAddModal" :style="{ width: '450px' }" header="Tambah Pengguna" :modal="true">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="username" class="block font-bold mb-2">Username</label>
                    <InputText id="username" v-model="username" placeholder="Masukkan username" fluid />
                </div>
                <div>
                    <label for="password" class="block font-bold mb-2">Password</label>
                    <Password id="password" v-model="password" :feedback="false" toggleMask fluid />
                </div>
                <div>
                    <label for="role" class="block font-bold mb-2">Peran</label>
                    <Select id="role" v-model="selectedRole" :options="roleOptions" optionLabel="label" optionValue="value" placeholder="Pilih peran" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideAddDialog" />
                <Button label="Simpan" icon="pi pi-check" :loading="loading" @click="saveUser" />
            </template>
        </Dialog>

        <!-- Dialog Konfirmasi Hapus single -->
        <Dialog v-model:visible="deleteDialog" :style="{ width: '420px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-3">
                <i class="pi pi-exclamation-triangle !text-3xl"></i>
                <span v-if="deleteTarget"
                    >Hapus pengguna <b>{{ deleteTarget.username }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteDialog = false" />
                <Button label="Ya" icon="pi pi-check" severity="danger" @click="deleteUser" />
            </template>
        </Dialog>

        <!-- Dialog Konfirmasi Hapus terpilih -->
        <Dialog v-model:visible="deleteSelectedDialog" :style="{ width: '420px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-3">
                <i class="pi pi-exclamation-triangle !text-3xl"></i>
                <span>Hapus semua pengguna terpilih?</span>
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteSelectedDialog = false" />
                <Button label="Ya" icon="pi pi-check" severity="danger" @click="deleteSelectedUsers" />
            </template>
        </Dialog>
    </div>
</template>
