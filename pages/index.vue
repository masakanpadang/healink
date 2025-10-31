<template>
  <div class="flex flex-col w-full min-h-[100vh] bg-[#f6f6f6]">
    <div class="text-sm sm:text-base font-bold text-white bg-[#3b62f0] p-[12px] sm:p-[16px] flex items-center gap-2 shadow-xl">
      <img src="/assets/image/healink.png" class="w-[24px] h-[24px] sm:w-[32px] sm:h-[32px]" />
      Healink
    </div>
    <div class="flex flex-1 p-[12px] sm:p-[16px] items-center justify-center overflow-y-auto">
      <div class="flex flex-col bg-white w-full sm:w-[90vw] md:w-[70vw] lg:w-[50vw] p-[16px] sm:p-[24px] md:p-[32px] shadow-lg rounded-xl items-center my-auto">
        <p class="text-[#3b62f0] font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl mb-2 sm:mb-4 text-center">Good luck operasinya, dok!</p>
        
        <p class="text-[#3b62f0] font-bold text-xs sm:text-sm md:text-base mb-1 sm:mb-2">Join As:</p>

        <img src="/assets/image/connect.png" class="w-[80px] sm:w-[120px] md:w-[150px] lg:w-[180px] my-2" />

        <NuxtLink to="/host" class="w-full">
          <button class="flex items-center justify-center mt-2 sm:mt-4 text-xs sm:text-sm md:text-base bg-[#3b62f0] text-white rounded-lg px-4 py-2 hover:bg-[#244fec] focus:outline-none focus:ring-2 focus:ring-[#244fec] gap-4 w-full">
            Host
          </button>
        </NuxtLink>

        <NuxtLink to="/participant" class="w-full">
          <button class="flex items-center justify-center mt-2 sm:mt-4 text-xs sm:text-sm md:text-base bg-[#fe5b19] text-white rounded-lg px-4 py-2 hover:bg-[#e55217] focus:outline-none focus:ring-2 focus:ring-[#e55217] gap-4 w-full">
            Proctor
          </button>
        </NuxtLink>

        <div class="mt-3 sm:mt-6 text-xs sm:text-sm">
          <p class="text-gray-600 text-center">
            Already have an account?
            <NuxtLink to="/login" class="font-medium text-[#3b62f0] hover:underline">
              Login
            </NuxtLink>
          </p>
        </div>
        
      </div>
    </div>
  </div>
</template>