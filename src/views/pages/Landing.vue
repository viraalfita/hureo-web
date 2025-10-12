<script setup lang="ts">
import Button from 'primevue/button';
import Divider from 'primevue/divider';
import { onMounted, onUnmounted, ref } from 'vue';

const isMenuOpen = ref(false);
const scrollY = ref(0);

const handleScroll = () => {
    scrollY.value = window.scrollY;
};

onMounted(() => {
    window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
});

const features = [
    {
        icon: 'pi-users',
        title: 'Employee Management',
        description: 'Kelola data karyawan dengan mudah dan terstruktur dalam satu platform terpadu'
    },
    {
        icon: 'pi-calendar',
        title: 'Attendance & Leave',
        description: 'Sistem absensi digital dan manajemen cuti yang otomatis dan akurat'
    },
    {
        icon: 'pi-dollar',
        title: 'Payroll System',
        description: 'Proses penggajian otomatis dengan perhitungan pajak dan benefit yang presisi'
    },
    {
        icon: 'pi-file',
        title: 'Document Management',
        description: 'Simpan dan kelola semua dokumen karyawan secara digital dan aman'
    },
    {
        icon: 'pi-chart-bar',
        title: 'Analytics & Reports',
        description: 'Dashboard analitik real-time untuk insight mendalam tentang tim Anda'
    },
    {
        icon: 'pi-shield',
        title: 'Security & Compliance',
        description: 'Keamanan data tingkat enterprise dengan standar compliance terbaik'
    }
];

