import mongoose from 'mongoose';
import { MONGODB_URI } from './config/env.js';
import { ensureSuperAdminExists } from './services/superadmin.seeder.js';

const run = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB:', MONGODB_URI);

    const superAdmin = await ensureSuperAdminExists();
    console.log('Super Admin user:', {
      _id: superAdmin._id,
      email: superAdmin.email,
      role: superAdmin.role,
      organizationId: superAdmin.organizationId,
      status: superAdmin.status
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding Super Admin:', err);
    process.exit(1);
  }
};

run();
