<template>
    <div class="flex w-full min-h-screen items-center justify-center p-4">
        <div class="flex flex-col gap-6 w-full max-w-[500px]">
            <!-- Section Meeting dengan Dokter A -->
            <div class="flex flex-col p-[16px] bg-white rounded-xl shadow-lg">
                <p class="text-center text-gray-700 font-medium mb-4">Lakukan meeting dengan:</p>
                <NuxtLink to="/host/testing/room" class="w-full">
                    <button class="flex items-center justify-center text-sm sm:text-base bg-[#3b62f0] text-white rounded-lg px-4 py-3 hover:bg-[#244fec] focus:outline-none focus:ring-2 focus:ring-[#244fec] gap-4 w-full">
                        Dokter A
                    </button>
                </NuxtLink>
            </div>

            <!-- Section Generate Room Baru (diperkecil) -->
            <div class="flex flex-col p-[12px] sm:p-[16px] bg-gray-100 rounded-xl shadow-md">
                <p class="text-center text-sm sm:text-base mb-2">Buat Room Teleproctoring Baru</p>
                <div class="flex items-center justify-center text-[#3b62f0] font-bold text-lg sm:text-xl mb-2">
                    <p v-if="roomID"> {{ roomID }} </p>
                    <p v-else>-</p>
                </div>

                <NuxtLink v-if="roomID" :to="`/host/${roomID}/room`" class="w-full">
                    <button class="flex items-center justify-center text-xs sm:text-sm bg-[#3b62f0] text-white rounded-lg px-3 py-2 hover:bg-[#244fec] focus:outline-none gap-4 w-full">
                        Join
                    </button>
                </NuxtLink>
                <button v-else class="flex items-center justify-center text-xs sm:text-sm bg-[#3b62f0] text-white rounded-lg px-3 py-2 hover:bg-[#244fec] focus:outline-none gap-4 w-full" @click="generateRoomID">
                    Buat Room
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const roomID = ref('')

const generateRoomID = () => {
    if (roomID.value) return

    const generatedID = Math.random().toString(36).substring(2, 7).toUpperCase()
    const prefixID = 'RS'

    roomID.value = `${prefixID}-${generatedID}`
}
</script>