const pricingPlans = [
    {
        name: 'Starter',
        price: 'Free',
        period: 'selamanya',
        description: 'Sempurna untuk startup dan tim kecil',
        features: ['Hingga 10 karyawan', 'Basic attendance tracking', 'Employee database', 'Email support', 'Mobile app access'],
        gradient: 'from-blue-400 to-blue-600',
        popular: false
    },
    {
        name: 'Professional',
        price: '299K',
        period: 'per bulan',
        description: 'Untuk bisnis yang berkembang',
        features: ['Hingga 100 karyawan', 'Advanced attendance & leave', 'Payroll management', 'Document management', 'Priority support', 'Custom reports', 'API access'],
        gradient: 'from-blue-600 to-indigo-600',
        popular: true
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        period: 'hubungi kami',
        description: 'Solusi lengkap untuk perusahaan besar',
        features: ['Unlimited karyawan', 'Full HRIS features', 'Multi-company support', 'Dedicated account manager', '24/7 phone support', 'Custom integrations', 'On-premise option', 'Training & onboarding'],
        gradient: 'from-indigo-600 to-purple-600',
        popular: false
    }
];
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <!-- Navigation -->
        <nav :class="['fixed top-0 w-full z-50 transition-all duration-300', scrollY > 50 ? 'nav-scrolled' : 'bg-transparent']">
            <div class="max-w-7xl mx-auto px-6 lg:px-20">
                <div class="flex items-center justify-between h-20">
                    <!-- Logo Section -->
                    <div class="flex items-center gap-2">
                        <router-link to="/" class="flex items-center gap-2">
                            <div class="">
                                <img src="@/assets/images/logo-hureo.png" alt="HUREO Logo" width="40" height="40" />
                            </div>
                            <span class="text-2xl font-bold logo-text text-white">HUREO HRIS</span>
                        </router-link>
                    </div>

                    <!-- Desktop Menu -->
                    <div class="hidden md:flex items-center gap-8">
                        <a href="#features" class="nav-link">Features</a>
                        <a href="#highlights" class="nav-link">Highlights</a>
                        <a href="#pricing" class="nav-link">Pricing</a>

                        <!-- Login/Register Buttons -->
                        <div class="flex gap-2 ml-4">
                            <Button label="Login" text as="router-link" to="/auth/login" rounded class="text-white hover:bg-white/10 px-4 py-2"></Button>
                            <Button label="Register" as="router-link" to="/auth/register" rounded class="bg-white text-primary px-4 py-2 hover:bg-gray-100"></Button>
                        </div>
                    </div>

                    <!-- Mobile menu button -->
                    <button @click="isMenuOpen = !isMenuOpen" class="md:hidden">
                        <i :class="isMenuOpen ? 'pi pi-times' : 'pi pi-bars'" class="text-xl text-white"></i>
                    </button>
                </div>
            </div>

            <!-- Mobile menu -->
            <div v-if="isMenuOpen" class="md:hidden bg-white border-t mobile-menu">
                <div class="px-6 py-4 flex flex-col gap-4">
                    <a href="#features" class="block text-surface-700 hover:text-blue-600 py-2">Features</a>
                    <a href="#highlights" class="block text-surface-700 hover:text-blue-600 py-2">Highlights</a>
                    <a href="#pricing" class="block text-surface-700 hover:text-blue-600 py-2">Pricing</a>

                    <!-- Mobile Login/Register Buttons -->
                    <div class="flex flex-col gap-2 pt-2 border-t">
                        <Button label="Login" text as="router-link" to="/auth/login" rounded class="w-full justify-center"></Button>
                        <Button label="Register" as="router-link" to="/auth/register" rounded class="w-full justify-center"></Button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <section id="hero" class="pt-32 pb-20 px-6 lg:px-20 overflow-hidden">
            <div class="max-w-7xl mx-auto">
                <div class="grid grid-cols-12 gap-12 items-center">
                    <div class="col-span-12 md:col-span-6 hero-content">
                        <div class="trust-badge">
                            <span class="badge-dot"></span>
                            <span>Trusted by 1000+ Companies</span>
                        </div>

                        <h1 class="hero-title">Revolusi <span class="gradient-text">HR Management</span> untuk Bisnis Modern</h1>

                        <p class="hero-description">Platform HRIS all-in-one yang powerful dan mudah digunakan. Otomatisasi proses HR, tingkatkan produktivitas, dan fokus pada pertumbuhan bisnis Anda.</p>

                        <div class="flex flex-col sm:flex-row gap-4">
                            <Button label="Start Free Trial" class="hero-cta-primary" rounded>
                                <template #icon>
                                    <i class="pi pi-arrow-right ml-2"></i>
                                </template>
                            </Button>
                            <Button label="Watch Demo" class="hero-cta-secondary" rounded outlined />
                        </div>

                        <div class="flex items-center gap-8 text-sm text-surface-600 mt-6">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-check-circle text-green-500"></i>
                                <span>No credit card required</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <i class="pi pi-check-circle text-green-500"></i>
                                <span>14-day free trial</span>
                            </div>
                        </div>
                    </div>

                    <div class="col-span-12 md:col-span-6 hero-image">
                        <div class="image-wrapper">
                            <div class="image-glow"></div>
                            <div class="image-card">
                                <img src="https://img.freepik.com/free-photo/asian-businesswoman-sitting-desk-office-studying-graphs-large-computer-screen_1098-20500.jpg" alt="HUREO Dashboard" class="rounded-2xl shadow-lg" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section id="features" class="py-20 px-6 lg:px-20 bg-white">
            <div class="max-w-7xl mx-auto">
                <div class="text-center mb-16 section-header">
                    <h2 class="section-title">Fitur Lengkap untuk <span class="gradient-text">Kebutuhan HR Anda</span></h2>
                    <p class="section-subtitle">Semua yang Anda butuhkan untuk mengelola HR dengan efisien dan efektif</p>
                </div>

                <div class="grid grid-cols-12 gap-8">
                    <div v-for="(feature, index) in features" :key="index" class="col-span-12 md:col-span-6 lg:col-span-4 feature-card" :style="{ animationDelay: `${index * 100}ms` }">
                        <div class="feature-icon">
                            <i :class="`pi ${feature.icon}`" class="text-3xl"></i>
                        </div>
                        <h3 class="feature-title">{{ feature.title }}</h3>
                        <p class="feature-description">{{ feature.description }}</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Highlights Section -->
        <section id="highlights" class="py-20 px-6 lg:px-20">
            <div class="max-w-7xl mx-auto">
                <div class="text-center mb-16">
                    <h2 class="section-title">Powerful <span class="gradient-text">Everywhere</span></h2>
                    <p class="section-subtitle">Akses HUREO kapan saja, dimana saja</p>
                </div>

                <!-- Mobile Highlight -->
                <div class="grid grid-cols-12 gap-12 items-center mb-24">
                    <div class="col-span-12 md:col-span-6 highlight-image-wrapper">
                        <div class="highlight-glow"></div>
                        <img src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=600&fit=crop" alt="Mobile App" class="highlight-image" />
                    </div>

                    <div class="col-span-12 md:col-span-6 highlight-content">
                        <div class="highlight-icon purple-icon">
                            <i class="pi pi-mobile text-3xl"></i>
                        </div>
                        <h3 class="highlight-title">Mobile App Excellence</h3>
                        <p class="highlight-description">Aplikasi mobile native untuk iOS dan Android. Karyawan dapat melakukan check-in/out, mengajukan cuti, dan mengakses informasi personal dengan mudah dari smartphone mereka.</p>
                        <ul class="highlight-list">
                            <li v-for="item in ['Offline mode support', 'Push notifications', 'Biometric authentication', 'Real-time sync']" :key="item">
                                <i class="pi pi-check text-green-500"></i>
                                <span>{{ item }}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Desktop Highlight -->
                <div class="grid grid-cols-12 gap-12 items-center">
                    <div class="col-span-12 md:col-span-6 highlight-content order-2 md:order-1">
                        <div class="highlight-icon yellow-icon">
                            <i class="pi pi-chart-bar text-3xl"></i>
                        </div>
                        <h3 class="highlight-title">Powerful Dashboard Analytics</h3>
                        <p class="highlight-description">Dashboard web yang comprehensive dengan visualisasi data yang intuitif. Monitor KPI, track performance, dan buat keputusan berdasarkan data real-time.</p>
                        <ul class="highlight-list">
                            <li v-for="item in ['Custom reports builder', 'Advanced filtering', 'Export to multiple formats', 'Scheduled reports']" :key="item">
                                <i class="pi pi-check text-green-500"></i>
                                <span>{{ item }}</span>
                            </li>
                        </ul>
                    </div>

                    <div class="col-span-12 md:col-span-6 highlight-image-wrapper order-1 md:order-2">
                        <div class="highlight-glow"></div>
                        <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop" alt="Desktop Dashboard" class="highlight-image" />
                    </div>
                </div>
            </div>
        </section>

        <!-- Pricing Section -->
        <section id="pricing" class="py-20 px-6 lg:px-20 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div class="max-w-7xl mx-auto">
                <div class="text-center mb-16">
                    <h2 class="section-title">Harga yang <span class="gradient-text">Transparan</span></h2>
                    <p class="section-subtitle">Pilih paket yang sesuai dengan kebutuhan bisnis Anda</p>
                </div>

                <div class="grid grid-cols-12 gap-8">
                    <div v-for="(plan, index) in pricingPlans" :key="index" :class="['col-span-12 md:col-span-4 pricing-card', { 'popular-card': plan.popular }]">
                        <div v-if="plan.popular" class="popular-badge">MOST POPULAR</div>

                        <div :class="`card-top-bar bg-gradient-to-r ${plan.gradient}`"></div>

                        <div class="pricing-content">
                            <h3 class="pricing-name">{{ plan.name }}</h3>
                            <p class="pricing-desc">{{ plan.description }}</p>

                            <div class="pricing-price-wrapper">
                                <div class="pricing-price">
                                    <span class="price-amount">{{ plan.price }}</span>
                                    <span v-if="plan.price !== 'Free' && plan.price !== 'Custom'" class="price-period">/bulan</span>
                                </div>
                                <p class="price-period-text">{{ plan.period }}</p>
                            </div>

                            <Button :label="plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'" :class="plan.popular ? 'pricing-btn-popular' : 'pricing-btn-normal'" class="w-full mb-8" rounded />

                            <Divider class="my-6" />

                            <ul class="pricing-features">
                                <li v-for="(feature, i) in plan.features" :key="i">
                                    <i class="pi pi-check text-green-500"></i>
                                    <span>{{ feature }}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="py-20 px-6 lg:px-20 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div class="max-w-4xl mx-auto text-center cta-section">
                <h2 class="cta-title">Siap Transformasi HR Anda?</h2>
                <p class="cta-description">Bergabunglah dengan ribuan perusahaan yang telah mempercayai HUREO untuk mengelola HR mereka</p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button label="Daftar Sekarang" as="router-link" to="/auth/register" class="cta-btn-white" rounded />
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-surface-900 text-white py-12 px-6 lg:px-20">
            <div class="max-w-7xl mx-auto mt-12 pt-8 border-t border-surface-800 text-center text-surface-400">
                <p>&copy; 2025 HUREO HRIS. All rights reserved.</p>
            </div>
        </footer>
    </div>
