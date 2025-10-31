<template>
    <div class="flex w-full min-h-screen items-center justify-center p-4">
        <div class="flex flex-col gap-6 w-full max-w-[500px]">
            <!-- Section Meeting dengan Dokter B -->
            <div class="flex flex-col p-[16px] bg-white rounded-xl shadow-lg">
                <p class="text-center text-gray-700 font-medium mb-4">Lakukan meeting dengan:</p>
                <NuxtLink to="/participant/testing/room" class="w-full">
                    <button class="flex items-center justify-center text-sm sm:text-base bg-[#fe5b19] text-white rounded-lg px-4 py-3 hover:bg-[#e55217] focus:outline-none focus:ring-2 focus:ring-[#e55217] gap-4 w-full">
                        Dokter B
                    </button>
                </NuxtLink>
            </div>

            <!-- Section Join Room ID (diperkecil) -->
            <div class="flex flex-col p-[12px] sm:p-[16px] bg-gray-100 rounded-xl shadow-md gap-3">
                <p class="text-center text-sm sm:text-base">Use Room's ID to Join</p>
                
                <input type="text" class="text-xs sm:text-sm border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#3b62f0] text-center h-[35px]" placeholder="input the id" v-model="roomID">
                
                <NuxtLink :to="`/participant/${roomID}/room`" class="w-full">
                    <button class="flex items-center justify-center text-xs sm:text-sm bg-[#fe5b19] text-white rounded-lg px-3 py-2 hover:bg-[#e55217] focus:outline-none gap-4 w-full">
                        Join
                    </button>
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const roomID = ref('')
</script>