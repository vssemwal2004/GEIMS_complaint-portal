import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiUsers, 
  FiMessageSquare, 
  FiPlusCircle, 
  FiLogOut,
  FiMenu,
  FiX,
  FiUser,
  FiChevronDown,
  FiKey
} from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [studentsMenuOpen, setStudentsMenuOpen] = useState(false);
  const [studentNavOpen, setStudentNavOpen] = useState(false);
  const profileRef = useRef(null);
  const studentsMenuRef = useRef(null);
  const studentNavRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (studentsMenuRef.current && !studentsMenuRef.current.contains(e.target)) {
        setStudentsMenuOpen(false);
      }
      if (studentNavRef.current && !studentNavRef.current.contains(e.target)) {
        setStudentNavOpen(false);
      }
    };
    if (profileOpen || studentsMenuOpen || studentNavOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileOpen, studentsMenuOpen, studentNavOpen]);

  const adminNavItems = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/students', label: 'Students' },
    { path: '/admin/complaints', label: 'Complaints' },
  ];

  const studentNavItems = [
    { path: '/student', label: 'Dashboard' },
    { path: '/student/complaints', label: 'My Complaints' },
    { path: '/student/submit', label: 'Submit Complaint' },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  const isActive = (path) => {
    const currentPath = (router.asPath || '').split('?')[0];
    if (path === '/admin' || path === '/student') {
      return currentPath === path || currentPath === `${path}/dashboard`;
    }
    return currentPath.startsWith(path);
  };

  // Admin Top Navbar Layout
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top Navbar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left: Logo & Nav */}
              <div className="flex items-center gap-8">
                <Link href="/admin" className="flex items-center gap-2">
                  <Image
                    src="/geims-logo.webp"
                    alt="GEIMS"
                    width={80}
                    height={32}
                    className="h-8 w-auto"
                    priority
                  />
                </Link>
                <div className="hidden md:flex items-center gap-1">
                  {adminNavItems.map((item) => {
                    if (item.path === '/admin/students') {
                      const active = isActive('/admin/students') || isActive('/admin/add-student');
                      return (
                        <div key={item.path} className="relative" ref={studentsMenuRef}>
                          <button
                            type="button"
                            onClick={() => setStudentsMenuOpen((v) => !v)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              active
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <span className="inline-flex items-center gap-1">
                              <span>Students</span>
                              <FiChevronDown
                                size={16}
                                className={`transition-transform ${studentsMenuOpen ? 'rotate-180' : ''}`}
                              />
                            </span>
                          </button>

                          {studentsMenuOpen && (
                            <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-sm py-1">
                              <Link
                                href="/admin/students"
                                onClick={() => setStudentsMenuOpen(false)}
                                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Student Database
                              </Link>
                              <Link
                                href="/admin/add-student"
                                onClick={() => setStudentsMenuOpen(false)}
                                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Add Student
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive(item.path)
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Right: Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                    <p className="text-xs text-gray-500">Admin</p>
                  </div>
                  <FiChevronDown className={`text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                    </div>
                    <Link
                      href="/ChangePassword"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FiKey size={16} />
                      <span>Change Password</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FiLogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    );
  }

  // Student Sidebar Layout (unchanged)

  // Student Top Navbar Layout (new)
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo */}
            <Link href="/student" className="flex items-center gap-2">
              <Image
                src="/geims-logo.webp"
                alt="GEIMS"
                width={80}
                height={32}
                className="h-7 w-auto"
                priority
              />
            </Link>

            {/* Center: Nav (desktop) */}
            <div className="hidden md:flex items-center justify-center flex-1">
              <div className="flex items-center gap-8">
                {studentNavItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`text-sm font-medium px-1 py-2 transition-colors border-b-2 ${
                        active
                          ? 'text-primary-700 border-primary-600'
                          : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-200'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right: Mobile menu + Profile */}
            <div className="flex items-center gap-2">
              {/* Back to Home (desktop/tablet) */}
              <Link
                href="/"
                className="hidden sm:inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
              >
                Back to Home
              </Link>

              {/* Mobile nav */}
              <div className="md:hidden relative" ref={studentNavRef}>
                <button
                  type="button"
                  onClick={() => setStudentNavOpen((v) => !v)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-50 text-gray-700"
                  aria-label="Open navigation"
                >
                  <FiMenu size={18} />
                </button>

                {studentNavOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-sm py-1">
                    <Link
                      href="/"
                      onClick={() => setStudentNavOpen(false)}
                      className="block px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
                    >
                      Back to Home
                    </Link>
                    <div className="my-1 border-t border-gray-100" />
                    {studentNavItems.map((item) => {
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          onClick={() => setStudentNavOpen(false)}
                          className={`block px-3 py-2 text-sm ${
                            active ? 'text-primary-700 bg-primary-50' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-50 text-gray-700"
                  aria-label="Open profile"
                >
                  <FiUser size={18} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-sm py-1">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <Link
                      href="/ChangePassword"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FiKey size={16} />
                      <span>Change Password</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <FiLogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
