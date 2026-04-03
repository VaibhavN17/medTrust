/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["http://127.0.0.1:3000", "http://192.168.100.253:3000"],

  images: {
    domains: [
      'localhost',
      '127.0.0.1',
      'medtrust-docs.s3.ap-south-1.amazonaws.com',
      'medtrust-docs.s3.amazonaws.com',
      'via.placeholder.com',
      'images.unsplash.com',
    ],
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  },
};

module.exports = nextConfig;