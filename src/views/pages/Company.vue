<script setup>
import { getCompany, getUsersByCompany, updateCompany } from '@/api/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();

const companyId = localStorage.getItem('companyId');
const companyCode = localStorage.getItem('companyCode');

const name = ref('');
const address = ref('');
const radius = ref(200);
const time_start = ref(null);
const time_end = ref(null);
const recruiterEmail = ref('');

const loading = ref(false);
const joinDate = ref('-');
const totalEmployees = ref(0);

// helpers time <-> string
function hhmmToDate(hhmm) {
    if (!hhmm || typeof hhmm !== 'string') return null;
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date();
    d.setHours(isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0, 0);
    return d;
}
function dateToHHMM(d) {
    if (!(d instanceof Date)) return null;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function fetchCompany() {
    loading.value = true;
    try {
        const res = await getCompany(companyCode);
        const c = res?.data || {};

        name.value = c.name || '';
        address.value = c.address || '';
        radius.value = c.radius || 200;
        time_start.value = hhmmToDate(c.timeStart);
        time_end.value = hhmmToDate(c.timeEnd);
        recruiterEmail.value = c.recruiterEmail || '';

        joinDate.value = c.createdAt ? new Date(c.createdAt).toLocaleDateString('id-ID') : '-';

        if (companyId) {
            const usersRes = await getUsersByCompany(companyId);
            const list = Array.isArray(usersRes?.data) ? usersRes.data : [];
            totalEmployees.value = list.filter((u) => (u.role || 'employee') === 'employee').length;
        } else {
            totalEmployees.value = 0;
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: err?.response?.data?.error || 'Gagal memuat data perusahaan', life: 3000 });
    } finally {
        loading.value = false;
    }
}

async function updateCompanyData() {
    loading.value = true;
    try {
        await updateCompany(companyId, {
            name: name.value,
            address: address.value,
            radius: radius.value,
            time_start: dateToHHMM(time_start.value),
            time_end: dateToHHMM(time_end.value),
            recruiterEmail: recruiterEmail.value
        });
        toast.add({ severity: 'success', summary: 'Tersimpan', detail: 'Perubahan disimpan', life: 2000 });
        await fetchCompany();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: err?.response?.data?.error || 'Terjadi kesalahan', life: 3000 });
    } finally {
        loading.value = false;
    }
}

onMounted(fetchCompany);
</script>

<template>
    <div class="card">
        <div class="flex items-center gap-2 mb-4">
            <i class="pi pi-building text-primary text-xl" />
            <div class="font-semibold text-xl">Pengaturan Perusahaan</div>
        </div>

        <!-- GANTI BARIS INI: pakai Tailwind grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- KIRI (Form) -->
            <div class="flex flex-col gap-4">
                <div class="font-semibold text-lg">Informasi Perusahaan</div>

                <form @submit.prevent="updateCompanyData" class="flex flex-col gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="name" class="font-medium">Nama Perusahaan</label>
                        <InputText id="name" v-model="name" placeholder="Masukkan nama perusahaan" :disabled="loading" class="w-full" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="address" class="font-medium">Alamat</label>
                        <Textarea id="address" v-model="address" rows="3" autoResize placeholder="Masukkan alamat lengkap perusahaan" :disabled="loading" class="w-full" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="radius" class="font-medium">Radius Absensi</label>
                        <InputNumber id="radius" v-model="radius" placeholder="Masukkan radius absensi" :disabled="loading" class="w-full" />
                    </div>

                    <!-- Jam Masuk (baris sendiri) -->
                    <div class="flex flex-col gap-2">
                        <label for="time_start" class="font-medium">Jam Masuk</label>
                        <Calendar id="time_start" v-model="time_start" timeOnly hourFormat="24" placeholder="HH:MM" :disabled="loading" class="w-full" inputClass="w-full" />
                    </div>

                    <!-- Jam Pulang (baris sendiri) -->
                    <div class="flex flex-col gap-2">
                        <label for="time_end" class="font-medium">Jam Pulang</label>
                        <Calendar id="time_end" v-model="time_end" timeOnly hourFormat="24" placeholder="HH:MM" :disabled="loading" class="w-full" inputClass="w-full" />
                    </div>

                    <!-- Email Recruiter -->
                    <div class="flex flex-col gap-2">
                        <label for="time_end" class="font-medium">Email Recruiter</label>
                        <InputText id="time_end" v-model="recruiterEmail" type="email" placeholder="email@perusahaan.com" :disabled="loading" class="w-full" />
                    </div>

                    <div class="flex gap-2 justify-end pt-2">
                        <Button type="submit" label="Simpan Perubahan" icon="pi pi-check" :loading="loading" />
                    </div>
                </form>
            </div>

            <!-- KANAN (Info) -->
            <div class="flex flex-col gap-4">
                <div class="font-semibold text-lg">Informasi Sistem</div>

                <div class="surface-section p-3 border-1 surface-border border-round">
                    <div class="flex items-center gap-3">
                        <i class="pi pi-id-card text-primary" />
                        <div>
                            <span class="block text-muted-color text-sm">Kode Perusahaan</span>
                            <span class="font-semibold">{{ companyCode }}</span>
                        </div>
                    </div>
                </div>

                <div class="surface-section p-3 border-1 surface-border border-round">
                    <div class="flex items-center gap-3">
                        <i class="pi pi-calendar text-primary" />
                        <div>
                            <span class="block text-muted-color text-sm">Tanggal Bergabung</span>
                            <span class="font-semibold">{{ joinDate }}</span>
                        </div>
                    </div>
                </div>

                <div class="surface-section p-3 border-1 surface-border border-round">
                    <div class="flex items-center gap-3">
                        <i class="pi pi-users text-primary" />
                        <div>
                            <span class="block text-muted-color text-sm">Total Karyawan</span>
                            <span class="font-semibold">{{ totalEmployees }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <!-- /KANAN -->
        </div>
    </div>
</template>

<style scoped>
/* Biar input full width */
.card :deep(.p-inputtext),
.card :deep(.p-textarea),
.card :deep(.p-calendar),
.card :deep(.p-dropdown) {
    width: 100%;
}
.surface-section {
    background: var(--surface-card);
}
</style>
