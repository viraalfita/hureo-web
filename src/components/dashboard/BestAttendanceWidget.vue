<script setup>
import { fetchAttendanceByCompany, fetchUsersByCompany } from '@/api/api';
import { onMounted, ref } from 'vue';

const companyId = localStorage.getItem('companyId');
const items = ref([]);
const loading = ref(true);

function awalNharilalu(n) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - n);
    return d;
}

onMounted(async () => {
    try {
        const [atts, users] = await Promise.all([fetchAttendanceByCompany(companyId), fetchUsersByCompany(companyId)]);
        const sejak = awalNharilalu(7);
        const byUser = new Map();

        for (const a of atts ?? []) {
            const t = new Date(a.date || a.checkInTime || Date.now());
            if (t < sejak) continue;
            const key = a.userId;
            if (!byUser.has(key)) byUser.set(key, { total: 0, ontime: 0 });
            const rec = byUser.get(key);
            rec.total++;
            const status = (a.status ?? '').toLowerCase();
            const ontime = status === 'present' && (a.isLate === false || status === 'on-time');
            if (ontime) rec.ontime++;
        }

        const list = [];
        for (const [uid, stat] of byUser) {
            const u = (users ?? []).find((x) => (x._id || x.id) === uid);
            const rate = stat.total ? Math.round((stat.ontime / stat.total) * 100) : 0;
            list.push({
                nama: u?.fullName ?? 'Tidak diketahui',
                dept: u?.department ?? '-',
                rate,
                barClass: rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-cyan-500' : rate >= 40 ? 'bg-orange-500' : 'bg-pink-500',
                textClass: rate >= 80 ? 'text-green-500' : rate >= 60 ? 'text-cyan-500' : rate >= 40 ? 'text-orange-500' : 'text-pink-500'
            });
        }
        items.value = list.sort((a, b) => b.rate - a.rate).slice(0, 6);
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-6">
            <div class="font-semibold text-xl">Tepat Waktu Teratas (7 Hari Terakhir)</div>
        </div>

        <ul class="list-none p-0 m-0">
            <li v-if="loading" class="text-muted-color">Memuat…</li>

            <li v-for="(it, idx) in items" :key="idx" class="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <span class="text-surface-900 dark:text-surface-0 font-medium mr-2 mb-1 md:mb-0">{{ it.nama }}</span>
                    <div class="mt-1 text-muted-color">{{ it.dept }}</div>
                </div>
                <div class="mt-2 md:mt-0 flex items-center">
                    <div class="bg-surface-300 dark:bg-surface-500 rounded-border overflow-hidden w-40 lg:w-24" style="height: 8px">
                        <div class="h-full" :class="it.barClass" :style="`width:${it.rate}%`"></div>
                    </div>
                    <span class="ml-4 font-medium" :class="it.textClass">%{{ it.rate }}</span>
                </div>
            </li>
        </ul>
    </div>
</template>
