<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

// ==== API (SESUAIKAN PATH) ====
import { cancelLeave as cancelLeaveAPI, getAllLeaves, getUsersByCompany, updateLeaveStatus } from '@/api/api';

// ==== STATE DASAR ====
const toast = useToast();
const dt = ref();

const loading = ref(false);
const companyId = localStorage.getItem('companyId');

const leaves = ref([]);
const users = ref([]);

const dateRange = ref(null); // Array [startDate, endDate] untuk range picker
const filterUser = ref(null); // userId string
const filterStatus = ref(null); // 'pending' | 'approved' | 'declined' | 'canceled'

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const confirmCancelDialog = ref(false);
const pendingCancelRow = ref(null);

const statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Declined', value: 'declined' },
    { label: 'Canceled', value: 'canceled' }
];

const userOptions = computed(() =>
    (users.value || []).map((u) => ({
        label: u.username || u.name || '(tanpa nama)',
        value: String(u._id || u.id)
    }))
);

// ==== HELPERS ====
function getId(row) {
    return row?._id || row?.id;
}

function formatDate(d) {
    if (!d) return '-';
    try {
        return new Date(d).toLocaleDateString('id-ID');
    } catch {
        return d;
    }
}

function getUsername(row) {
    return row?.user?.username || '-';
}

function statusSeverity(s) {
    switch (String(s || '').toLowerCase()) {
        case 'approved':
            return 'success';
        case 'declined':
            return 'danger';
        case 'canceled':
            return 'secondary';
        case 'pending':
        default:
            return 'info';
    }
}

// ==== FETCH ====
async function fetchAll() {
    loading.value = true;
    try {
        const [leavesRes, usersRes] = await Promise.all([getAllLeaves(), getUsersByCompany(companyId)]);

        const raw = Array.isArray(leavesRes?.data) ? leavesRes.data : [];
        leaves.value = raw.map((l) => ({
            ...l,
            _localStatus: l.status || 'pending'
        }));

        users.value = Array.isArray(usersRes?.data) ? usersRes.data : [];
    } catch (err) {
        console.error(err);
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat data', life: 3000 });
    } finally {
        loading.value = false;
    }
}

onMounted(fetchAll);

