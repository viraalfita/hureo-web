<script setup>
import { loginUser, setAuthToken } from '@/api/api';
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

const username = ref('');
const password = ref('');
const companyCode = ref('');
const remember = ref(true);

const usernameError = ref('');
const passwordError = ref('');
const companyCodeError = ref('');
const loading = ref(false);

const validate = () => {
    usernameError.value = '';
    passwordError.value = '';
    companyCodeError.value = '';

    let ok = true;
    if (!username.value) {
        usernameError.value = 'Username wajib diisi';
        ok = false;
    }
    if (!password.value) {
        passwordError.value = 'Password wajib diisi';
        ok = false;
    }
    if (!companyCode.value) {
        companyCodeError.value = 'Company code wajib diisi';
        ok = false;
    }
    return ok;
};

const persistAuth = (payload) => {
    const { token, role, company, working_hours } = payload;

    const store = remember.value ? localStorage : sessionStorage;
    store.setItem('token', token);
    store.setItem('role', role);
    store.setItem('company', JSON.stringify(company));
    store.setItem('working_hours', JSON.stringify(working_hours));

    store.setItem('user', JSON.stringify({ role }));
    setAuthToken(token);

    const companyId = company?.id || company?._id || company?.companyId || company?.company_id;
    if (companyId) store.setItem('companyId', String(companyId));
    const companyCode = company?.code || company?.companyCode;
    if (companyCode) store.setItem('companyCode', String(companyCode));
};

const roleRedirect = (role) => {
    const redirect = route.query.redirect;
    if (redirect) return router.replace(String(redirect));
    if (role === 'admin') return router.replace('/dashboard');
    return router.replace('/');
};

const onSubmit = async () => {
    if (!validate()) return;
    loading.value = true;
    try {
        const res = await loginUser({
            username: username.value,
            password: password.value,
            companyCode: companyCode.value
        });
        persistAuth(res.data);
        roleRedirect(res.data.role);
    } catch (err) {
        const msg = err?.response?.data?.error || 'Username, password, atau company code salah';
        passwordError.value = msg;
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <FloatingConfigurator />

    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <img src="@/assets/images/logo-hureo.png" alt="HUREO Logo" width="80" height="80" class="mx-auto mb-4" />
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Selamat datang!</div>
                        <span class="text-muted-color font-medium">Masuk untuk melanjutkan</span>
                    </div>

                    <form @submit.prevent="onSubmit" class="w-full">
                        <!-- Username -->
                        <label for="username" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Username</label>
                        <InputText id="username" v-model.trim="username" type="text" placeholder="Masukkan username" class="w-full md:w-[30rem] mb-2" :class="{ 'p-invalid': usernameError }" autocomplete="username" required />
                        <small v-if="usernameError" class="p-error block mb-4">{{ usernameError }}</small>

                        <!-- Password -->
                        <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                        <Password id="password" v-model="password" placeholder="Masukkan password" :toggleMask="true" :feedback="false" fluid :inputProps="{ autocomplete: 'current-password' }" :class="{ 'p-invalid': passwordError }" />
                        <small v-if="passwordError" class="p-error block mt-2 mb-4">{{ passwordError }}</small>

                        <!-- Company Code -->
                        <label for="companyCode" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Company Code</label>
                        <InputText id="companyCode" v-model.trim="companyCode" type="text" placeholder="Masukkan kode perusahaan" class="w-full md:w-[30rem] mb-2" :class="{ 'p-invalid': companyCodeError }" required />
                        <small v-if="companyCodeError" class="p-error block mb-4">{{ companyCodeError }}</small>

                        <!-- Remember me -->
                        <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                            <div class="flex items-center">
                                <Checkbox v-model="remember" inputId="rememberme1" binary class="mr-2" />
                                <label for="rememberme1">Ingat saya</label>
                            </div>
                            <RouterLink to="/auth/forgot" class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Lupa password?</RouterLink>
                        </div>

                        <!-- Submit -->
                        <Button type="submit" label="Masuk" class="w-full" :loading="loading" :disabled="loading" />
                        <div class="text-center text-600 text-sm mt-6">
                            Belum punya perusahaan?
                            <RouterLink to="/auth/register" class="text-primary hover:underline">Daftarkan di sini</RouterLink>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
