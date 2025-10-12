<script setup>
const year = new Date().getFullYear();
</script>

<template>
    <footer class="layout-footer border-top-1 surface-border py-5 px-4 sm:px-6">
        <div class="flex flex-column sm:flex-row align-items-center sm:justify-content-between gap-3">
            <!-- Brand -->
            <div class="flex align-items-center gap-3">
                <div class="text-600 text-sm">© {{ year }} HUREO HRIS. All rights reserved.</div>
            </div>

            <!-- Copy -->
        </div>
    </footer>
</template>
