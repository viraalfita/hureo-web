<script setup>
import { getAllAttendanceByCompany, getUsersByCompany } from '@/api/api';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

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
const { id: companyId } = pickCompanyFromStorage();

// ===== state =====
const loading = ref(false);
const attendance = ref([]); // raw
const users = ref([]); // raw

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const dateRange = ref(null);
const selectedUser = ref(null);

// dropdown options
const userOptions = computed(() =>
    (users.value || []).map((u) => ({
        label: u.username || u.name || '(tanpa nama)',
        value: String(u._id || u.id)
    }))
);

// ===== helpers =====
const getUsername = (r) =>
    r?.employee?.fullName ||
    r?.user?.fullName ||
    r?.userId?.fullName ||
    r?.user?.username ||
    r?.userId?.username ||
    r?.username ||
    r?.employee?.email ||
    '(tanpa nama)';
const getUserId = (r) => String(r?.userId?._id || r?.user?._id || r?.userId || r?.user || '');
const getTimestamp = (r) => r?.timestamp || r?.time || r?.createdAt || r?.updatedAt || null;

function formatDate(dateLike) {
    if (!dateLike) return '-';
    try {
        return new Date(dateLike).toLocaleString('id-ID');
    } catch {
        return String(dateLike);
    }
}
const withSearchKey = computed(() =>
    (attendance.value || []).map((r, i) => {
        const username = getUsername(r);
        const type = (r?.type || '-').toUpperCase();
        const status = r?.status || (r?.late ? 'Late' : 'On time');
        const time = getTimestamp(r);
        return {
            __idx: i,
            __search: [username, type, status, formatDate(time)].join(' | '),
            _id: r?._id || r?.id || i,
            raw: r,
            username,
            type,
            status,
            time,
            late: !!r?.late,
            location: r?.location
        };
    })
);
function normalizeRange() {
    let startMs = null,
        endMs = null;

    if (dateRange.value && Array.isArray(dateRange.value) && dateRange.value.length === 2) {
        const [start, end] = dateRange.value;

        if (start instanceof Date && !isNaN(start)) {
            const s = new Date(start);
            s.setHours(0, 0, 0, 0);
            startMs = s.getTime();
        }

        if (end instanceof Date && !isNaN(end)) {
            const e = new Date(end);
            e.setHours(23, 59, 59, 999);
            endMs = e.getTime();
        }
    }

    return { startMs, endMs };
}

const visibleRows = computed(() => {
    const { startMs, endMs } = normalizeRange();
    return withSearchKey.value.filter((r) => {
        // filter user
        if (selectedUser.value && getUserId(r.raw) !== String(selectedUser.value)) return false;

        // filter tanggal dengan range
        const t = new Date(r.time).getTime();
        if (Number.isNaN(t)) return false;
        if (startMs !== null && t < startMs) return false;
        if (endMs !== null && t > endMs) return false;

        return true;
    });
});

function viewDetails(row) {
    selectedDetail.value = row;
    detailDialog.value = true;
}

// ===== dialogs =====
const detailDialog = ref(false);
const selectedDetail = ref(null);

// ===== data fetching =====
async function fetchAll() {
    if (!companyId) {
        toast.add({ severity: 'error', summary: 'Perusahaan tidak ditemukan', detail: 'Silakan login ulang.', life: 3000 });
        return;
    }
    loading.value = true;
    try {
        const [attRes, usersRes] = await Promise.all([getAllAttendanceByCompany(companyId), getUsersByCompany(companyId)]);
        attendance.value = Array.isArray(attRes?.data) ? attRes.data : [];
        users.value = Array.isArray(usersRes?.data) ? usersRes.data : [];
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal memuat', detail: err?.response?.data?.error || 'Gagal memuat data', life: 3000 });
    } finally {
        loading.value = false;
    }
}

