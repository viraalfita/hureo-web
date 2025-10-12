<template>
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden py-8">
        <div class="flex flex-col items-center justify-center w-full max-w-[500px] mx-8">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)" class="w-full">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <!-- Step 1: Register Company -->
                    <div v-if="step === 1" class="text-center mb-8">
                        <img src="@/assets/images/logo-hureo.png" alt="HUREO Logo" width="80" height="80" class="mx-auto mb-4" />
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Daftarkan Perusahaan</div>
                        <span class="text-muted-color font-medium">Langkah 1: Informasi perusahaan</span>
                    </div>

                    <!-- Step 2: Register Admin -->
                    <div v-else class="text-center mb-8">
                        <img src="@/assets/images/logo-hureo.png" alt="HUREO Logo" width="80" height="80" class="mx-auto mb-4" />
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Buat Akun Admin</div>
                        <span class="text-muted-color font-medium">Langkah 2: Akun administrator</span>
                    </div>

                    <!-- Progress Indicator -->
                    <div class="flex justify-center mb-8">
                        <div class="flex items-center">
                            <div class="flex flex-col items-center">
                                <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium', step >= 1 ? 'bg-primary text-white' : 'bg-surface-200 text-surface-600']">1</div>
                                <span class="text-xs mt-2">Perusahaan</span>
                            </div>
                            <div :class="['w-16 h-1 mx-2', step >= 2 ? 'bg-primary' : 'bg-surface-200']"></div>
                            <div class="flex flex-col items-center">
                                <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium', step >= 2 ? 'bg-primary text-white' : 'bg-surface-200 text-surface-600']">2</div>
                                <span class="text-xs mt-2">Admin</span>
                            </div>
                        </div>
                    </div>

                    <!-- Step 1 Form: Company Registration -->
                    <form v-if="step === 1" @submit.prevent="handleCompanyRegistration" class="w-full">
                        <!-- Company Name -->
                        <label for="companyName" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Nama Perusahaan</label>
                        <InputText id="companyName" v-model.trim="companyData.name" type="text" placeholder="Masukkan nama perusahaan" class="w-full mb-2" :class="{ 'p-invalid': errors.name }" required />
                        <small v-if="errors.name" class="p-error block mb-4">{{ errors.name }}</small>

                        <!-- Company Address -->
                        <label for="companyAddress" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Alamat Perusahaan</label>
                        <InputText id="companyAddress" v-model.trim="companyData.address" type="text" placeholder="Masukkan alamat lengkap perusahaan" class="w-full mb-2" :class="{ 'p-invalid': errors.address }" required />
                        <small v-if="errors.address" class="p-error block mb-4">{{ errors.address }}</small>

                        <!-- Radius -->
                        <label for="radius" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Radius Presensi (meter)</label>
                        <InputNumber id="radius" v-model="companyData.radius" placeholder="Masukkan radius presensi" class="w-full mb-2" :class="{ 'p-invalid': errors.radius }" :min="50" :max="1000" />
                        <small class="text-muted-color block mb-4">Default: 200 meter</small>

                        <!-- Working Hours -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label for="timeStart" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Jam Masuk</label>
                                <Calendar id="timeStart" v-model="companyData.timeStart" timeOnly hourFormat="24" placeholder="HH:MM" class="w-full" :class="{ 'p-invalid': errors.timeStart }" />
                            </div>
                            <div>
                                <label for="timeEnd" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Jam Pulang</label>
                                <Calendar id="timeEnd" v-model="companyData.timeEnd" timeOnly hourFormat="24" placeholder="HH:MM" class="w-full" :class="{ 'p-invalid': errors.timeEnd }" />
                            </div>
                        </div>

                        <!-- Recruiter Email -->
                        <label for="recruiterEmail" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email Recruiter (Opsional)</label>
                        <InputText id="recruiterEmail" v-model.trim="companyData.recruiterEmail" type="email" placeholder="email@perusahaan.com" class="w-full mb-2" />

                        <Button type="submit" label="Lanjutkan" class="w-full mt-6" :loading="loading" :disabled="loading" />

                        <div class="text-center text-600 text-sm mt-6">
                            Sudah punya perusahaan?
                            <RouterLink to="/auth/login" class="text-primary hover:underline">Masuk di sini</RouterLink>
                        </div>
                    </form>

                    <!-- Step 2 Form: Admin Registration -->
                    <form v-else @submit.prevent="handleAdminRegistration" class="w-full">
                        <!-- Company Code (Display Only) -->
                        <label class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Kode Perusahaan</label>
                        <div class="p-inputtext w-full mb-4 bg-surface-100 dark:bg-surface-800">
                            {{ companyCode }}
                        </div>
                        <small class="text-muted-color block mb-6">Simpan kode ini untuk login ke perusahaan</small>

                        <!-- Admin Username -->
                        <label for="adminUsername" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Username Admin</label>
                        <InputText id="adminUsername" v-model.trim="adminData.username" type="text" placeholder="Masukkan username admin" class="w-full mb-2" :class="{ 'p-invalid': errors.username }" required />
                        <small v-if="errors.username" class="p-error block mb-4">{{ errors.username }}</small>

                        <!-- Admin Password -->
                        <label for="adminPassword" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Password Admin</label>
                        <Password
                            id="adminPassword"
                            v-model="adminData.password"
                            placeholder="Masukkan password admin"
                            :toggleMask="true"
                            :feedback="true"
                            fluid
                            :inputProps="{ autocomplete: 'new-password' }"
                            :class="{ 'p-invalid': errors.password }"
                        />
                        <small v-if="errors.password" class="p-error block mt-2 mb-4">{{ errors.password }}</small>

                        <!-- Confirm Password -->
                        <label for="confirmPassword" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Konfirmasi Password</label>
                        <Password
                            id="confirmPassword"
                            v-model="adminData.confirmPassword"
                            placeholder="Konfirmasi password"
                            :toggleMask="true"
                            :feedback="false"
                            fluid
                            :inputProps="{ autocomplete: 'new-password' }"
                            :class="{ 'p-invalid': errors.confirmPassword }"
                        />
                        <small v-if="errors.confirmPassword" class="p-error block mt-2 mb-4">{{ errors.confirmPassword }}</small>

                        <div class="flex gap-4 mt-6">
                            <Button type="button" label="Kembali" severity="secondary" class="flex-1" @click="step = 1" :disabled="loading" />
                            <Button type="submit" label="Buat Akun Admin" class="flex-1" :loading="loading" :disabled="loading" />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { registerAdmin as apiRegisterAdmin, registerCompany as apiRegisterCompany } from '@/api/api';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const step = ref(1);
