<template>
  <div class="flex flex-col w-full h-[100vh] bg-[#f6f6f6]">
    <div class="text-base font-bold text-white bg-[#3b62f0] p-[16px] flex items-center gap-2 shadow-xl">
      <img src="/assets/image/healink.png" class="w-[32px] h-[32px]" />
      Healink
    </div>

    <div class="flex flex-1 p-[16px] items-center justify-center">
      <div class="flex flex-col bg-white w-full max-w-md p-[32px] shadow-lg rounded-xl items-center">
        
        <h2 class="text-2xl font-bold text-[#3b62f0] mb-2">Buat Akun Anda</h2>
        <p class="text-gray-500 mb-6">Isi data di bawah ini untuk memulai.</p>

        <form class="w-full flex flex-col gap-4">

          <div>
            <label for="fullname" class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input 
              type="text" 
              id="fullname" 
              name="fullname" 
              placeholder="John Doe"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b62f0]" 
            />
          </div>
          
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              placeholder="you@example.com"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b62f0]" 
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              placeholder="••••••••"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b62f0]"
            />
          </div>
          
          <div>
            <label for="confirm_password" class="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
            <input 
              type="password" 
              id="confirm_password" 
              name="confirm_password" 
              placeholder="••••••••"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b62f0]"
            />
          </div>

          <button 
            type="submit" 
            class="mt-4 bg-[#3b62f0] text-white rounded-lg px-2 py-3 font-semibold hover:bg-[#244fec] focus:outline-none focus:ring-2 focus:ring-[#244fec] w-full"
          >
            Daftar
          </button>
        </form>

        <div class="mt-6 text-sm">
          <p class="text-gray-600">
            Sudah punya akun?
            <NuxtLink to="/login" class="font-medium text-[#fe5b19] hover:underline">
              Login di sini
            </NuxtLink>
          </p>
        </div>

      </div>
    </div>
  </div>
</template>