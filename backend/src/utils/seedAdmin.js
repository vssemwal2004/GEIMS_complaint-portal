/**
 * Admin Seeder
 * 
 * Seeds the admin user on server startup if not exists.
 * Admin credentials are loaded from environment variables.
 * 
 * Security Considerations:
 * - Admin credentials from environment only
 * - Password is hashed before storage
 * - Only creates admin if not exists
 */

import User, { USER_ROLES } from '../models/User.js';

/**
 * Seed admin user from environment variables
 * @returns {Promise<void>}
 */
const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Validate required environment variables
    if (!adminEmail || !adminPassword) {
      console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables');
      return;
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: adminEmail.toLowerCase(),
      role: USER_ROLES.ADMIN 
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create admin user
    const admin = new User({
      name: 'System Administrator',
      email: adminEmail.toLowerCase(),
      passwordHash: adminPassword, // Will be hashed by pre-save hook
      role: USER_ROLES.ADMIN,
      forcePasswordChange: false, // Admin doesn't need to change password
      isActive: true,
    });

    await admin.save();
    console.log(`✅ Admin user created successfully: ${adminEmail}`);

  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    // Don't throw - allow server to start even if seeding fails
  }
};

export default seedAdmin;
