export const env = {
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL ??
    "https://travel-agency-backend-vmbz.onrender.com",
  APP_NAME: import.meta.env.VITE_APP_NAME ?? "Ulmind Travel",
  RAZORPAY_KEY_ID:
    import.meta.env.VITE_RAZORPAY_KEY_ID ?? "rzp_test_placeholder",
};