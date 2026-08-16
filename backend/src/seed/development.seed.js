import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load development env config
dotenv.config({
  path: path.resolve(__dirname, '../../.env.development')
});

import { MONGODB_URI, NODE_ENV } from '../config/env.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Category from '../models/Category.js';
import Location from '../models/Location.js';
import Vendor from '../models/Vendor.js';
import Asset from '../models/Asset.js';
import Assignment from '../models/Assignment.js';
import Ticket from '../models/Ticket.js';
import Warranty from '../models/Warranty.js';
import { ensureSuperAdminExists } from '../services/superadmin.seeder.js';

export const seedDevelopmentData = async () => {
  console.log('\n====================================================');
  console.log('🌱 ASSETOWL RICH DEVELOPMENT SEEDER');
  console.log(`   Environment: ${NODE_ENV}`);
  console.log('====================================================\n');

  // Hard safety guard 1: Node environment check
  if (NODE_ENV !== 'development') {
    console.error(`❌ ABORTING: Seed script is ONLY permitted in NODE_ENV=development. Current NODE_ENV is "${NODE_ENV}".`);
    process.exit(1);
  }

  // Connect to MongoDB
  await mongoose.connect(MONGODB_URI);
  const dbName = mongoose.connection.db.databaseName;
  console.log(`🔌 Connected to database: ${dbName}`);

  // Hard safety guard 2: Database name check
  if (dbName === 'assetowl' || !dbName.includes('dev')) {
    console.error(`❌ ABORTING: Refusing to seed database "${dbName}". Database name must contain "dev" and cannot be production "assetowl".`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log('✅ Safety verification passed: Target is development database.\n');

  // Ensure Global Super Admin exists
  console.log('👑 Ensuring Global Super Admin exists...');
  await ensureSuperAdminExists();

  // Common password hash for test accounts
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // Define Rich Demo Organizations Dataset
  const orgConfigs = [
    // =========================================================================
    // ORGANIZATION 1: TECHFLOW SOLUTIONS
    // =========================================================================
    {
      slug: 'techflow-solutions',
      name: 'TechFlow Solutions',
      code: 'TECHFLOW',
      status: 'active',
      planId: 'enterprise',
      departments: [
        { name: 'Engineering', code: 'ENG' },
        { name: 'Marketing', code: 'MKT' },
        { name: 'Operations', code: 'OPS' },
        { name: 'Finance', code: 'FIN' },
        { name: 'Human Resources', code: 'HR' },
        { name: 'Information Technology', code: 'IT' }
      ],
      categories: [
        { name: 'Laptops', expectedLifespanMonths: 36 },
        { name: 'Desktop Computers', expectedLifespanMonths: 48 },
        { name: 'Monitors', expectedLifespanMonths: 48 },
        { name: 'Mobile Phones', expectedLifespanMonths: 24 },
        { name: 'Tablets', expectedLifespanMonths: 36 },
        { name: 'Printers', expectedLifespanMonths: 60 },
        { name: 'Networking Equipment', expectedLifespanMonths: 60 },
        { name: 'Servers', expectedLifespanMonths: 60 },
        { name: 'Projectors', expectedLifespanMonths: 48 },
        { name: 'Office Equipment', expectedLifespanMonths: 60 }
      ],
      vendors: [
        { name: 'Dell Technologies', contactEmail: 'sales@dell.example.com', phone: '+1-800-999-3355' },
        { name: 'Lenovo Group', contactEmail: 'commercial@lenovo.example.com', phone: '+1-800-426-7378' },
        { name: 'HP Inc', contactEmail: 'orders@hp.example.com', phone: '+1-800-474-6836' },
        { name: 'Apple Inc', contactEmail: 'enterprise@apple.example.com', phone: '+1-800-275-2273' },
        { name: 'Samsung Electronics', contactEmail: 'b2b@samsung.example.com', phone: '+1-800-726-7864' },
        { name: 'Cisco Systems', contactEmail: 'enterprise-support@cisco.example.com', phone: '+1-800-553-6387' },
        { name: 'Logitech International', contactEmail: 'business@logitech.example.com', phone: '+1-800-255-2000' }
      ],
      locations: [
        // HQ Campus (Level 1)
        { name: 'Headquarters', code: 'HQ', type: 'branch', level: 1, address: '100 Innovation Way, San Jose, CA' },
        // HQ Buildings (Level 2)
        { name: 'Main Building', code: 'HQ-MB', type: 'building', level: 2, parentCode: 'HQ', path: '/HQ', address: '100 Innovation Way, Bldg A' },
        { name: 'IT & Data Center Building', code: 'HQ-IT', type: 'building', level: 2, parentCode: 'HQ', path: '/HQ', address: '100 Innovation Way, Bldg B' },
        // Main Building Floors (Level 3)
        { name: 'Ground Floor', code: 'HQ-MB-GF', type: 'floor', level: 3, parentCode: 'HQ-MB', path: '/HQ/HQ-MB', address: 'Ground Floor' },
        { name: 'First Floor', code: 'HQ-MB-F1', type: 'floor', level: 3, parentCode: 'HQ-MB', path: '/HQ/HQ-MB', address: 'First Floor' },
        { name: 'Second Floor', code: 'HQ-MB-F2', type: 'floor', level: 3, parentCode: 'HQ-MB', path: '/HQ/HQ-MB', address: 'Second Floor' },
        // Rooms
        { name: 'Engineering Lab', code: 'HQ-MB-F1-ENG', type: 'room', level: 3, parentCode: 'HQ-MB-F1', path: '/HQ/HQ-MB/HQ-MB-F1', address: 'Room 101' },
        { name: 'Open Office A', code: 'HQ-MB-F1-OFA', type: 'room', level: 3, parentCode: 'HQ-MB-F1', path: '/HQ/HQ-MB/HQ-MB-F1', address: 'Room 102' },
        { name: 'Executive Boardroom', code: 'HQ-MB-F2-BRD', type: 'room', level: 3, parentCode: 'HQ-MB-F2', path: '/HQ/HQ-MB/HQ-MB-F2', address: 'Room 205' },
        { name: 'Primary Server Room', code: 'HQ-IT-SRV', type: 'room', level: 3, parentCode: 'HQ-IT', path: '/HQ/HQ-IT', address: 'Secure Room B1' },
        { name: 'Network Operations Center', code: 'HQ-IT-NOC', type: 'room', level: 3, parentCode: 'HQ-IT', path: '/HQ/HQ-IT', address: 'Room B2' },

        // NYC Office (Level 1)
        { name: 'NYC Office', code: 'NYC', type: 'branch', level: 1, address: '450 Lexington Ave, New York, NY' },
        { name: 'Main Office', code: 'NYC-MO', type: 'building', level: 2, parentCode: 'NYC', path: '/NYC', address: '450 Lexington Ave, Floor 14' },
        { name: 'Marketing Bay', code: 'NYC-MO-F1-MKT', type: 'room', level: 3, parentCode: 'NYC-MO', path: '/NYC/NYC-MO', address: 'Suite 1400' },
        { name: 'Media & Streaming Studio', code: 'NYC-MO-F1-STU', type: 'room', level: 3, parentCode: 'NYC-MO', path: '/NYC/NYC-MO', address: 'Studio A' }
      ],
      users: [
        { email: 'admin@techflow.dev', role: 'org_admin', firstName: 'Priya', lastName: 'Sharma', jobTitle: 'Organization Administrator', deptCode: 'ENG' },
        { email: 'manager@techflow.dev', role: 'asset_manager', firstName: 'Ravi', lastName: 'Patel', jobTitle: 'Lead IT Asset Manager', deptCode: 'IT' },
        { email: 'alice@techflow.dev', role: 'employee', firstName: 'Alice', lastName: 'Chen', jobTitle: 'Senior Software Engineer', deptCode: 'ENG' },
        { email: 'bob@techflow.dev', role: 'employee', firstName: 'Bob', lastName: 'Williams', jobTitle: 'Marketing Director', deptCode: 'MKT' },
        { email: 'clara@techflow.dev', role: 'employee', firstName: 'Clara', lastName: 'Vance', jobTitle: 'VP of Finance', deptCode: 'FIN' },
        { email: 'daniel@techflow.dev', role: 'employee', firstName: 'Daniel', lastName: 'Craig', jobTitle: 'DevOps & Cloud Engineer', deptCode: 'IT' },
        { email: 'elena@techflow.dev', role: 'employee', firstName: 'Elena', lastName: 'Rostova', jobTitle: 'HR Director', deptCode: 'HR' },
        { email: 'frank@techflow.dev', role: 'employee', firstName: 'Frank', lastName: 'Wright', jobTitle: 'QA Automation Lead', deptCode: 'ENG' },
        { email: 'grace@techflow.dev', role: 'employee', firstName: 'Grace', lastName: 'Hopper', jobTitle: 'Principal Architect', deptCode: 'IT' },
        { email: 'henry@techflow.dev', role: 'employee', firstName: 'Henry', lastName: 'Ford', jobTitle: 'Operations Supervisor', deptCode: 'OPS' },
        { email: 'isabel@techflow.dev', role: 'employee', firstName: 'Isabel', lastName: 'Diaz', jobTitle: 'Financial Analyst', deptCode: 'FIN' }
      ],
      assets: [
        // --- LAPTOPS ($700 - $3500) ---
        { assetCode: 'TF-LAP-001', name: 'Dell Latitude 5440 14"', category: 'Laptops', vendor: 'Dell Technologies', location: 'Open Office A', price: 1250, status: 'assigned', purchaseDate: '2024-02-15', warrantyMonths: 36, lifespanMonths: 36 },
        { assetCode: 'TF-LAP-002', name: 'Dell Latitude 7420 Carbon', category: 'Laptops', vendor: 'Dell Technologies', location: 'Open Office A', price: 1650, status: 'stock', purchaseDate: '2023-11-10', warrantyMonths: 36, lifespanMonths: 36 },
        { assetCode: 'TF-LAP-003', name: 'Lenovo ThinkPad T14 Gen 4', category: 'Laptops', vendor: 'Lenovo Group', location: 'Open Office A', price: 1420, status: 'assigned', purchaseDate: '2024-01-20', warrantyMonths: 36, lifespanMonths: 36 },
        { assetCode: 'TF-LAP-004', name: 'HP EliteBook 840 G10', category: 'Laptops', vendor: 'HP Inc', location: 'Open Office A', price: 1580, status: 'assigned', purchaseDate: '2023-08-15', warrantyMonths: 36, lifespanMonths: 36 },
        { assetCode: 'TF-LAP-005', name: 'MacBook Pro 14 M3 Pro', category: 'Laptops', vendor: 'Apple Inc', location: 'Engineering Lab', price: 2399, status: 'assigned', purchaseDate: '2024-03-01', warrantyMonths: 36, lifespanMonths: 36 },
        { assetCode: 'TF-LAP-006', name: 'MacBook Pro 16 M2 Max', category: 'Laptops', vendor: 'Apple Inc', location: 'Engineering Lab', price: 3499, status: 'repair', purchaseDate: '2023-04-12', warrantyMonths: 36, lifespanMonths: 36 },
        { assetCode: 'TF-LAP-007', name: 'MacBook Air 15 M3 16GB', category: 'Laptops', vendor: 'Apple Inc', location: 'Marketing Bay', price: 1699, status: 'assigned', purchaseDate: '2024-04-05', warrantyMonths: 36, lifespanMonths: 36 },
        { assetCode: 'TF-LAP-008', name: 'Dell XPS 15 9530 Touch', category: 'Laptops', vendor: 'Dell Technologies', location: 'Engineering Lab', price: 2199, status: 'assigned', purchaseDate: '2023-09-20', warrantyMonths: 36, lifespanMonths: 36 },
        { assetCode: 'TF-LAP-009', name: 'Dell XPS 13 Plus 9320', category: 'Laptops', vendor: 'Dell Technologies', location: 'Open Office A', price: 1399, status: 'stock', purchaseDate: '2024-05-10', warrantyMonths: 36, lifespanMonths: 36 },
        { assetCode: 'TF-LAP-010', name: 'Lenovo ThinkPad X1 Carbon Gen 8', category: 'Laptops', vendor: 'Lenovo Group', location: 'Open Office A', price: 1100, status: 'retired', purchaseDate: '2019-06-15', warrantyMonths: 36, lifespanMonths: 36 },

        // --- DESKTOPS ($600 - $2500) ---
        { assetCode: 'TF-DSK-001', name: 'Dell OptiPlex 7010 Tower Core i7', category: 'Desktop Computers', vendor: 'Dell Technologies', location: 'Engineering Lab', price: 1150, status: 'assigned', purchaseDate: '2023-06-10', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'TF-DSK-002', name: 'HP ProDesk 600 G9 SFF', category: 'Desktop Computers', vendor: 'HP Inc', location: 'Open Office A', price: 920, status: 'stock', purchaseDate: '2024-01-15', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'TF-DSK-003', name: 'Lenovo ThinkCentre M70q Tiny', category: 'Desktop Computers', vendor: 'Lenovo Group', location: 'Open Office A', price: 820, status: 'stock', purchaseDate: '2023-10-01', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'TF-DSK-004', name: 'Apple Mac Studio M2 Max', category: 'Desktop Computers', vendor: 'Apple Inc', location: 'Media & Streaming Studio', price: 2199, status: 'assigned', purchaseDate: '2023-12-05', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'TF-DSK-005', name: 'Dell Precision 3660 Workstation', category: 'Desktop Computers', vendor: 'Dell Technologies', location: 'Engineering Lab', price: 2450, status: 'repair', purchaseDate: '2022-09-18', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'TF-DSK-006', name: 'HP EliteDesk 800 G3 Legacy', category: 'Desktop Computers', vendor: 'HP Inc', location: 'Open Office A', price: 780, status: 'retired', purchaseDate: '2018-03-20', warrantyMonths: 36, lifespanMonths: 48 },

        // --- MONITORS ($150 - $1600) ---
        { assetCode: 'TF-MON-001', name: 'Dell UltraSharp U2422H 24" FHD', category: 'Monitors', vendor: 'Dell Technologies', location: 'Open Office A', price: 260, status: 'assigned', purchaseDate: '2023-05-15', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'TF-MON-002', name: 'Dell UltraSharp U2723QE 27" 4K', category: 'Monitors', vendor: 'Dell Technologies', location: 'Engineering Lab', price: 620, status: 'assigned', purchaseDate: '2024-02-10', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'TF-MON-003', name: 'LG 27UK850 27" 4K HDR', category: 'Monitors', vendor: 'Samsung Electronics', location: 'Open Office A', price: 420, status: 'assigned', purchaseDate: '2023-07-22', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'TF-MON-004', name: 'Samsung ViewFinity S8 32" 4K', category: 'Monitors', vendor: 'Samsung Electronics', location: 'Marketing Bay', price: 540, status: 'stock', purchaseDate: '2024-03-15', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'TF-MON-005', name: 'Apple Studio Display 27" 5K', category: 'Monitors', vendor: 'Apple Inc', location: 'Media & Streaming Studio', price: 1599, status: 'assigned', purchaseDate: '2023-11-28', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'TF-MON-006', name: 'Dell Professional P2422H', category: 'Monitors', vendor: 'Dell Technologies', location: 'Open Office A', price: 195, status: 'stock', purchaseDate: '2024-04-12', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'TF-MON-007', name: 'Samsung 34" Curved Ultrawide', category: 'Monitors', vendor: 'Samsung Electronics', location: 'Engineering Lab', price: 680, status: 'repair', purchaseDate: '2023-02-14', warrantyMonths: 36, lifespanMonths: 48 },

        // --- PHONES & TABLETS ($400 - $1400) ---
        { assetCode: 'TF-PHN-001', name: 'Apple iPhone 15 Pro 256GB', category: 'Mobile Phones', vendor: 'Apple Inc', location: 'Open Office A', price: 1099, status: 'assigned', purchaseDate: '2023-10-01', warrantyMonths: 24, lifespanMonths: 24 },
        { assetCode: 'TF-PHN-002', name: 'Apple iPhone 14 128GB', category: 'Mobile Phones', vendor: 'Apple Inc', location: 'Marketing Bay', price: 799, status: 'assigned', purchaseDate: '2023-05-18', warrantyMonths: 24, lifespanMonths: 24 },
        { assetCode: 'TF-PHN-003', name: 'Samsung Galaxy S24 Ultra 512GB', category: 'Mobile Phones', vendor: 'Samsung Electronics', location: 'Open Office A', price: 1299, status: 'assigned', purchaseDate: '2024-02-01', warrantyMonths: 24, lifespanMonths: 24 },
        { assetCode: 'TF-PHN-004', name: 'Google Pixel 8 Pro 128GB', category: 'Mobile Phones', vendor: 'Samsung Electronics', location: 'Open Office A', price: 899, status: 'stock', purchaseDate: '2024-03-20', warrantyMonths: 24, lifespanMonths: 24 },
        { assetCode: 'TF-PHN-005', name: 'Apple iPhone 11 64GB Legacy', category: 'Mobile Phones', vendor: 'Apple Inc', location: 'Open Office A', price: 599, status: 'retired', purchaseDate: '2019-11-10', warrantyMonths: 24, lifespanMonths: 24 },
        { assetCode: 'TF-TAB-001', name: 'Apple iPad Pro 12.9" M2 256GB', category: 'Tablets', vendor: 'Apple Inc', location: 'Executive Boardroom', price: 1199, status: 'assigned', purchaseDate: '2023-08-25', warrantyMonths: 24, lifespanMonths: 36 },
        { assetCode: 'TF-TAB-002', name: 'Samsung Galaxy Tab S9 Ultra', category: 'Tablets', vendor: 'Samsung Electronics', location: 'Marketing Bay', price: 999, status: 'stock', purchaseDate: '2024-01-30', warrantyMonths: 24, lifespanMonths: 36 },

        // --- PRINTERS & OFFICE ($300 - $1800) ---
        { assetCode: 'TF-PRT-001', name: 'HP LaserJet Pro MFP 4101fdw', category: 'Printers', vendor: 'HP Inc', location: 'Open Office A', price: 479, status: 'assigned', purchaseDate: '2023-06-15', warrantyMonths: 36, lifespanMonths: 60 },
        { assetCode: 'TF-PRT-002', name: 'Canon imageCLASS MF445dw Laser', category: 'Printers', vendor: 'HP Inc', location: 'Marketing Bay', price: 389, status: 'stock', purchaseDate: '2024-02-18', warrantyMonths: 36, lifespanMonths: 60 },
        { assetCode: 'TF-PRJ-001', name: 'Samsung The Premiere 4K Laser Projector', category: 'Projectors', vendor: 'Samsung Electronics', location: 'Executive Boardroom', price: 2999, status: 'assigned', purchaseDate: '2023-04-10', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'TF-OFC-001', name: 'Logitech Rally Plus Ultra-HD Conference Kit', category: 'Office Equipment', vendor: 'Logitech International', location: 'Executive Boardroom', price: 2499, status: 'assigned', purchaseDate: '2023-05-01', warrantyMonths: 24, lifespanMonths: 48 },

        // --- SERVERS & NETWORKING ($1200 - $8500) ---
        { assetCode: 'TF-SRV-001', name: 'Dell PowerEdge R750 2U Rack Server (2x Xeon, 256GB RAM)', category: 'Servers', vendor: 'Dell Technologies', location: 'Primary Server Room', price: 7850, status: 'assigned', purchaseDate: '2023-03-15', warrantyMonths: 60, lifespanMonths: 60 },
        { assetCode: 'TF-SRV-002', name: 'HP ProLiant DL380 Gen10 Server (128GB RAM, 8TB SAS)', category: 'Servers', vendor: 'HP Inc', location: 'Primary Server Room', price: 6200, status: 'assigned', purchaseDate: '2022-07-20', warrantyMonths: 60, lifespanMonths: 60 },
        { assetCode: 'TF-NET-001', name: 'Cisco Catalyst 9200L 48-Port PoE+ Switch', category: 'Networking Equipment', vendor: 'Cisco Systems', location: 'Network Operations Center', price: 2850, status: 'assigned', purchaseDate: '2023-01-10', warrantyMonths: 60, lifespanMonths: 60 },
        { assetCode: 'TF-NET-002', name: 'Cisco Meraki MX85 Enterprise Security Appliance', category: 'Networking Equipment', vendor: 'Cisco Systems', location: 'Network Operations Center', price: 1890, status: 'assigned', purchaseDate: '2023-02-28', warrantyMonths: 36, lifespanMonths: 60 },
        { assetCode: 'TF-NET-003', name: 'Cisco Catalyst 9120AX Series Wi-Fi 6 AP', category: 'Networking Equipment', vendor: 'Cisco Systems', location: 'Open Office A', price: 680, status: 'stock', purchaseDate: '2024-02-14', warrantyMonths: 36, lifespanMonths: 60 }
      ],
      assignments: [
        // Active
        { assetCode: 'TF-LAP-001', employeeEmail: 'alice@techflow.dev', assignedByEmail: 'manager@techflow.dev', assignedAt: '2024-02-20' },
        { assetCode: 'TF-MON-002', employeeEmail: 'alice@techflow.dev', assignedByEmail: 'manager@techflow.dev', assignedAt: '2024-02-20' },
        { assetCode: 'TF-PHN-001', employeeEmail: 'alice@techflow.dev', assignedByEmail: 'manager@techflow.dev', assignedAt: '2024-02-20' },
        { assetCode: 'TF-LAP-003', employeeEmail: 'bob@techflow.dev', assignedByEmail: 'manager@techflow.dev', assignedAt: '2024-01-25' },
        { assetCode: 'TF-MON-003', employeeEmail: 'bob@techflow.dev', assignedByEmail: 'manager@techflow.dev', assignedAt: '2024-01-25' },
        { assetCode: 'TF-PHN-002', employeeEmail: 'bob@techflow.dev', assignedByEmail: 'manager@techflow.dev', assignedAt: '2024-01-25' },
        { assetCode: 'TF-LAP-004', employeeEmail: 'clara@techflow.dev', assignedByEmail: 'manager@techflow.dev', assignedAt: '2023-08-20' },
        { assetCode: 'TF-LAP-005', employeeEmail: 'daniel@techflow.dev', assignedByEmail: 'manager@techflow.dev', assignedAt: '2024-03-05' },
        { assetCode: 'TF-LAP-007', employeeEmail: 'elena@techflow.dev', assignedByEmail: 'manager@techflow.dev', assignedAt: '2024-04-10' },
        { assetCode: 'TF-LAP-008', employeeEmail: 'frank@techflow.dev', assignedByEmail: 'manager@techflow.dev', assignedAt: '2023-10-01' },
        { assetCode: 'TF-DSK-001', employeeEmail: 'grace@techflow.dev', assignedByEmail: 'manager@techflow.dev', assignedAt: '2023-06-15' },
        { assetCode: 'TF-PHN-003', employeeEmail: 'henry@techflow.dev', assignedByEmail: 'manager@techflow.dev', assignedAt: '2024-02-05' },
        { assetCode: 'TF-TAB-001', employeeEmail: 'isabel@techflow.dev', assignedByEmail: 'manager@techflow.dev', assignedAt: '2023-09-01' },
        // Historical (Returned)
        { assetCode: 'TF-LAP-010', employeeEmail: 'alice@techflow.dev', assignedByEmail: 'manager@techflow.dev', assignedAt: '2019-06-20', returnedAt: '2024-01-15', returnReason: 'upgrade', inspectionResult: 'pass', inspectionNotes: 'Replaced with Dell Latitude 5440.' },
        { assetCode: 'TF-DSK-006', employeeEmail: 'bob@techflow.dev', assignedByEmail: 'manager@techflow.dev', assignedAt: '2018-04-01', returnedAt: '2023-12-01', returnReason: 'offboarding', inspectionResult: 'fail_retire', inspectionNotes: 'Hard drive erased and hardware decommissioned.' },
        { assetCode: 'TF-PHN-005', employeeEmail: 'clara@techflow.dev', assignedByEmail: 'manager@techflow.dev', assignedAt: '2019-11-15', returnedAt: '2023-08-10', returnReason: 'defective', inspectionResult: 'fail_retire', inspectionNotes: 'Battery swelling detected.' }
      ],
      tickets: [
        { type: 'repair', status: 'open', priority: 'p2', issueType: 'hardware', assetCode: 'TF-LAP-006', raisedByEmail: 'daniel@techflow.dev', title: 'MacBook Pro screen flickering and GPU kernel panic', description: 'Screen turns black with rainbow artifacts under heavy compilation load.' },
        { type: 'repair', status: 'in_progress', priority: 'p1', issueType: 'hardware', assetCode: 'TF-DSK-005', raisedByEmail: 'grace@techflow.dev', handlerEmail: 'manager@techflow.dev', title: 'Workstation power supply failure', description: 'Dell Precision workstation shuts down unexpectedly under CUDA training tasks.' },
        { type: 'repair', status: 'open', priority: 'p3', issueType: 'hardware', assetCode: 'TF-MON-007', raisedByEmail: 'frank@techflow.dev', title: 'Curved monitor vertical red line on panel', description: 'One pixel-wide red line appeared across center of display.' },
        { type: 'request', status: 'claimed', priority: 'p3', issueType: 'hardware', raisedByEmail: 'bob@techflow.dev', handlerEmail: 'manager@techflow.dev', title: 'Request dual-monitor arm setup', description: 'Need desk-mounted dual gas spring monitor mount for marketing suite.' },
        { type: 'request', status: 'open', priority: 'p4', issueType: 'accessory', raisedByEmail: 'elena@techflow.dev', title: 'Ergonomic vertical mouse for HR station', description: 'Requesting Logitech MX Vertical mouse for repetitive strain prevention.' },
        { type: 'request', status: 'resolved', priority: 'p3', issueType: 'hardware', raisedByEmail: 'alice@techflow.dev', handlerEmail: 'manager@techflow.dev', resolvedByEmail: 'manager@techflow.dev', resolvedAt: '2024-05-15', resolutionNotes: 'Provided Anker 100W GaN dual USB-C charger.', title: 'Extra USB-C laptop power adapter for home office', description: 'Need spare 100W USB-C charger for hybrid work setup.' },
        { type: 'support', status: 'in_progress', priority: 'p2', issueType: 'network', raisedByEmail: 'clara@techflow.dev', handlerEmail: 'manager@techflow.dev', title: 'VPN authentication failure on home broadband', description: 'WireGuard client gives TLS handshake timeout on Xfinity ISP.' },
        { type: 'support', status: 'resolved', priority: 'p3', issueType: 'software', raisedByEmail: 'isabel@techflow.dev', handlerEmail: 'manager@techflow.dev', resolvedByEmail: 'manager@techflow.dev', resolvedAt: '2024-06-10', resolutionNotes: 'Upgraded Excel license with Microsoft 365 Copilot add-on.', title: 'Excel add-in license expiration for financial modeling', description: 'Bloomberg terminal add-in prompt shows license expired.' },
        { type: 'support', status: 'closed', priority: 'p4', issueType: 'software', raisedByEmail: 'henry@techflow.dev', handlerEmail: 'manager@techflow.dev', resolvedByEmail: 'manager@techflow.dev', resolvedAt: '2024-04-12', resolutionNotes: 'Reconfigured default printer driver.', title: 'Printer queue stuck on Operations floor', description: 'PDF documents stalling in queue.' },
        { type: 'return', status: 'closed', priority: null, issueType: 'hardware', assetCode: 'TF-LAP-010', raisedByEmail: 'alice@techflow.dev', handlerEmail: 'manager@techflow.dev', resolvedByEmail: 'manager@techflow.dev', resolvedAt: '2024-01-15', resolutionNotes: 'Device wiped (DoD 5220.22-M 3-pass) and retired.', title: 'Return legacy ThinkPad for scheduled refresh', description: '4-year hardware lifecycle reached.' },
        { type: 'admin_support', status: 'open', priority: 'p2', issueType: 'billing', raisedByEmail: 'admin@techflow.dev', title: 'Upgrade to Enterprise 500-seat tier', description: 'Requesting invoice billing option for annual renewal.' },
        { type: 'admin_support', status: 'resolved', priority: 'p3', issueType: 'technical', raisedByEmail: 'admin@techflow.dev', handlerEmail: 'manager@techflow.dev', resolvedByEmail: 'manager@techflow.dev', resolvedAt: '2024-03-20', resolutionNotes: 'Configured Azure AD SAML 2.0 connector.', title: 'Configure Azure AD SAML Single Sign-On', description: 'Need SSO integration assistance.' }
      ],
      warranties: [
        { assetCode: 'TF-LAP-001', provider: 'Dell ProSupport Plus', policyNumber: 'DELL-PS-2024-001', startDate: '2024-02-15', endDate: '2027-02-15', status: 'active' },
        { assetCode: 'TF-LAP-003', provider: 'Lenovo Premier Support', policyNumber: 'LEN-PS-2024-088', startDate: '2024-01-20', endDate: '2027-01-20', status: 'active' },
        { assetCode: 'TF-LAP-004', provider: 'HP Care Pack Next Business Day', policyNumber: 'HP-CP-2023-112', startDate: '2023-08-15', endDate: '2026-08-15', status: 'active' },
        { assetCode: 'TF-LAP-005', provider: 'AppleCare+ for Enterprise', policyNumber: 'AC-ENT-2024-045', startDate: '2024-03-01', endDate: '2027-03-01', status: 'active' },
        { assetCode: 'TF-DSK-001', provider: 'Dell Basic Hardware Warranty', policyNumber: 'DELL-HW-2023-551', startDate: '2023-06-10', endDate: '2026-06-10', status: 'active' },
        { assetCode: 'TF-MON-002', provider: 'Dell Premium Panel Guarantee', policyNumber: 'DELL-PPG-2024-01', startDate: '2024-02-10', endDate: '2027-02-10', status: 'active' },
        { assetCode: 'TF-SRV-001', provider: 'Dell Mission Critical 4-Hour Onsite', policyNumber: 'DELL-MC-2023-999', startDate: '2023-03-15', endDate: '2028-03-15', status: 'active' },
        { assetCode: 'TF-SRV-002', provider: 'HP Pointnext Operational Services', policyNumber: 'HP-PN-2022-741', startDate: '2022-07-20', endDate: '2027-07-20', status: 'active' },
        { assetCode: 'TF-NET-001', provider: 'Cisco SMARTnet 24x7x4', policyNumber: 'CSCO-SN-2023-014', startDate: '2023-01-10', endDate: '2028-01-10', status: 'active' },
        // Expiring soon (less than 60 days)
        { assetCode: 'TF-PHN-002', provider: 'AppleCare+ for Business', policyNumber: 'AC-BUS-2022-901', startDate: '2023-05-18', endDate: '2026-09-18', status: 'alerted' },
        { assetCode: 'TF-TAB-001', provider: 'AppleCare+ Protection Plan', policyNumber: 'AC-TAB-2023-333', startDate: '2023-08-25', endDate: '2026-08-25', status: 'alerted' },
        // Expired
        { assetCode: 'TF-LAP-010', provider: 'Lenovo Depot Warranty', policyNumber: 'LEN-DEP-2019-001', startDate: '2019-06-15', endDate: '2022-06-15', status: 'expired' },
        { assetCode: 'TF-DSK-006', provider: 'HP Standard Commercial', policyNumber: 'HP-STD-2018-092', startDate: '2018-03-20', endDate: '2021-03-20', status: 'expired' },
        { assetCode: 'TF-PHN-005', provider: 'Apple 1-Year Limited', policyNumber: 'AC-LTD-2019-411', startDate: '2019-11-10', endDate: '2020-11-10', status: 'expired' }
      ]
    },

    // =========================================================================
    // ORGANIZATION 2: GREENLEAF CORP
    // =========================================================================
    {
      slug: 'greenleaf-corp',
      name: 'GreenLeaf Corp',
      code: 'GREENLEAF',
      status: 'active',
      planId: 'growth',
      departments: [
        { name: 'Sales', code: 'SLS' },
        { name: 'Human Resources', code: 'HR' },
        { name: 'Finance', code: 'FIN' },
        { name: 'Operations', code: 'OPS' },
        { name: 'Information Technology', code: 'IT' }
      ],
      categories: [
        { name: 'Laptops', expectedLifespanMonths: 36 },
        { name: 'Desktop Computers', expectedLifespanMonths: 48 },
        { name: 'Monitors', expectedLifespanMonths: 48 },
        { name: 'Mobile Phones', expectedLifespanMonths: 24 },
        { name: 'Printers', expectedLifespanMonths: 60 },
        { name: 'Networking Equipment', expectedLifespanMonths: 60 },
        { name: 'Office Equipment', expectedLifespanMonths: 60 }
      ],
      vendors: [
        { name: 'Dell Technologies', contactEmail: 'sales@dell.example.com', phone: '+1-800-999-3355' },
        { name: 'HP Inc', contactEmail: 'orders@hp.example.com', phone: '+1-800-474-6836' },
        { name: 'Lenovo Group', contactEmail: 'commercial@lenovo.example.com', phone: '+1-800-426-7378' },
        { name: 'Canon Solutions', contactEmail: 'enterprise@cusa.canon.com', phone: '+1-800-652-2666' },
        { name: 'Samsung Electronics', contactEmail: 'b2b@samsung.example.com', phone: '+1-800-726-7864' },
        { name: 'Cisco Systems', contactEmail: 'enterprise-support@cisco.example.com', phone: '+1-800-553-6387' }
      ],
      locations: [
        // LA Office (Level 1)
        { name: 'LA Office', code: 'LA', type: 'branch', level: 1, address: '800 Wilshire Blvd, Los Angeles, CA' },
        { name: 'Main Building', code: 'LA-MB', type: 'building', level: 2, parentCode: 'LA', path: '/LA', address: '800 Wilshire Blvd, Tower A' },
        { name: 'Ground Floor Showroom', code: 'LA-MB-GF-SHW', type: 'room', level: 3, parentCode: 'LA-MB', path: '/LA/LA-MB', address: 'Suite 100' },
        { name: 'Sales Open Floor', code: 'LA-MB-F1-SLS', type: 'room', level: 3, parentCode: 'LA-MB', path: '/LA/LA-MB', address: 'Suite 200' },
        { name: 'Manager Office Suite', code: 'LA-MB-F1-MGR', type: 'room', level: 3, parentCode: 'LA-MB', path: '/LA/LA-MB', address: 'Suite 210' },

        // Chicago Office (Level 1)
        { name: 'Chicago Office', code: 'CHI', type: 'branch', level: 1, address: '233 S Wacker Dr, Chicago, IL' },
        { name: 'Main Building', code: 'CHI-MB', type: 'building', level: 2, parentCode: 'CHI', path: '/CHI', address: '233 S Wacker Dr, Floor 32' },
        { name: 'Operations Hub', code: 'CHI-MB-F1-OPS', type: 'room', level: 3, parentCode: 'CHI-MB', path: '/CHI/CHI-MB', address: 'Suite 3200' },
        { name: 'Conference Room C', code: 'CHI-MB-F1-CRC', type: 'room', level: 3, parentCode: 'CHI-MB', path: '/CHI/CHI-MB', address: 'Room 3204' }
      ],
      users: [
        { email: 'admin@greenleaf.dev', role: 'org_admin', firstName: 'David', lastName: 'Kumar', jobTitle: 'VP of Sales & Admin', deptCode: 'SLS' },
        { email: 'manager@greenleaf.dev', role: 'asset_manager', firstName: 'Eva', lastName: 'Rodriguez', jobTitle: 'IT Operations Manager', deptCode: 'IT' },
        { email: 'carol@greenleaf.dev', role: 'employee', firstName: 'Carol', lastName: 'Thompson', jobTitle: 'Senior Account Executive', deptCode: 'SLS' },
        { email: 'george@greenleaf.dev', role: 'employee', firstName: 'George', lastName: 'Miller', jobTitle: 'HR Specialist', deptCode: 'HR' },
        { email: 'hannah@greenleaf.dev', role: 'employee', firstName: 'Hannah', lastName: 'Abbott', jobTitle: 'Lead Accountant', deptCode: 'FIN' },
        { email: 'ian@greenleaf.dev', role: 'employee', firstName: 'Ian', lastName: 'Malcolm', jobTitle: 'Logistics Coordinator', deptCode: 'OPS' },
        { email: 'julia@greenleaf.dev', role: 'employee', firstName: 'Julia', lastName: 'Roberts', jobTitle: 'Sales Representative', deptCode: 'SLS' },
        { email: 'kevin@greenleaf.dev', role: 'employee', firstName: 'Kevin', lastName: 'Bacon', jobTitle: 'Systems Administrator', deptCode: 'IT' }
      ],
      assets: [
        // Laptops
        { assetCode: 'GL-LAP-001', name: 'Lenovo ThinkPad T14s Gen 4 AMD', category: 'Laptops', vendor: 'Lenovo Group', location: 'Sales Open Floor', price: 1350, status: 'assigned', purchaseDate: '2024-02-01', warrantyMonths: 36, lifespanMonths: 36 },
        { assetCode: 'GL-LAP-002', name: 'HP EliteBook 840 G10 Core i7', category: 'Laptops', vendor: 'HP Inc', location: 'Sales Open Floor', price: 1520, status: 'assigned', purchaseDate: '2024-01-10', warrantyMonths: 36, lifespanMonths: 36 },
        { assetCode: 'GL-LAP-003', name: 'Dell Latitude 5440 16GB', category: 'Laptops', vendor: 'Dell Technologies', location: 'Sales Open Floor', price: 1220, status: 'assigned', purchaseDate: '2023-09-15', warrantyMonths: 36, lifespanMonths: 36 },
        { assetCode: 'GL-LAP-004', name: 'Lenovo ThinkPad E14 Gen 5', category: 'Laptops', vendor: 'Lenovo Group', location: 'Sales Open Floor', price: 950, status: 'stock', purchaseDate: '2024-04-10', warrantyMonths: 36, lifespanMonths: 36 },
        { assetCode: 'GL-LAP-005', name: 'HP ProBook 450 G9', category: 'Laptops', vendor: 'HP Inc', location: 'Operations Hub', price: 890, status: 'stock', purchaseDate: '2023-11-20', warrantyMonths: 36, lifespanMonths: 36 },
        { assetCode: 'GL-LAP-006', name: 'Dell Latitude 3540 Essential', category: 'Laptops', vendor: 'Dell Technologies', location: 'Sales Open Floor', price: 820, status: 'repair', purchaseDate: '2023-06-12', warrantyMonths: 36, lifespanMonths: 36 },
        { assetCode: 'GL-LAP-007', name: 'Lenovo ThinkPad T480 Legacy', category: 'Laptops', vendor: 'Lenovo Group', location: 'Sales Open Floor', price: 1100, status: 'retired', purchaseDate: '2018-05-10', warrantyMonths: 36, lifespanMonths: 36 },

        // Desktops
        { assetCode: 'GL-DSK-001', name: 'HP ProDesk 400 G9 Mini PC', category: 'Desktop Computers', vendor: 'HP Inc', location: 'Sales Open Floor', price: 890, status: 'assigned', purchaseDate: '2024-03-01', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'GL-DSK-002', name: 'HP EliteDesk 800 G8 Tower', category: 'Desktop Computers', vendor: 'HP Inc', location: 'Manager Office Suite', price: 1250, status: 'stock', purchaseDate: '2024-04-15', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'GL-DSK-003', name: 'Dell OptiPlex 3090 Micro', category: 'Desktop Computers', vendor: 'Dell Technologies', location: 'Operations Hub', price: 780, status: 'assigned', purchaseDate: '2023-08-20', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'GL-DSK-004', name: 'Lenovo ThinkCentre M75s Gen 2', category: 'Desktop Computers', vendor: 'Lenovo Group', location: 'Operations Hub', price: 840, status: 'stock', purchaseDate: '2023-12-05', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'GL-DSK-005', name: 'HP ProDesk 400 G7 SFF', category: 'Desktop Computers', vendor: 'HP Inc', location: 'Sales Open Floor', price: 780, status: 'retired', purchaseDate: '2020-06-01', warrantyMonths: 36, lifespanMonths: 48 },

        // Monitors
        { assetCode: 'GL-MON-001', name: 'Dell UltraSharp U2422H 24"', category: 'Monitors', vendor: 'Dell Technologies', location: 'Sales Open Floor', price: 260, status: 'assigned', purchaseDate: '2023-08-10', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'GL-MON-002', name: 'Samsung 27" Curved FHD Business Monitor', category: 'Monitors', vendor: 'Samsung Electronics', location: 'Sales Open Floor', price: 280, status: 'assigned', purchaseDate: '2024-01-15', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'GL-MON-003', name: 'LG 24" IPS FHD Office Display', category: 'Monitors', vendor: 'Samsung Electronics', location: 'Operations Hub', price: 180, status: 'assigned', purchaseDate: '2023-05-18', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'GL-MON-004', name: 'HP E24 G4 FHD Ergonomic Display', category: 'Monitors', vendor: 'HP Inc', location: 'Sales Open Floor', price: 220, status: 'stock', purchaseDate: '2024-03-25', warrantyMonths: 36, lifespanMonths: 48 },
        { assetCode: 'GL-MON-005', name: 'Dell Professional P2722H 27"', category: 'Monitors', vendor: 'Dell Technologies', location: 'Sales Open Floor', price: 290, status: 'repair', purchaseDate: '2023-04-10', warrantyMonths: 36, lifespanMonths: 48 },

        // Mobile Phones
        { assetCode: 'GL-PHN-001', name: 'Samsung Galaxy S24 256GB', category: 'Mobile Phones', vendor: 'Samsung Electronics', location: 'Sales Open Floor', price: 899, status: 'assigned', purchaseDate: '2024-02-15', warrantyMonths: 24, lifespanMonths: 24 },
        { assetCode: 'GL-PHN-002', name: 'Apple iPhone 14 128GB', category: 'Mobile Phones', vendor: 'HP Inc', location: 'Sales Open Floor', price: 799, status: 'assigned', purchaseDate: '2023-09-01', warrantyMonths: 24, lifespanMonths: 24 },
        { assetCode: 'GL-PHN-003', name: 'Google Pixel 8 128GB', category: 'Mobile Phones', vendor: 'Samsung Electronics', location: 'Operations Hub', price: 699, status: 'stock', purchaseDate: '2024-03-10', warrantyMonths: 24, lifespanMonths: 24 },

        // Printers
        { assetCode: 'GL-PRT-001', name: 'HP LaserJet Pro M404n Monochrome', category: 'Printers', vendor: 'HP Inc', location: 'Sales Open Floor', price: 380, status: 'stock', purchaseDate: '2023-08-10', warrantyMonths: 24, lifespanMonths: 60 },
        { assetCode: 'GL-PRT-002', name: 'Canon imageCLASS MF455dw All-in-One', category: 'Printers', vendor: 'Canon Solutions', location: 'Operations Hub', price: 420, status: 'assigned', purchaseDate: '2023-10-05', warrantyMonths: 24, lifespanMonths: 60 },

        // Networking & Office
        { assetCode: 'GL-NET-001', name: 'Cisco Business 250 Series 24-Port Switch', category: 'Networking Equipment', vendor: 'Cisco Systems', location: 'Manager Office Suite', price: 650, status: 'assigned', purchaseDate: '2023-04-12', warrantyMonths: 36, lifespanMonths: 60 },
        { assetCode: 'GL-NET-002', name: 'Cisco Meraki Go GX20 Security Gateway', category: 'Networking Equipment', vendor: 'Cisco Systems', location: 'Operations Hub', price: 350, status: 'assigned', purchaseDate: '2023-05-20', warrantyMonths: 36, lifespanMonths: 60 },
        { assetCode: 'GL-OFC-001', name: 'Logitech MeetUp All-in-One ConferenceCam', category: 'Office Equipment', vendor: 'HP Inc', location: 'Conference Room C', price: 899, status: 'assigned', purchaseDate: '2023-07-15', warrantyMonths: 24, lifespanMonths: 48 }
      ],
      assignments: [
        // Active
        { assetCode: 'GL-LAP-001', employeeEmail: 'carol@greenleaf.dev', assignedByEmail: 'manager@greenleaf.dev', assignedAt: '2024-02-10' },
        { assetCode: 'GL-MON-001', employeeEmail: 'carol@greenleaf.dev', assignedByEmail: 'manager@greenleaf.dev', assignedAt: '2024-02-10' },
        { assetCode: 'GL-PHN-001', employeeEmail: 'carol@greenleaf.dev', assignedByEmail: 'manager@greenleaf.dev', assignedAt: '2024-02-15' },
        { assetCode: 'GL-LAP-002', employeeEmail: 'julia@greenleaf.dev', assignedByEmail: 'manager@greenleaf.dev', assignedAt: '2024-01-15' },
        { assetCode: 'GL-MON-002', employeeEmail: 'julia@greenleaf.dev', assignedByEmail: 'manager@greenleaf.dev', assignedAt: '2024-01-15' },
        { assetCode: 'GL-LAP-003', employeeEmail: 'george@greenleaf.dev', assignedByEmail: 'manager@greenleaf.dev', assignedAt: '2023-09-20' },
        { assetCode: 'GL-DSK-001', employeeEmail: 'hannah@greenleaf.dev', assignedByEmail: 'manager@greenleaf.dev', assignedAt: '2024-03-05' },
        { assetCode: 'GL-DSK-003', employeeEmail: 'ian@greenleaf.dev', assignedByEmail: 'manager@greenleaf.dev', assignedAt: '2023-08-25' },
        // Historical (Returned)
        { assetCode: 'GL-LAP-007', employeeEmail: 'carol@greenleaf.dev', assignedByEmail: 'manager@greenleaf.dev', assignedAt: '2018-05-15', returnedAt: '2024-01-10', returnReason: 'upgrade', inspectionResult: 'pass', inspectionNotes: 'Upgraded to ThinkPad T14s.' },
        { assetCode: 'GL-DSK-005', employeeEmail: 'admin@greenleaf.dev', assignedByEmail: 'manager@greenleaf.dev', assignedAt: '2020-06-15', returnedAt: '2024-01-10', returnReason: 'upgrade', inspectionResult: 'fail_retire', inspectionNotes: 'Replaced with ProDesk Mini.' }
      ],
      tickets: [
        { type: 'repair', status: 'open', priority: 'p2', issueType: 'hardware', assetCode: 'GL-LAP-006', raisedByEmail: 'julia@greenleaf.dev', title: 'Laptop keyboard spacebar and touchpad sticky', description: 'Keys sticking and trackpad click failing intermittently.' },
        { type: 'repair', status: 'in_progress', priority: 'p3', issueType: 'hardware', assetCode: 'GL-MON-005', raisedByEmail: 'carol@greenleaf.dev', handlerEmail: 'manager@greenleaf.dev', title: 'Monitor power supply buzzing noise', description: 'High-pitched coil whine from internal power transformer.' },
        { type: 'request', status: 'claimed', priority: 'p3', issueType: 'hardware', raisedByEmail: 'george@greenleaf.dev', handlerEmail: 'manager@greenleaf.dev', title: 'Request confidential privacy screen filter', description: 'Need 24-inch privacy filter for HR payroll display.' },
        { type: 'request', status: 'open', priority: 'p4', issueType: 'accessory', raisedByEmail: 'hannah@greenleaf.dev', title: 'Numeric keypad USB add-on for finance station', description: 'Requesting standalone ten-key pad for tax audits.' },
        { type: 'support', status: 'resolved', priority: 'p3', issueType: 'software', raisedByEmail: 'ian@greenleaf.dev', handlerEmail: 'manager@greenleaf.dev', resolvedByEmail: 'manager@greenleaf.dev', resolvedAt: '2024-05-18', resolutionNotes: 'Reinstalled Quickbooks multi-user gateway agent.', title: 'Accounting software network database lockup', description: 'Quickbooks company file reports host connection dropped.' },
        { type: 'support', status: 'closed', priority: 'p4', issueType: 'network', raisedByEmail: 'carol@greenleaf.dev', handlerEmail: 'manager@greenleaf.dev', resolvedByEmail: 'manager@greenleaf.dev', resolvedAt: '2024-03-22', resolutionNotes: 'Renewed DHCP lease and flushed DNS cache.', title: 'Wi-Fi disconnects when moving to Conference Room C', description: 'SSID roaming handoff drops active Zoom calls.' },
        { type: 'return', status: 'closed', priority: null, issueType: 'hardware', assetCode: 'GL-LAP-007', raisedByEmail: 'carol@greenleaf.dev', handlerEmail: 'manager@greenleaf.dev', resolvedByEmail: 'manager@greenleaf.dev', resolvedAt: '2024-01-10', resolutionNotes: 'Device recycled in e-waste disposal program.', title: 'Decommission 2018 ThinkPad T480', description: 'Hardware lifecycle completed.' },
        { type: 'admin_support', status: 'open', priority: 'p2', issueType: 'billing', raisedByEmail: 'admin@greenleaf.dev', title: 'Update corporate credit card for Growth plan', description: 'Need billing receipts sent to finance@greenleaf.dev.' }
      ],
      warranties: [
        { assetCode: 'GL-LAP-001', provider: 'Lenovo Premier Support', policyNumber: 'LEN-PS-2024-GL01', startDate: '2024-02-01', endDate: '2027-02-01', status: 'active' },
        { assetCode: 'GL-LAP-002', provider: 'HP Care Pack Next Business Day', policyNumber: 'HP-CP-2024-GL02', startDate: '2024-01-10', endDate: '2027-01-10', status: 'active' },
        { assetCode: 'GL-DSK-001', provider: 'HP Care Pack 3-Year Onsite', policyNumber: 'HP-CP-2024-GL03', startDate: '2024-03-01', endDate: '2027-03-01', status: 'active' },
        { assetCode: 'GL-MON-001', provider: 'Dell Premium Panel Guarantee', policyNumber: 'DELL-PPG-GL01', startDate: '2023-08-10', endDate: '2026-08-10', status: 'active' },
        { assetCode: 'GL-NET-001', provider: 'Cisco Small Business Pro Support', policyNumber: 'CSCO-PRO-GL01', startDate: '2023-04-12', endDate: '2026-04-12', status: 'active' },
        // Expiring Soon
        { assetCode: 'GL-PHN-002', provider: 'AppleCare+ for iPhone', policyNumber: 'AC-GL-2023-99', startDate: '2023-09-01', endDate: '2025-09-01', status: 'alerted' },
        { assetCode: 'GL-PRT-002', provider: 'Canon eCarePAK Extended Service', policyNumber: 'CAN-ECP-2023-11', startDate: '2023-10-05', endDate: '2025-10-05', status: 'alerted' },
        // Expired
        { assetCode: 'GL-LAP-007', provider: 'Lenovo Standard Warranty', policyNumber: 'LEN-STD-2018-04', startDate: '2018-05-10', endDate: '2021-05-10', status: 'expired' },
        { assetCode: 'GL-DSK-005', provider: 'HP Commercial Warranty', policyNumber: 'HP-CW-2020-88', startDate: '2020-06-01', endDate: '2023-06-01', status: 'expired' }
      ]
    }
  ];

  let totalOrgs = 0;
  let totalUsers = 0;
  let totalEmployees = 0;
  let totalAssets = 0;
  let totalAssignments = 0;
  let totalTickets = 0;
  let totalWarranties = 0;

  const orgSummaries = [];

  for (const config of orgConfigs) {
    console.log(`\n🏢 Processing Organization: ${config.name} (${config.slug})...`);

    // Clean existing records for this specific organization to guarantee complete idempotency
    const existingOrg = await Organization.findOne({ slug: config.slug });
    if (existingOrg) {
      const orgId = existingOrg._id;
      await Warranty.deleteMany({ organizationId: orgId });
      await Ticket.deleteMany({ organizationId: orgId });
      await Assignment.deleteMany({ organizationId: orgId });
      await Asset.deleteMany({ organizationId: orgId });
      await User.deleteMany({ organizationId: orgId });
      await Employee.deleteMany({ organizationId: orgId });
      await Vendor.deleteMany({ organizationId: orgId });
      await Location.deleteMany({ organizationId: orgId });
      await Category.deleteMany({ organizationId: orgId });
      await Department.deleteMany({ organizationId: orgId });
      await Organization.deleteOne({ _id: orgId });
      console.log(`   ♻️ Refreshed existing demo records for ${config.name}`);
    }

    // 1. Create Organization
    const org = await Organization.create({
      name: config.name,
      slug: config.slug,
      code: config.code,
      status: config.status,
      planId: config.planId
    });
    totalOrgs++;

    const orgId = org._id;
    const orgName = org.name;

    // 2. Create Departments
    const deptMap = new Map();
    for (const d of config.departments) {
      const dept = await Department.create({
        organizationId: orgId,
        organizationName: orgName,
        name: d.name,
        code: d.code
      });
      deptMap.set(d.code, dept._id);
    }

    // 3. Create Categories
    const categoryMap = new Map();
    for (const c of config.categories) {
      const cat = await Category.create({
        organizationId: orgId,
        organizationName: orgName,
        name: c.name,
        expectedLifespanMonths: c.expectedLifespanMonths
      });
      categoryMap.set(c.name, cat._id);
    }

    // 4. Create Locations (Hierarchical)
    const locationMap = new Map();
    for (const l of config.locations) {
      const parentId = l.parentCode ? locationMap.get(l.parentCode) : null;
      const loc = await Location.create({
        organizationId: orgId,
        organizationName: orgName,
        name: l.name,
        code: l.code,
        type: l.type,
        level: l.level,
        address: l.address || '',
        parentId: parentId || null,
        path: l.path || ''
      });
      locationMap.set(l.code, loc._id);
      locationMap.set(l.name, loc._id);
    }

    // 5. Create Vendors
    const vendorMap = new Map();
    for (const v of config.vendors) {
      const vendor = await Vendor.create({
        organizationId: orgId,
        organizationName: orgName,
        name: v.name,
        contactEmail: v.contactEmail,
        phone: v.phone
      });
      vendorMap.set(v.name, vendor._id);
    }

    // 6. Create Employees and Users
    const userMap = new Map();
    const employeeMap = new Map();
    let orgUsersCount = 0;
    let orgEmployeesCount = 0;

    for (const u of config.users) {
      const deptId = deptMap.get(u.deptCode) || null;

      // Create Employee
      const employee = await Employee.create({
        organizationId: orgId,
        organizationName: orgName,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email.toLowerCase().trim(),
        departmentId: deptId,
        jobTitle: u.jobTitle,
        status: 'active'
      });
      totalEmployees++;
      orgEmployeesCount++;
      employeeMap.set(u.email, employee);

      // Create User with verified bcrypt passwordHash
      const user = await User.create({
        email: u.email.toLowerCase().trim(),
        passwordHash,
        role: u.role,
        organizationId: orgId,
        organizationName: orgName,
        employeeRef: employee._id,
        status: 'active'
      });
      totalUsers++;
      orgUsersCount++;
      userMap.set(u.email, user);
    }

    // 7. Create Assets with Realistic AI Health & Age Distribution
    const assetMap = new Map();
    let orgAssetsCount = 0;

    for (const a of config.assets) {
      const catId = categoryMap.get(a.category) || null;
      const vendId = vendorMap.get(a.vendor) || null;
      const locId = locationMap.get(a.location) || null;
      const pDate = new Date(a.purchaseDate);
      const wDate = new Date(pDate);
      wDate.setMonth(wDate.getMonth() + (a.warrantyMonths || 36));

      // Calculate realistic age-based AI scores
      const ageInMonths = Math.max(1, Math.round((Date.now() - pDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)));
      const expectedLife = a.lifespanMonths || 36;
      const lifeRatio = Math.min(1.5, ageInMonths / expectedLife);

      let healthScore = 95;
      let failureRisk = 5;
      let rec = 'keep';

      if (a.status === 'retired') {
        healthScore = 15;
        failureRisk = 92;
        rec = 'replace';
      } else if (a.status === 'repair') {
        healthScore = 42;
        failureRisk = 68;
        rec = 'repair';
      } else if (lifeRatio > 1.0) {
        healthScore = Math.max(30, Math.round(100 - (lifeRatio * 50)));
        failureRisk = Math.min(75, Math.round(lifeRatio * 45));
        rec = healthScore < 50 ? 'replace' : 'repair';
      } else if (lifeRatio > 0.5) {
        healthScore = Math.round(100 - (lifeRatio * 30));
        failureRisk = Math.round(lifeRatio * 20);
        rec = 'keep';
      } else {
        healthScore = Math.round(98 - (lifeRatio * 10));
        failureRisk = Math.round(4 + (lifeRatio * 5));
        rec = 'keep';
      }

      const remainingMonths = Math.max(0, expectedLife - ageInMonths);

      const asset = await Asset.create({
        organizationId: orgId,
        organizationName: orgName,
        assetCode: a.assetCode,
        name: a.name,
        categoryId: catId,
        vendorId: vendId,
        locationId: locId,
        purchasePrice: a.price,
        purchaseDate: pDate,
        warrantyEndDate: wDate,
        warrantyType: 'manufacturer',
        status: a.status,
        expectedLifespanMonths: expectedLife,
        ai: {
          healthScore,
          failureRiskPercent: failureRisk,
          remainingUsefulLifeMonths: remainingMonths,
          lastAnalyzedAt: new Date(),
          replacementRecommendation: rec,
          insights: [
            `Asset is currently ${ageInMonths} months old (${Math.round(lifeRatio * 100)}% of expected lifespan).`,
            a.status === 'repair' ? 'Active hardware ticket reported.' : 'Operating normally within manufacturer specifications.'
          ]
        },
        healthHistory: [
          { score: 100, date: pDate },
          { score: healthScore, date: new Date() }
        ]
      });
      totalAssets++;
      orgAssetsCount++;
      assetMap.set(a.assetCode, asset);
    }

    // 8. Create Assignments
    let orgAssignmentsCount = 0;
    for (const assign of config.assignments) {
      const asset = assetMap.get(assign.assetCode);
      const employee = employeeMap.get(assign.employeeEmail);
      const assignedByUser = userMap.get(assign.assignedByEmail);

      if (asset && employee && assignedByUser) {
        await Assignment.create({
          organizationId: orgId,
          organizationName: orgName,
          assetId: asset._id,
          employeeId: employee._id,
          assignedBy: assignedByUser._id,
          assignedAt: new Date(assign.assignedAt),
          returnedAt: assign.returnedAt ? new Date(assign.returnedAt) : null,
          returnReason: assign.returnReason || null,
          inspectionResult: assign.inspectionResult || null,
          inspectionNotes: assign.inspectionNotes || null
        });
        totalAssignments++;
        orgAssignmentsCount++;
      }
    }

    // 9. Create Tickets
    let orgTicketsCount = 0;
    for (const t of config.tickets) {
      const asset = t.assetCode ? assetMap.get(t.assetCode) : null;
      const raisedBy = userMap.get(t.raisedByEmail);
      const handler = t.handlerEmail ? userMap.get(t.handlerEmail) : null;
      const resolvedBy = t.resolvedByEmail ? userMap.get(t.resolvedByEmail) : null;

      if (raisedBy) {
        await Ticket.create({
          organizationId: orgId,
          organizationName: orgName,
          type: t.type,
          status: t.status,
          priority: t.priority,
          issueType: t.issueType,
          assetId: asset ? asset._id : null,
          raisedBy: raisedBy._id,
          handler: handler ? handler._id : null,
          resolvedBy: resolvedBy ? resolvedBy._id : null,
          resolvedAt: t.resolvedAt ? new Date(t.resolvedAt) : null,
          resolutionNotes: t.resolutionNotes || null,
          title: t.title,
          description: t.description
        });
        totalTickets++;
        orgTicketsCount++;
      }
    }

    // 10. Create Warranties
    let orgWarrantiesCount = 0;
    for (const w of config.warranties) {
      const asset = assetMap.get(w.assetCode);
      if (asset) {
        await Warranty.create({
          organizationId: orgId,
          assetId: asset._id,
          provider: w.provider,
          policyNumber: w.policyNumber,
          startDate: new Date(w.startDate),
          endDate: new Date(w.endDate),
          status: w.status,
          alertSent: w.status === 'alerted'
        });
        totalWarranties++;
        orgWarrantiesCount++;
      }
    }

    orgSummaries.push({
      name: config.name,
      users: orgUsersCount,
      employees: orgEmployeesCount,
      assets: orgAssetsCount,
      categories: config.categories.length,
      vendors: config.vendors.length,
      locations: config.locations.length,
      tickets: orgTicketsCount,
      assignments: orgAssignmentsCount,
      warranties: orgWarrantiesCount
    });

    console.log(`   ✨ Seeded ${config.name} (${orgAssetsCount} assets, ${orgTicketsCount} tickets, ${orgAssignmentsCount} assignments) successfully!`);
  }

  console.log('\n========================================');
  console.log('AssetOwl Development Seed Complete');
  console.log('========================================');
  console.log(`Database: ${dbName}\n`);

  for (const s of orgSummaries) {
    console.log(`${s.name}`);
    console.log(`  Users:                ${s.users}`);
    console.log(`  Employees:            ${s.employees}`);
    console.log(`  Assets:               ${s.assets}`);
    console.log(`  Categories:           ${s.categories}`);
    console.log(`  Vendors:              ${s.vendors}`);
    console.log(`  Locations:            ${s.locations}`);
    console.log(`  Tickets:              ${s.tickets}`);
    console.log(`  Assignments:          ${s.assignments}`);
    console.log(`  Warranties:           ${s.warranties}\n`);
  }

  console.log(`Total Assets:             ${totalAssets}`);
  console.log(`Total Tickets:            ${totalTickets}`);
  console.log(`Total Assignments:        ${totalAssignments}`);
  console.log(`Total Warranties:         ${totalWarranties}`);
  console.log('========================================');
  console.log('🔑 Test Credentials (All accounts use password: password123):');
  console.log('   TechFlow Admin:     admin@techflow.dev');
  console.log('   TechFlow Manager:   manager@techflow.dev');
  console.log('   GreenLeaf Admin:    admin@greenleaf.dev');
  console.log('   GreenLeaf Manager:  manager@greenleaf.dev');
  console.log('   Super Admin:        superadmin@assetowl.dev (Password: SuperAdmin123!)');
  console.log('========================================\n');
  console.log('Development seed completed successfully.\n');

  await mongoose.disconnect();
};

// Execute if run directly
const isDirectRun = process.argv[1] && (
  path.resolve(process.argv[1]).toLowerCase() === path.resolve(fileURLToPath(import.meta.url)).toLowerCase() ||
  process.argv[1].endsWith('development.seed.js')
);

if (isDirectRun) {
  seedDevelopmentData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Development seed failed:', err);
      process.exit(1);
    });
}

export default seedDevelopmentData;
