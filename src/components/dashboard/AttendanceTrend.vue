<script setup>
import { fetchAttendanceByCompany } from '@/api/api';
import { useLayout } from '@/layout/composables/layout';
import { onMounted, ref, watch } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();
const companyId = localStorage.getItem('companyId');

const chartData = ref(null);
const chartOptions = ref(null);
const raw = ref([]);

function monday(d) {
    const dt = new Date(d);
    const day = dt.getDay(); // 0..6
    const diff = (day + 6) % 7; // Senin = 0
    dt.setDate(dt.getDate() - diff);
    dt.setHours(0, 0, 0, 0);
    return dt;
}
function weekKey(d) {
    const m = monday(d);
    const mm = m.getMonth() + 1,
        dd = m.getDate();
    return `${m.getFullYear()}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

function agregasi4Minggu(atts) {
    const now = new Date();
    const keys = [];
    let cur = monday(now);
    for (let i = 3; i >= 0; i--) {
        const wk = new Date(cur);
        wk.setDate(cur.getDate() - 7 * i);
        keys.push(weekKey(wk));
    }
    const buckets = Object.fromEntries(keys.map((k) => [k, { hadir: 0, terlambat: 0, absen: 0 }]));
    for (const a of atts) {
        const d = new Date(a.date || a.checkInTime || Date.now());
        const key = weekKey(d);
        if (!(key in buckets)) continue;
        const s = (a.status ?? '').toLowerCase();
        if (s === 'present' && a.isLate) buckets[key].terlambat++;
        else if (s === 'present') buckets[key].hadir++;
        else if (s === 'late') buckets[key].terlambat++;
        else buckets[key].absen++;
    }
    return { keys, buckets };
}

function setChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const borderColor = documentStyle.getPropertyValue('--surface-border');
    const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        scales: {
            x: { stacked: true, ticks: { color: textMutedColor }, grid: { color: 'transparent', borderColor: 'transparent' } },
            y: { stacked: true, ticks: { color: textMutedColor }, grid: { color: borderColor, borderColor: 'transparent', drawTicks: false } }
        }
    };
}

function buildChart() {
    const { keys, buckets } = agregasi4Minggu(raw.value);
    const documentStyle = getComputedStyle(document.documentElement);
    chartData.value = {
        labels: keys.map((k) => `Pekan ${k.slice(5)}`),
        datasets: [
            { type: 'bar', label: 'Hadir', backgroundColor: documentStyle.getPropertyValue('--p-primary-400'), data: keys.map((k) => buckets[k].hadir), barThickness: 32 },
            { type: 'bar', label: 'Terlambat', backgroundColor: documentStyle.getPropertyValue('--p-primary-300'), data: keys.map((k) => buckets[k].terlambat), barThickness: 32 },
            { type: 'bar', label: 'Absen/Cuti', backgroundColor: documentStyle.getPropertyValue('--p-primary-200'), data: keys.map((k) => buckets[k].absen), barThickness: 32, borderRadius: { topLeft: 8, topRight: 8 }, borderSkipped: true }
        ]
    };
    chartOptions.value = setChartOptions();
}

onMounted(async () => {
    const atts = await fetchAttendanceByCompany(companyId);
    raw.value = atts ?? [];
    buildChart();
});

watch([getPrimary, getSurface, isDarkTheme], buildChart);
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Tren Absensi</div>
        <Chart type="bar" :data="chartData" :options="chartOptions" class="h-80" />
    </div>
</template>
