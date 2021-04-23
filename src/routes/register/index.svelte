<section class="min-h-full flex items-center justify-center bg-gray-50 py-40 sm:py-40 px-8 sm:px-6 lg:px-8">
  <!-- <div class="max-w-md w-full space-y-8"> -->
  <div class="max-w-md w-full space-y-8">
    <div class="bg-white px-6 py-8 rounded shadow-md text-black w-full">
    <h2 class="mb-8 text-3xl text-center font-extrabold text-gray-900">
      Sign up
    </h2>
      <input 
          type="text"
          class="block border border-grey-light w-full p-3 rounded mb-4"
          name="fullname"
          placeholder="Full Name" />

      <input 
          type="text"
          class="block border border-grey-light w-full p-3 rounded mb-4"
          name="email"
          placeholder="Email" />

      <input 
          type="password"
          class="block border border-grey-light w-full p-3 rounded mb-4"
          name="password"
          placeholder="Password" />
      <input 
          type="password"
          class="block border border-grey-light w-full p-3 rounded mb-4"
          name="confirm_password"
          placeholder="Confirm Password" />

      <button
          type="submit"
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
      >Create Account</button>

      <div class="text-center text-sm text-grey-dark mt-4">
        By signing up, you agree to the 
        <a class="no-underline border-b border-grey-dark text-grey-dark" href="#/terms-of-service">
            Terms of Service
        </a> and 
        <a class="no-underline border-b border-grey-dark text-grey-dark" href="#/privacy-policy">
            Privacy Policy
        </a>
      </div>
    </div>

    <div class="text-grey-dark mt-6">
        Already have an account? 
        <a class="no-underline border-b border-blue text-blue" href="/login/">
            Log in
        </a>.
    </div>
  </div>
</section>
