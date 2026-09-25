import fs from 'fs';
import path from 'path';

const TEAM_FILE = path.join(process.cwd(), 'data', 'team.json');
const TMP_TEAM_FILE = path.join('/tmp', 'winxpro_team.json');

// Default initial super admin & team members sample
const DEFAULT_TEAM = [
  {
    id: 'team_superadmin_1',
    name: 'Main Admin',
    email: 'admin@winxpro.com.pk',
    username: 'superadmin',
    pin: 'Admin@123',
    role: 'Super Admin',
    permissions: [
      'view_payments',
      'manage_deposits',
      'manage_withdrawals',
      'manage_balances',
      'manage_rates',
      'manage_risk',
      'manage_team'
    ],
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'team_payment_op_2',
    name: 'Payment Specialist',
    email: 'payments@winxpro.com.pk',
    username: 'payment_op',
    pin: 'Pay@123',
    role: 'Payment Operator',
    permissions: ['view_payments', 'manage_deposits', 'manage_withdrawals'],
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'team_risk_mgr_3',
    name: 'Risk Controller',
    email: 'risk@winxpro.com.pk',
    username: 'risk_mgr',
    pin: 'Risk@123',
    role: 'Risk Manager',
    permissions: ['manage_risk', 'manage_balances'],
    status: 'active',
    created_at: new Date().toISOString()
  }
];

function loadTeamData() {
  try {
    if (fs.existsSync(TEAM_FILE)) {
      return JSON.parse(fs.readFileSync(TEAM_FILE, 'utf8'));
    }
    if (fs.existsSync(TMP_TEAM_FILE)) {
      return JSON.parse(fs.readFileSync(TMP_TEAM_FILE, 'utf8'));
    }
  } catch (e) {}
  return DEFAULT_TEAM;
}

function persistTeamData(data) {
  try {
    const dir = path.dirname(TEAM_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TEAM_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    try {
      fs.writeFileSync(TMP_TEAM_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {}
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const team = loadTeamData();
    return res.status(200).json({ success: true, team });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password, action, member } = req.body;
  if (password !== 'Admin@123') {
    return res.status(401).json({ error: 'Unauthorized access' });
  }

  let team = loadTeamData();

  try {
    if (action === 'add' || action === 'update') {
      if (!member || !member.name || !member.username) {
        return res.status(400).json({ error: 'Missing required team member fields (name, username)' });
      }

      const existingIdx = team.findIndex(t => t.id === member.id || t.username === member.username);
      const updatedMember = {
        id: member.id || 'team_' + Date.now().toString(36),
        name: String(member.name).trim(),
        email: String(member.email || '').trim(),
        username: String(member.username).trim().toLowerCase(),
        pin: member.pin || '123456',
        role: member.role || 'Custom Operator',
        permissions: Array.isArray(member.permissions) ? member.permissions : ['view_payments'],
        status: member.status || 'active',
        created_at: member.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        team[existingIdx] = updatedMember;
      } else {
        team.unshift(updatedMember);
      }

      persistTeamData(team);
      return res.status(200).json({
        success: true,
        message: `Team member '${updatedMember.name}' ${existingIdx >= 0 ? 'updated' : 'added'} successfully!`,
        team
      });
    }

    if (action === 'delete') {
      if (!member || !member.id) {
        return res.status(400).json({ error: 'Missing member ID to delete' });
      }
      team = team.filter(t => t.id !== member.id);
      persistTeamData(team);
      return res.status(200).json({
        success: true,
        message: 'Team member removed successfully.',
        team
      });
    }

    if (action === 'toggle_status') {
      const target = team.find(t => t.id === member.id);
      if (target) {
        target.status = target.status === 'active' ? 'suspended' : 'active';
        target.updated_at = new Date().toISOString();
        persistTeamData(team);
        return res.status(200).json({
          success: true,
          message: `Member status set to ${target.status}`,
          team
        });
      }
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Team management error' });
  }
}