const loading = ref(false);
const companyCode = ref('');

const companyData = ref({
    name: '',
    address: '',
    radius: 200,
    timeStart: null,
    timeEnd: null,
    recruiterEmail: ''
});

const adminData = ref({
    username: '',
    password: '',
    confirmPassword: ''
});

const errors = ref({});

const validateCompany = () => {
    errors.value = {};
    let valid = true;

    if (!companyData.value.name.trim()) {
        errors.value.name = 'Nama perusahaan wajib diisi';
        valid = false;
    }

    if (!companyData.value.address.trim()) {
        errors.value.address = 'Alamat perusahaan wajib diisi';
        valid = false;
    }

    if (companyData.value.radius && (companyData.value.radius < 50 || companyData.value.radius > 1000)) {
        errors.value.radius = 'Radius harus antara 50-1000 meter';
        valid = false;
    }

    return valid;
};

const validateAdmin = () => {
    errors.value = {};
    let valid = true;

    if (!adminData.value.username.trim()) {
        errors.value.username = 'Username admin wajib diisi';
        valid = false;
    }

    if (!adminData.value.password) {
        errors.value.password = 'Password wajib diisi';
        valid = false;
    } else if (adminData.value.password.length < 6) {
        errors.value.password = 'Password minimal 6 karakter';
        valid = false;
    }

    if (adminData.value.password !== adminData.value.confirmPassword) {
        errors.value.confirmPassword = 'Password tidak cocok';
        valid = false;
    }

    return valid;
};

const handleCompanyRegistration = async () => {
    if (!validateCompany()) return;

    loading.value = true;
    try {
        // Format time to HH:MM
        const formattedData = {
            ...companyData.value,
            timeStart: companyData.value.timeStart ? formatTime(companyData.value.timeStart) : null,
            timeEnd: companyData.value.timeEnd ? formatTime(companyData.value.timeEnd) : null
        };

        const res = await apiRegisterCompany(formattedData);
        companyCode.value = res.data.companyCode;
        step.value = 2;
    } catch (err) {
        const msg = err?.response?.data?.error || 'Gagal mendaftarkan perusahaan';
        errors.value.submit = msg;
    } finally {
        loading.value = false;
    }
};

const handleAdminRegistration = async () => {
    if (!validateAdmin()) return;

    loading.value = true;
    try {
        await apiRegisterAdmin({
            username: adminData.value.username,
            password: adminData.value.password,
            companyCode: companyCode.value
        });

        // Redirect to login with success message
        router.push({
            path: '/auth/login',
            query: {
                registered: 'true',
                companyCode: companyCode.value
            }
        });
    } catch (err) {
        const msg = err?.response?.data?.error || 'Gagal membuat akun admin';
        errors.value.submit = msg;
    } finally {
        loading.value = false;
    }
};

const formatTime = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};
</script>