async function exportExcel() {
    try {
        if (!visibleRows.value.length) {
            toast.add({ severity: 'warn', summary: 'Tidak ada data', detail: 'Tidak ada data untuk diekspor.', life: 2500 });
            return;
        }
        const XLSX = await import('xlsx');
        const data = visibleRows.value.map((r, idx) => ({
            No: idx + 1,
            Karyawan: r.username,
            Tipe: (r.type || '-').toUpperCase(),
            Waktu: formatDate(r.time),
            Status: r.status,
            Late: r.late ? 'Ya' : 'Tidak',
            Latitude: r.location?.latitude ?? '',
            Longitude: r.location?.longitude ?? ''
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
        XLSX.utils.book_append_sheet(wb, ws, 'Absensi');

        // nama file sesuai filter
        const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        let suffix = fmt(new Date());

        if (dateRange.value && dateRange.value.length === 2) {
            const [start, end] = dateRange.value;
            const sStr = start ? fmt(new Date(start)) : 'ALL';
            const eStr = end ? fmt(new Date(end)) : 'ALL';
            suffix = `${sStr}_to_${eStr}`;
        }

        XLSX.writeFile(wb, `absensi_${suffix}.xlsx`);
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal ekspor Excel.', life: 3000 });
    }
}

function setTodayRange() {
    const today = new Date();
    dateRange.value = [today, today];
}

function setThisWeekRange() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Minggu
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Sabtu
    dateRange.value = [startOfWeek, endOfWeek];
}

function setThisMonthRange() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    dateRange.value = [startOfMonth, endOfMonth];
}

onMounted(fetchAll);
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
                                input: { style: 'min-width: 240px' }
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
                        <Dropdown v-model="selectedUser" :options="userOptions" optionLabel="label" optionValue="value" placeholder="Semua Karyawan" showClear style="min-width: 180px" />
                    </div>
                </div>
            </template>

            <template #end>
                <div class="flex gap-2">
                    <Button label="Export" icon="pi pi-file-excel" severity="success" outlined :disabled="loading || !visibleRows.length" @click="exportExcel" />
                </div>
            </template>
        </Toolbar>

        <!-- Tabel Absensi -->
        <DataTable
            ref="dt"
            :value="visibleRows"
            dataKey="_id"
            :loading="loading"
            :paginator="true"
            :rows="10"
            :filters="filters"
            :globalFilterFields="['__search']"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[10, 20, 50]"
            currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} data"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Manajemen Absensi</h4>
                    <div class="text-600 text-sm flex items-center gap-2">
                        <i class="pi pi-database" />
                        <span
                            >Total: <span class="font-semibold text-color">{{ visibleRows.length }}</span></span
                        >
                    </div>
                </div>
            </template>

            <Column field="username" header="Karyawan" sortable />
            <Column field="type" header="Tipe" sortable>
                <template #body="{ data }">
                    <Tag :value="(data.type || '-').toUpperCase()" :severity="data.type === 'checkin' ? 'success' : 'warning'" />
                </template>
            </Column>
            <Column field="time" header="Waktu" sortable>
                <template #body="{ data }">
                    {{ formatDate(data.time) }}
                </template>
            </Column>
            <Column field="status" header="Status" sortable>
                <template #body="{ data }">
                    <Tag :value="data.status" :severity="data.late ? 'danger' : 'success'" />
                </template>
            </Column>
            <Column :exportable="false" header="Aksi" style="width: 8rem">
                <template #body="{ data }">
                    <Button icon="pi pi-eye" outlined rounded severity="info" @click="viewDetails(data.raw)" />
                </template>
            </Column>
        </DataTable>

        <!-- Dialog Detail -->
        <Dialog v-model:visible="detailDialog" :style="{ width: '520px' }" header="Detail Absensi" :modal="true">
            <div v-if="selectedDetail" class="flex flex-col gap-3">
                <div><span class="font-bold">Karyawan:</span> {{ getUsername(selectedDetail) }}</div>
                <div><span class="font-bold">Tipe:</span> {{ (selectedDetail?.type || '-').toUpperCase() }}</div>
                <div><span class="font-bold">Waktu:</span> {{ formatDate(getTimestamp(selectedDetail)) }}</div>
                <div><span class="font-bold">Status:</span> {{ selectedDetail?.status || (selectedDetail?.late ? 'Late' : 'On time') }}</div>
                <div v-if="selectedDetail?.location">
                    <span class="font-bold">Lokasi:</span>
                    {{ selectedDetail.location.latitude ?? '-' }}, {{ selectedDetail.location.longitude ?? '-' }}
                </div>
            </div>
            <template #footer>
                <Button label="Tutup" icon="pi pi-times" text @click="detailDialog = false" />
            </template>
        </Dialog>
    </div>
</template>
