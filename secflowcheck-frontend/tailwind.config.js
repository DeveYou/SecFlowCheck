module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./sections/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-gray': '#111827',
        'light-gray-1': '#ECEDEF',
        'light-gray-0': '#F2F4F6',
        'light-purple' : '#964F81',
        'dark-purple' : '#604058',
        'light-green' : '#19D2BA',
        'dark-green' : '#017E84',
        'light-blue' : '#249BD8',
        'dark-pink' : '#FC868B',
        'dark-orange' : '#F99432',
      },
    },
  },
  plugins: [],
}