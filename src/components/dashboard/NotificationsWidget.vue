<script setup>
import { fetchAllLeaves, fetchTodayAttendanceByCompany, fetchUsersByCompany } from '@/api/api';
import { onMounted, ref } from 'vue';

const companyId = localStorage.getItem('companyId');
const hariIni = ref([]);
const kemarin = ref([]);
const mingguLalu = ref([]);
const loading = ref(true);

onMounted(async () => {
    try {
        const [tAtt, leaves, users] = await Promise.all([fetchTodayAttendanceByCompany(companyId, 'Asia/Jakarta'), fetchAllLeaves(), fetchUsersByCompany(companyId)]);
        const uMap = new Map((users ?? []).map((u) => [u._id || u.id, u]));

        const catatan = [];

        // Absensi hari ini
        for (const a of tAtt ?? []) {
            const u = uMap.get(a.userId);
            catatan.push({
                tipe: a.isLate ? 'late' : (a.status ?? '').toLowerCase(),
                teks: `${u?.fullName ?? 'Tidak diketahui'} ${a.isLate ? 'melakukan check-in terlambat' : 'melakukan check-in'}`,
                extra: a.isLate ? 'Mohon ditinjau.' : '',
                waktu: a.checkInTime || a.date || new Date().toISOString()
            });
        }

        // Pengajuan cuti (tampilkan hanya company ini jika perlu)
        for (const l of (leaves ?? []).filter((x) => x.companyId === companyId)) {
            const u = uMap.get(l.userId);
            const status = (l.status ?? 'pending').toLowerCase();
            catatan.push({
                tipe: status,
                teks: `Pengajuan cuti ${l.type ?? ''} oleh ${u?.fullName ?? 'Tidak diketahui'} ${status === 'pending' ? 'menunggu persetujuan' : status === 'approved' ? 'telah disetujui' : 'ditolak'}`,
                extra: '',
                waktu: l.createdAt || new Date().toISOString()
            });
        }

        // Bagi ke seksi waktu
        const now = new Date();
        const startHariIni = new Date(now);
        startHariIni.setHours(0, 0, 0, 0);
        const startKemarin = new Date(startHariIni);
        startKemarin.setDate(startKemarin.getDate() - 1);
        const startMingguLalu = new Date(startHariIni);
        startMingguLalu.setDate(startMingguLalu.getDate() - 7);

        hariIni.value = catatan.filter((n) => new Date(n.waktu) >= startHariIni);
        kemarin.value = catatan.filter((n) => {
            const d = new Date(n.waktu);
            return d >= startKemarin && d < startHariIni;
        });
        mingguLalu.value = catatan.filter((n) => {
            const d = new Date(n.waktu);
            return d >= startMingguLalu && d < startKemarin;
        });
    } finally {
        loading.value = false;
    }
});

const ikon = {
    present: { wrap: 'bg-green-100 dark:bg-green-400/10', icon: 'pi pi-check-circle', color: 'text-green-500' },
    late: { wrap: 'bg-orange-100 dark:bg-orange-400/10', icon: 'pi pi-clock', color: 'text-orange-500' },
    absent: { wrap: 'bg-pink-100 dark:bg-pink-400/10', icon: 'pi pi-times', color: 'text-pink-500' },
    pending: { wrap: 'bg-purple-100 dark:bg-purple-400/10', icon: 'pi pi-inbox', color: 'text-purple-500' },
    approved: { wrap: 'bg-blue-100 dark:bg-blue-400/10', icon: 'pi pi-check', color: 'text-blue-500' },
    declined: { wrap: 'bg-red-100 dark:bg-red-400/10', icon: 'pi pi-ban', color: 'text-red-500' }
};
function iconFor(tipe) {
    return ikon[tipe] || ikon.present;
}
</script>

<template>
    <div class="card">
        <div class="flex items-center justify-between mb-6">
            <div class="font-semibold text-xl">Notifikasi</div>
        </div>

        <template v-if="loading">
            <span class="block text-muted-color">Memuat…</span>
        </template>

        <template v-else>
            <span class="block text-muted-color font-medium mb-4">HARI INI</span>
            <ul class="p-0 mx-0 mt-0 mb-6 list-none">
                <li v-for="(n, i) in hariIni" :key="'t' + i" class="flex items-center py-2 border-b border-surface">
                    <div class="w-12 h-12 flex items-center justify-center rounded-full mr-4 shrink-0" :class="iconFor(n.tipe).wrap">
                        <i class="!text-xl" :class="[iconFor(n.tipe).icon, iconFor(n.tipe).color]"></i>
                    </div>
                    <span class="text-surface-900 dark:text-surface-0 leading-normal">
                        {{ n.teks }} <span v-if="n.extra" class="text-muted-color">{{ n.extra }}</span>
                    </span>
                </li>
                <li v-if="hariIni.length === 0" class="text-muted-color">Tidak ada pembaruan.</li>
            </ul>

            <span class="block text-muted-color font-medium mb-4">KEMARIN</span>
            <ul class="p-0 m-0 list-none mb-6">
                <li v-for="(n, i) in kemarin" :key="'y' + i" class="flex items-center py-2 border-b border-surface">
                    <div class="w-12 h-12 flex items-center justify-center rounded-full mr-4 shrink-0" :class="iconFor(n.tipe).wrap">
                        <i class="!text-xl" :class="[iconFor(n.tipe).icon, iconFor(n.tipe).color]"></i>
                    </div>
                    <span class="text-surface-900 dark:text-surface-0 leading-normal">{{ n.teks }}</span>
                </li>
                <li v-if="kemarin.length === 0" class="text-muted-color">Tidak ada pembaruan.</li>
            </ul>

            <span class="block text-muted-color font-medium mb-4">MINGGU LALU</span>
            <ul class="p-0 m-0 list-none">
                <li v-for="(n, i) in mingguLalu" :key="'w' + i" class="flex items-center py-2 border-b border-surface">
                    <div class="w-12 h-12 flex items-center justify-center rounded-full mr-4 shrink-0" :class="iconFor(n.tipe).wrap">
                        <i class="!text-xl" :class="[iconFor(n.tipe).icon, iconFor(n.tipe).color]"></i>
                    </div>
                    <span class="text-surface-900 dark:text-surface-0 leading-normal">{{ n.teks }}</span>
                </li>
                <li v-if="mingguLalu.length === 0" class="text-muted-color">Tidak ada pembaruan.</li>
            </ul>
        </template>
    </div>
</template>
