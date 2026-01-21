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
  FiKey,
  FiMail,
  FiCalendar,
  FiSettings,
  FiActivity
} from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

// Sub-Admins Dropdown Menu
const SubAdminsMenu = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const isActive = () => {
    const path = router.asPath.split('?')[0];
    return path.startsWith('/admin/sub-admin') || path === '/admin/add-sub-admin';
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive()
            ? 'bg-indigo-50 text-indigo-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <span className="inline-flex items-center gap-1">
          <span>Sub-Admins</span>
          <FiChevronDown
            size={16}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-sm py-1 z-50">
          <Link
            href="/admin/sub-admins"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Sub-Admin Database
          </Link>
          <Link
            href="/admin/add-sub-admin"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Add Sub-Admin
          </Link>
        </div>
      )}
    </div>
  );
};

// Employees Dropdown Menu
const EmployeesMenu = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const isActive = () => {
    const path = router.asPath.split('?')[0];
    return path.startsWith('/admin/employee') || path === '/admin/add-employee';
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive()
            ? 'bg-teal-50 text-teal-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <span className="inline-flex items-center gap-1">
          <span>Employees</span>
          <FiChevronDown
            size={16}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-sm py-1 z-50">
          <Link
            href="/admin/employees"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Employee Database
          </Link>
          <Link
            href="/admin/add-employee"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Add Employee
          </Link>
        </div>
      )}
    </div>
  );
};

// System Management Dropdown Menu
const SystemManagementMenu = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const isActive = () => {
    const path = router.asPath.split('?')[0];
    return path.startsWith('/admin/email-config') || 
           path.startsWith('/admin/attendance-management') ||
           path.startsWith('/admin/activity-log');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1 ${
          isActive()
            ? 'bg-purple-50 text-purple-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <FiSettings size={16} />
        <span className="hidden lg:inline">System</span>
        <FiChevronDown
          size={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-sm py-1 z-50">
          <Link
            href="/admin/attendance-management"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FiCalendar size={16} />
            <span>Attendance Management</span>
          </Link>
          <Link
            href="/admin/email-config"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FiMail size={16} />
            <span>Email Configuration</span>
          </Link>
          <Link
            href="/admin/activity-log"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FiActivity size={16} />
            <span>Activity Log</span>
          </Link>
        </div>
      )}
    </div>
  );
};

// Database Dropdown Menu (for Sub-Admin)
const DatabaseMenu = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const isActive = () => {
    const path = router.asPath.split('?')[0];
    return path.startsWith('/sub-admin/student-database') || path.startsWith('/sub-admin/employee-database');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive()
            ? 'bg-indigo-50 text-indigo-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <span className="inline-flex items-center gap-1">
          <span>Database</span>
          <FiChevronDown
            size={16}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-sm py-1 z-50">
          <Link
            href="/sub-admin/student-database"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Student Database
          </Link>
          <Link
            href="/sub-admin/employee-database"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Employee Database
          </Link>
        </div>
      )}
    </div>
  );
};

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [studentsMenuOpen, setStudentsMenuOpen] = useState(false);
  const [studentNavOpen, setStudentNavOpen] = useState(false);
  const [employeeNavOpen, setEmployeeNavOpen] = useState(false);
  const profileRef = useRef(null);
  const studentsMenuRef = useRef(null);
  const studentNavRef = useRef(null);
  const employeeNavRef = useRef(null);

  const isSubAdmin = user?.role === 'SUB_ADMIN';
  const isEmployee = user?.role === 'EMPLOYEE';
  const isStudent = user?.role === 'STUDENT';

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
      if (employeeNavRef.current && !employeeNavRef.current.contains(e.target)) {
        setEmployeeNavOpen(false);
      }
    };
    if (profileOpen || studentsMenuOpen || studentNavOpen || employeeNavOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileOpen, studentsMenuOpen, studentNavOpen, employeeNavOpen]);

  const adminNavItems = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/students', label: 'Students' },
    { path: '/admin/complaints', label: 'Complaints' },
  ];

  const subAdminNavItems = [
    { path: '/sub-admin/dashboard', label: 'Dashboard' },
    { path: '/sub-admin/complaints', label: 'Complaints' },
  ];

  const employeeNavItems = [
    { path: '/employee/dashboard', label: 'Dashboard' },
    { path: '/employee/submit-complaint', label: 'Submit Complaint' },
    { path: '/employee/complaints', label: 'My Complaints' },
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
                    src="/sc/geims-logo.webp"
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
                            <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-sm py-1 z-50">
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
                  
                  {/* Sub-Admins Menu */}
                  <SubAdminsMenu />
                  
                  {/* Employees Menu */}
                  <EmployeesMenu />
                  
                  {/* System Management Menu */}
                  <SystemManagementMenu />
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

  // Sub-Admin Top Navbar Layout
  if (isSubAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-8">
                <Link href="/sub-admin/dashboard" className="flex items-center gap-2">
                  <Image src="/sc/geims-logo.webp" alt="GEIMS" width={80} height={32} className="h-8 w-auto" priority />
                </Link>
                <div className="hidden md:flex items-center gap-1">
                  {subAdminNavItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                  
                  {/* Database Dropdown Menu */}
                  <DatabaseMenu />
                </div>
              </div>
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                    <p className="text-xs text-gray-500">Sub-Admin</p>
                  </div>
                  <FiChevronDown className={`text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                      {user?.department && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-[11px] text-gray-400 uppercase tracking-wide">Department</p>
                          <p className="text-xs font-medium text-indigo-600">{user.department}</p>
                        </div>
                      )}
                    </div>
                    <Link href="/ChangePassword" onClick={() => setProfileOpen(false)} className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <FiKey size={16} />
                      <span>Change Password</span>
                    </Link>
                    <button onClick={() => { logout(); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <FiLogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    );
  }

  // Employee Top Navbar Layout
  if (isEmployee) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-8">
                <Link href="/employee/dashboard" className="flex items-center gap-2">
                  <Image src="/sc/geims-logo.webp" alt="GEIMS" width={80} height={32} className="h-8 w-auto" priority />
                </Link>
                <div className="hidden md:flex items-center gap-1">
                  {employeeNavItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? 'bg-teal-50 text-teal-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right: Mobile menu + Profile */}
              <div className="flex items-center gap-2">
                {/* Mobile nav */}
                <div className="md:hidden relative" ref={employeeNavRef}>
                  <button
                    type="button"
                    onClick={() => setEmployeeNavOpen((v) => !v)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-50 text-gray-700"
                    aria-label="Open navigation"
                  >
                    <FiMenu size={18} />
                  </button>

                  {employeeNavOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-sm py-1">
                      {employeeNavItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                          <Link
                            key={item.path}
                            href={item.path}
                            onClick={() => setEmployeeNavOpen(false)}
                            className={`block px-3 py-2 text-sm ${
                              active ? 'text-teal-700 bg-teal-50' : 'text-gray-700 hover:bg-gray-50'
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
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                      <p className="text-xs text-gray-500">Employee</p>
                    </div>
                    <FiChevronDown className={`text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                        {user?.department && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Department</p>
                            <p className="text-xs font-medium text-teal-600">{user.department}</p>
                          </div>
                        )}
                      </div>
                      <Link href="/ChangePassword" onClick={() => setProfileOpen(false)} className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <FiKey size={16} />
                        <span>Change Password</span>
                      </Link>
                      <button onClick={() => { logout(); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors">
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
  }

  // Student Top Navbar Layout
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo */}
            <Link href="/student" className="flex items-center gap-2">
              <Image
                src="/sc/geims-logo.webp"
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