async function exportExcel() {
    try {
        if (!visibleRows.value.length) {
            toast.add({ severity: 'warn', summary: 'Tidak ada data', detail: 'Tidak ada data untuk diekspor.', life: 2500 });
            return;
        }

        const XLSX = await import('xlsx');
        const data = visibleRows.value.map((row, idx) => ({
            No: idx + 1,
            Karyawan: getUsername(row),
            Tipe: (row.type || 'leave').toUpperCase(),
            Mulai: formatDate(row.startDate || row.start || row.from),
            Selesai: formatDate(row.endDate || row.end || row.to),
            Alasan: row.reason || '-',
            Status: (row._localStatus || row.status || 'pending').toUpperCase()
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const headers = Object.keys(data[0] || { No: '' });

        ws['!cols'] = headers.map((key) => {
            const maxLen = data.reduce((acc, row) => {
                const val = row[key] != null ? String(row[key]) : '';
                return Math.max(acc, val.length);
            }, key.length);
            return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data Cuti');

        // Format nama file sesuai filter
        const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        let suffix = fmt(new Date());

        if (dateRange.value && dateRange.value.length === 2) {
            const [start, end] = dateRange.value;
            const sStr = start ? fmt(new Date(start)) : 'ALL';
            const eStr = end ? fmt(new Date(end)) : 'ALL';
            suffix = `${sStr}_to_${eStr}`;
        }

        XLSX.writeFile(wb, `data_cuti_${suffix}.xlsx`);

        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data berhasil diekspor ke Excel', life: 3000 });
    } catch (err) {
        console.error('Export error:', err);
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal mengekspor data ke Excel', life: 3000 });
    }
}

function toStartOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
}
function toEndOfDay(d) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x.getTime();
}

const visibleRows = computed(() => {
    const range = dateRange.value;
    const startMs = range && range[0] ? toStartOfDay(range[0]) : null;
    const endMs = range && range[1] ? toEndOfDay(range[1]) : null;

    const uid = filterUser.value ? String(filterUser.value) : null;
    const st = filterStatus.value ? String(filterStatus.value).toLowerCase() : null;

    const q = (filters.value.global.value || '').toString().toLowerCase().trim();

    return (leaves.value || []).filter((row) => {
        const begin = new Date(row.startDate || row.start || row.from).getTime();
        const finish = new Date(row.endDate || row.end || row.to || row.startDate || row.start || row.from).getTime();

        if (startMs !== null && finish < startMs) return false;
        if (endMs !== null && begin > endMs) return false;

        // User
        const thisUserId = String(row?.user?._id || row?.user?.id || row?.userId || '');
        if (uid && thisUserId !== uid && row?.user?.username !== uid) return false;

        // Status
        const curStatus = String(row._localStatus || row.status || 'pending').toLowerCase();
        if (st && curStatus !== st) return false;

        // Global search (username, reason, type, dates)
        if (q) {
            const hay = [getUsername(row), row?.reason, row?.type, curStatus, formatDate(row.startDate || row.start || row.from), formatDate(row.endDate || row.end || row.to)].join(' ').toLowerCase();

            if (!hay.includes(q)) return false;
        }

        return true;
    });
});

async function saveStatus(row, next) {
    const id = getId(row);
    if (!id) return;

    try {
        await updateLeaveStatus(id, next);
        row.status = next;
        row._localStatus = next;
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Status diperbarui', life: 2500 });
    } catch (err) {
        row._localStatus = row.status || 'pending';
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Tidak bisa update status', life: 3000 });
    }
}

function onChangeStatus(row) {
    return saveStatus(row, row._localStatus);
}

function quickSetStatus(row, s) {
    row._localStatus = s;
    return saveStatus(row, s);
}

function askCancel(row) {
    pendingCancelRow.value = row;
    confirmCancelDialog.value = true;
}

async function doCancelSingle() {
    try {
        await cancelLeaveAPI(getId(pendingCancelRow.value));
        confirmCancelDialog.value = false;
        pendingCancelRow.value = null;
        await fetchAll();
        toast.add({ severity: 'success', summary: 'Dibatalkan', detail: 'Pengajuan dibatalkan', life: 2500 });
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Tidak bisa membatalkan', life: 3000 });
    }
}

function setTodayRange() {
    const today = new Date();
    dateRange.value = [today, today];
}

function setThisWeekRange() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    dateRange.value = [startOfWeek, endOfWeek];
}

function setThisMonthRange() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    dateRange.value = [startOfMonth, endOfMonth];
}
</script>

<template>
    <div class="card">
        <div class="mb-4">
            <Button label="Refresh" icon="pi pi-refresh" severity="secondary" :loading="loading" @click="fetchAll" />
        </div>

        <Toolbar class="mb-6">
            <template #start>
                <div class="flex flex-wrap items-center gap-3">
                    <div class="filter-item">
                        <IconField>
                            <InputIcon><i class="pi pi-search" /></InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Cari..." aria-label="Pencarian" style="min-width: 200px" />
                        </IconField>
                    </div>

                    <div class="filter-item">
                        <Calendar
                            v-model="dateRange"
                            selectionMode="range"
                            :manualInput="false"
                            dateFormat="dd/mm/yy"
                            placeholder="Rentang tanggal"
                            showIcon
                            showButtonBar
                            class="w-full md:w-16rem"
                            :pt="{
                                input: { style: 'min-width: 140px' }
                            }"
                        >
                            <template #footer>
                                <div class="flex flex-col gap-2 mt-2">
                                    <div class="flex justify-between gap-2">
                                        <Button type="button" label="Hari Ini" text size="small" @click="setTodayRange" />
                                        <Button type="button" label="Minggu Ini" text size="small" @click="setThisWeekRange" />
                                        <Button type="button" label="Bulan Ini" text size="small" @click="setThisMonthRange" />
                                    </div>
                                    <Button type="button" label="Bersihkan" text size="small" severity="secondary" @click="dateRange = null" />
                                </div>
                            </template>
                        </Calendar>
                    </div>

                    <div class="filter-item">
                        <Dropdown v-model="filterUser" :options="userOptions" optionLabel="label" optionValue="value" placeholder="Semua Karyawan" showClear style="min-width: 180px" />
                    </div>

                    <div class="filter-item">
                        <Dropdown v-model="filterStatus" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Semua Status" showClear style="min-width: 150px" />
                    </div>
                </div>
            </template>

            <template #end>
                <div class="flex gap-2">
                    <Button label="Export" icon="pi pi-file-excel" severity="success" outlined :disabled="loading || !visibleRows.length" @click="exportExcel" />
                </div>
            </template>
        </Toolbar>

        <DataTable
            ref="dt"
            :value="visibleRows"
            dataKey="_id"
            :loading="loading"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 20, 50]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} data"
            :filters="filters"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Manajemen Cuti</h4>
                    <div class="text-600 text-sm flex items-center gap-2">
                        <i class="pi pi-database" />
                        <span
                            >Total: <span class="font-semibold text-color">{{ visibleRows.length }}</span></span
                        >
                    </div>
                </div>
            </template>

            <Column field="user.username" header="Karyawan" sortable>
                <template #body="{ data }">{{ getUsername(data) }}</template>
            </Column>

            <Column field="type" header="Tipe" sortable>
                <template #body="{ data }">
                    <Tag :value="(data.type || 'leave').toUpperCase()" severity="info" />
                </template>
            </Column>

            <Column field="startDate" header="Mulai" sortable>
                <template #body="{ data }">{{ formatDate(data.startDate || data.start || data.from) }}</template>
            </Column>

            <Column field="endDate" header="Selesai" sortable>
                <template #body="{ data }">{{ formatDate(data.endDate || data.end || data.to) }}</template>
            </Column>

            <Column field="reason" header="Alasan">
                <template #body="{ data }">
                    <span class="truncate">{{ data.reason || '-' }}</span>
                </template>
            </Column>

            <Column field="status" header="Status" sortable>
                <template #body="{ data }">
                    <div class="flex align-items-center gap-2">
                        <Dropdown v-model="data._localStatus" :options="statusOptions" optionLabel="label" optionValue="value" class="w-10rem" @change="onChangeStatus(data)" />
                        <Tag :value="(data._localStatus || data.status || 'pending').toUpperCase()" :severity="statusSeverity(data._localStatus || data.status)" />
                    </div>
                </template>
            </Column>

            <Column :exportable="false" style="min-width: 14rem" header="Aksi">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button label="Approve" icon="pi pi-check" size="small" severity="success" outlined @click="quickSetStatus(data, 'approved')" :disabled="(data._localStatus || data.status) === 'approved'" />
                        <Button label="Decline" icon="pi pi-times" size="small" severity="danger" outlined @click="quickSetStatus(data, 'declined')" :disabled="(data._localStatus || data.status) === 'declined'" />
                        <Button icon="pi pi-trash" text rounded severity="secondary" v-tooltip.top="'Batalkan pengajuan'" @click="askCancel(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Dialog konfirmasi batalkan (single) -->
        <Dialog v-model:visible="confirmCancelDialog" :style="{ width: '420px' }" header="Konfirmasi" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-red-500 text-3xl" />
                <span>Yakin ingin membatalkan pengajuan ini?</span>
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="confirmCancelDialog = false" />
                <Button label="Ya, Batalkan" icon="pi pi-check" severity="danger" @click="doCancelSingle" />
            </template>
        </Dialog>
    </div>
</template>
