import { connectDB } from '../config/database.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Asset from '../models/Asset.js';
import Ticket from '../models/Ticket.js';
import Warranty from '../models/Warranty.js';
import AuditLog from '../models/AuditLog.js';
import Plan from '../models/Plan.js';

async function main() {
  await connectDB();

  const [orgCount, userCount, assetCount, ticketCount, warrantyCount, auditCount, planCount] = await Promise.all([
    Organization.countDocuments(),
    User.countDocuments(),
    Asset.countDocuments(),
    Ticket.countDocuments(),
    Warranty.countDocuments(),
    AuditLog.countDocuments(),
    Plan.countDocuments()
  ]);

  console.log('Document Counts:', { orgCount, userCount, assetCount, ticketCount, warrantyCount, auditCount, planCount });

  const orgs = await Organization.find().lean();
  console.log('\nOrganizations:');
  console.log(orgs.map(o => ({ name: o.name, slug: o.slug, status: o.status, planId: o.planId, createdAt: o.createdAt })));

  const plans = await Plan.find().lean();
  console.log('\nPlans:');
  console.log(plans.map(p => ({ name: p.name, slug: p.slug, price: p.price, maxAssets: p.maxAssets, maxEmployees: p.maxEmployees })));

  const usersByRole = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
  console.log('\nUsers by role:', usersByRole);

  const assetsByStatus = await Asset.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  console.log('\nAssets by status:', assetsByStatus);

  const assetsByHealth = await Asset.aggregate([
    {
      $project: {
        healthScore: { $ifNull: ['$ai.healthScore', { $ifNull: ['$healthScore', 92] }] },
        rec: '$ai.replacementRecommendation'
      }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $gte: ['$healthScore', 85] },
            'healthy',
            { $cond: [{ $gte: ['$healthScore', 60] }, 'warning', 'critical'] }
          ]
        },
        count: { $sum: 1 },
        avgScore: { $avg: '$healthScore' }
      }
    }
  ]);
  console.log('\nAssets by health band:', assetsByHealth);

  const ticketsByType = await Ticket.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);
  console.log('\nTickets by type:', ticketsByType);

  const ticketsByStatus = await Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  console.log('\nTickets by status:', ticketsByStatus);

  const ticketsByPriority = await Ticket.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]);
  console.log('\nTickets by priority:', ticketsByPriority);

  const adminSupportCases = await Ticket.find({ type: 'admin_support' }).lean();
  console.log('\nAdmin Support cases count:', adminSupportCases.length);

  const recentAudits = await AuditLog.find().sort({ createdAt: -1 }).limit(5).lean();
  console.log('\nRecent audit actions:', recentAudits.map(a => ({ action: a.action, targetType: a.targetType, createdAt: a.createdAt })));

  process.exit(0);
}

main();
