/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase storage
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Your specific Supabase project domain
      {
        protocol: 'https',
        hostname: 'nsyfksvtkjmyhvdmxqsi.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Wix static images
      {
        protocol: 'https',
        hostname: 'static.wixstatic.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
