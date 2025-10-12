<script setup>
import { ref } from 'vue';

import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        label: 'Home',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/dashboard' }]
    },
    {
        label: 'Kehadiran',
        items: [
            { label: 'Absensi', icon: 'pi pi-fw pi-calendar', to: '/attendance' },
            { label: 'Izin & Cuti', icon: 'pi pi-fw pi-user-edit', to: '/leave' }
        ]
    },
    {
        label: 'Karir',
        items: [
            { label: 'Posisi', icon: 'pi pi-fw pi-briefcase', to: '/jobs' },
            { label: 'Karyawan', icon: 'pi pi-fw pi-users', to: '/employees' },
            { label: 'KPI', icon: 'pi pi-fw pi-chart-line', to: '/kpi' },
            { label: 'Rekrutmen', icon: 'pi pi-fw pi-file', to: '/applications' }
        ]
    },
    {
        label: 'Konfigurasi',
        items: [
            { label: 'Pengguna', icon: 'pi pi-fw pi-users', to: '/users' },
            { label: 'Perusahaan', icon: 'pi pi-fw pi-building', to: '/company' }
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
