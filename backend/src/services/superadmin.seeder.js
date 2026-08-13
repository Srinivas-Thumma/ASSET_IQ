import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import logger from '../config/logger.js';

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@assetiq.com';
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin123!';

/**
 * Ensures a single global Super Admin exists with organizationId = null
 */
export const ensureSuperAdminExists = async () => {
  try {
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      logger.info(`👑 Super Admin account ready: ${existingSuperAdmin.email}`);
      return existingSuperAdmin;
    }

    // Check if user exists by email
    const emailUser = await User.findOne({ email: SUPERADMIN_EMAIL.toLowerCase().trim() });
    if (emailUser) {
      emailUser.role = 'super_admin';
      emailUser.organizationId = null;
      emailUser.organizationName = '';
      emailUser.status = 'active';
      await emailUser.save();
      logger.info(`👑 Upgraded existing user ${emailUser.email} to Super Admin`);
      return emailUser;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(SUPERADMIN_PASSWORD, salt);

    const superAdmin = await User.create({
      email: SUPERADMIN_EMAIL.toLowerCase().trim(),
      passwordHash,
      role: 'super_admin',
      organizationId: null, // Superadmin is platform-wide, not tied to any organization
      organizationName: '',
      employeeRef: null,
      status: 'active'
    });

    logger.info('====================================================');
    logger.info('👑 GLOBAL SUPER ADMIN CREATED:');
    logger.info(`   Email:    ${SUPERADMIN_EMAIL}`);
    logger.info(`   Password: ${SUPERADMIN_PASSWORD}`);
    logger.info('   Role:     super_admin (No Organization ID)');
    logger.info('====================================================');

    return superAdmin;
  } catch (error) {
    logger.error(`❌ Failed to ensure Super Admin exists: ${error.message}`, error);
  }
};

export default ensureSuperAdminExists;
