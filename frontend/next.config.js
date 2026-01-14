const nextConfig = {
  reactStrictMode: true,
  basePath: '/sc',
  assetPrefix: '/sc',
  trailingSlash: false,

  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
      { source: '/uploads/:path*', destination: `${backendUrl}/uploads/:path*` },

      // Auth routes
      { source: '/login', destination: '/Login' },
      { source: '/forgot-password', destination: '/ForgotPassword' },
      { source: '/reset-password', destination: '/ResetPassword' },
      { source: '/change-password', destination: '/ChangePassword' },

      // Admin
      { source: '/admin', destination: '/admin/Dashboard' },
      { source: '/admin/dashboard', destination: '/admin/Dashboard' },
      { source: '/admin/students', destination: '/admin/Students' },
      { source: '/admin/add-student', destination: '/admin/AddStudent' },
      { source: '/admin/complaints', destination: '/admin/Complaints' },

      // Student
      { source: '/student', destination: '/student/Dashboard' },
      { source: '/student/dashboard', destination: '/student/Dashboard' },
      { source: '/student/complaints', destination: '/student/Complaints' },
      { source: '/student/submit', destination: '/student/SubmitComplaint' },
    ];
  },
};

module.exports = nextConfig;




