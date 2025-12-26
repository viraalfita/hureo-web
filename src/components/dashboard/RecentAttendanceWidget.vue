<script setup>
import { fetchAttendanceByCompany, fetchUsersByCompany } from '@/api/api';
import { computed, onMounted, ref } from 'vue';

const companyId = localStorage.getItem('companyId');
const baris = ref([]);
const users = ref([]);
const loading = ref(true);

const userMap = computed(() => {
    const m = new Map();
    for (const u of users.value) m.set(String(u._id || u.id || u.userId || ''), u);
    return m;
});

function formatJam(s) {
    if (!s) return '-';
    try {
        const d = new Date(s);
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return s;
    }
}

onMounted(async () => {
    try {
        const [atts, u] = await Promise.all([fetchAttendanceByCompany(companyId), fetchUsersByCompany(companyId)]);
        users.value = u ?? [];

        // urutkan terbaru
        const sorted = [...(atts ?? [])].sort((a, b) => new Date(b.checkInTime || b.time || b.date) - new Date(a.checkInTime || a.time || a.date));

        // ambil 5
        baris.value = sorted.slice(0, 5).map((it) => {
            const uid = String(typeof it.userId === 'object' ? it.userId?._id || it.userId?.id || it.userId?.userId : it.userId || '');
            const u = userMap.value.get(uid);
            const statusRaw = it.status || ((it.isLate ?? it.late) ? 'late' : it.type) || '-';
            const nama = it.employee?.fullName || u?.fullName || u?.username || u?.name || u?.email || 'Tidak diketahui';
            const dept = it.employee?.department || u?.department || '-';
            return {
                nama,
                avatar: u?.avatarUrl,
                departemen: dept,
                status: String(statusRaw || '-').toUpperCase(),
                terlambat: !!(it.isLate ?? it.late),
                jamMasuk: it.checkInTime || it.time || it.date
            };
        });
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Absensi Terbaru</div>
        <DataTable :value="baris" :rows="5" :paginator="true" responsiveLayout="scroll" :loading="loading">
            <Column header="Karyawan" style="width: 40%">
                <template #body="{ data }">
                    <div class="flex items-center gap-3">
                        <img v-if="data.avatar" :src="data.avatar" alt="avatar" width="36" class="rounded-full shadow" />
                        <div>
                            <div class="font-medium">{{ data.nama }}</div>
                            <div class="text-muted-color text-sm">{{ data.departemen }}</div>
                        </div>
                    </div>
                </template>
            </Column>
            <Column header="Jam Masuk" style="width: 25%">
                <template #body="{ data }">
                    {{ formatJam(data.jamMasuk) }}
                </template>
            </Column>
            <Column header="Status" style="width: 20%">
                <template #body="{ data }">
                    <Tag :value="data.status" :severity="data.terlambat ? 'warn' : data.status === 'ABSENT' ? 'danger' : 'success'" />
                </template>
            </Column>
            <Column header="Aksi" style="width: 15%">
                <template #body>
                    <Button icon="pi pi-search" type="button" class="p-button-text" />
                </template>
            </Column>
        </DataTable>
    </div>
</template>