</template>

<style scoped>
/* Navigation */
.nav-scrolled {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.logo-box {
    width: 2.5rem;
    height: 2.5rem;
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s ease;
}

.logo-box:hover {
    transform: rotate(12deg);
}

.logo-text {
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.nav-link {
    color: #374151;
    transition: color 0.3s ease;
}

.nav-link:hover {
    color: #2563eb;
}

.cta-button {
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
    border: none;
    color: white;
    transition: all 0.3s ease;
}

.cta-button:hover {
    transform: scale(1.05);
    box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.5);
}

.mobile-menu {
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Hero Section */
.hero-content {
    animation: slideInLeft 0.8s ease-out;
}

.trust-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: #dbeafe;
    color: #1e40af;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 2rem;
}

.badge-dot {
    width: 0.5rem;
    height: 0.5rem;
    background: #2563eb;
    border-radius: 50%;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.hero-title {
    font-size: clamp(2.5rem, 5vw, 3.75rem);
    font-weight: 700;
    color: #111827;
    line-height: 1.2;
    margin-bottom: 1.5rem;
}

.gradient-text {
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.hero-description {
    font-size: 1.25rem;
    color: #4b5563;
    line-height: 1.75;
    margin-bottom: 2rem;
}

.hero-cta-primary {
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
    border: none;
    color: white;
    padding: 1rem 2rem;
    font-weight: 600;
    transition: all 0.3s ease;
}

.hero-cta-primary:hover {
    transform: scale(1.05);
    box-shadow: 0 20px 40px -10px rgba(37, 99, 235, 0.5);
}

.hero-cta-secondary {
    border: 2px solid #2563eb;
    color: #2563eb;
    padding: 1rem 2rem;
    font-weight: 600;
    transition: all 0.3s ease;
}

.hero-cta-secondary:hover {
    background: #eff6ff;
}

.hero-image {
    animation: slideInRight 0.8s ease-out;
}

.image-wrapper {
    position: relative;
}

.image-glow {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
    border-radius: 1.5rem;
    filter: blur(3rem);
    opacity: 0.3;
    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.image-card {
    position: relative;
    background: white;
    border-radius: 1.5rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    transition: transform 0.5s ease;
}

.image-card:hover {
    transform: scale(1.05);
}

@keyframes slideInLeft {
    from {
        opacity: 0;
        transform: translateX(-50px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(50px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

/* Features Section */
.section-header {
    animation: fadeInUp 0.6s ease-out;
}

.section-title {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 700;
    color: #111827;
    margin-bottom: 1rem;
}

.section-subtitle {
    font-size: 1.25rem;
    color: #6b7280;
    max-width: 48rem;
    margin: 0 auto;
}

.feature-card {
    background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    border: 1px solid #dbeafe;
    transition: all 0.3s ease;
    animation: fadeInUp 0.6s ease-out both;
}

.feature-card:hover {
    transform: translateY(-0.5rem);
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.15);
}

.feature-icon {
    width: 4rem;
    height: 4rem;
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    margin-bottom: 1.5rem;
    transition: all 0.3s ease;
}

.feature-card:hover .feature-icon {
    transform: scale(1.1) rotate(6deg);
}

.feature-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.75rem;
}

.feature-description {
    color: #6b7280;
    line-height: 1.75;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Highlights Section */
.highlight-image-wrapper {
    border-radius: 1.5rem;
    padding: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.purple-gradient {
    background: linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%);
}

.yellow-gradient {
    background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
}

.highlight-glow {
    position: absolute;
    inset: 0;
    border-radius: 1.5rem;
    filter: blur(2rem);
    opacity: 0.3;
    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.purple-glow {
    background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
}

.yellow-glow {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.highlight-image {
    position: relative;
    border-radius: 1.5rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    transition: transform 0.5s ease;
}

.highlight-image:hover {
    transform: scale(1.05);
}

.highlight-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.highlight-icon {
    width: 4rem;
    height: 4rem;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.purple-icon {
    background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
}

.yellow-icon {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.highlight-title {
    font-size: 2rem;
    font-weight: 700;
    color: #111827;
}

.highlight-description {
    font-size: 1.25rem;
    color: #6b7280;
    line-height: 1.75;
}

.highlight-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    list-style: none;
    padding: 0;
}

.highlight-list li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #374151;
}

/* Pricing Section */
.pricing-card {
    position: relative;
    background: white;
    border-radius: 1.5rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: all 0.3s ease;
}

.pricing-card:hover {
    transform: translateY(-0.5rem);
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.15);
}

.popular-card {
    ring: 4px;
    ring-color: #2563eb;
}

.popular-badge {
    position: absolute;
    top: 0;
    right: 0;
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
    color: white;
    padding: 0.5rem 1.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    border-bottom-left-radius: 1rem;
    z-index: 10;
}

.card-top-bar {
    height: 0.5rem;
}

.pricing-content {
    padding: 2rem;
}

.pricing-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.5rem;
}

.pricing-desc {
    color: #6b7280;
    margin-bottom: 1.5rem;
}

.pricing-price-wrapper {
    margin-bottom: 1.5rem;
}

.pricing-price {
    display: flex;
    align-items: baseline;
    margin-bottom: 0.25rem;
}

.price-amount {
    font-size: 3rem;
    font-weight: 700;
    color: #111827;
}

.price-period {
    color: #6b7280;
    margin-left: 0.5rem;
}

.price-period-text {
    color: #9ca3af;
    font-size: 0.875rem;
}

.pricing-btn-popular {
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
    border: none;
    color: white;
    padding: 1rem;
    font-weight: 600;
    transition: all 0.3s ease;
}

.pricing-btn-popular:hover {
    transform: scale(1.05);
    box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.5);
}

.pricing-btn-normal {
    background: #f3f4f6;
    border: none;
    color: #111827;
    padding: 1rem;
    font-weight: 600;
    transition: all 0.3s ease;
}

.pricing-btn-normal:hover {
    background: #e5e7eb;
}

.pricing-features {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    list-style: none;
    padding: 0;
}

.pricing-features li {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    color: #374151;
}

.pricing-features li i {
    flex-shrink: 0;
    margin-top: 0.125rem;
}

/* CTA Section */
.cta-section {
    animation: fadeInUp 0.6s ease-out;
}

.cta-title {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 700;
    color: white;
    margin-bottom: 1.5rem;
}

.cta-description {
    font-size: 1.25rem;
    color: #bfdbfe;
    margin-bottom: 2rem;
}

.cta-btn-white {
    background: white;
    border: none;
    color: #2563eb;
    padding: 1rem 2rem;
    font-weight: 600;
    transition: all 0.3s ease;
}

.cta-btn-white:hover {
    transform: scale(1.05);
    box-shadow: 0 20px 40px -10px rgba(255, 255, 255, 0.5);
}

.cta-btn-outline {
    border: 2px solid white;
    color: white;
    background: transparent;
    padding: 1rem 2rem;
    font-weight: 600;
    transition: all 0.3s ease;
}

.cta-btn-outline:hover {
    background: rgba(255, 255, 255, 0.1);
}

/* Footer */
.footer-link {
    transition: color 0.3s ease;
}

.footer-link:hover {
    color: white;
}

/* Animations */
@keyframes pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

/* Responsive */
@media (max-width: 768px) {
    .hero-title {
        font-size: 2rem;
    }

    .section-title {
        font-size: 1.875rem;
    }

    .highlight-title {
        font-size: 1.5rem;
    }

    .cta-title {
        font-size: 1.875rem;
    }
}

/* Smooth scroll */
html {
    scroll-behavior: smooth;
}

/* Custom scrollbar */
::-webkit-scrollbar {
    width: 10px;
}

::-webkit-scrollbar-track {
    background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
    border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%);
}
</style>
