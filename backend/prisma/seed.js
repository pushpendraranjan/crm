require('dotenv').config();

const requiredSeedVariables = [
  'SEED_ADMIN_EMAIL',
  'SEED_ADMIN_PASSWORD',
  'SEED_AGENT_EMAIL',
  'SEED_AGENT_PASSWORD',
];
const missingSeedVariables = requiredSeedVariables.filter((name) => !process.env[name]);

if (missingSeedVariables.length > 0) {
  console.error(`Missing required seed environment variables: ${missingSeedVariables.join(', ')}`);
  process.exit(1);
}

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const seedAdminEmail = process.env.SEED_ADMIN_EMAIL;
const seedAgentEmail = process.env.SEED_AGENT_EMAIL;

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 10);
  const admin = await prisma.user.upsert({
    where: { email: seedAdminEmail },
    update: {},
    create: {
      name: 'Admin User',
      email: seedAdminEmail,
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create agent user
  const agentPassword = await bcrypt.hash(process.env.SEED_AGENT_PASSWORD, 10);
  const agent = await prisma.user.upsert({
    where: { email: seedAgentEmail },
    update: {},
    create: {
      name: 'Sales Agent',
      email: seedAgentEmail,
      password: agentPassword,
      role: 'AGENT',
    },
  });

  // Create sample leads
  const leads = [
    {
      name: 'Rahul Sharma',
      phone: '+91-9876543210',
      email: 'rahul@example.com',
      budget: 5000000,
      location: 'Mumbai',
      propertyType: '2BHK Apartment',
      dealType: 'Buy',
      leadSource: 'Website',
      status: 'New',
      assignedToId: agent.id,
      notes: 'Client interested in 2BHK in Andheri West',
      followupDate: new Date('2026-10-05T16:00:00Z'),
    },
    {
      name: 'Priya Patel',
      phone: '+91-9876543211',
      email: 'priya@example.com',
      budget: 8000000,
      location: 'Pune',
      propertyType: '3BHK Villa',
      dealType: 'Buy',
      leadSource: 'Referral',
      status: 'Contacted',
      assignedToId: admin.id,
      notes: 'Looking for villa in Baner area',
      followupDate: new Date('2026-10-06T10:00:00Z'),
    },
    {
      name: 'Amit Kumar',
      phone: '+91-9876543212',
      email: 'amit@example.com',
      budget: 25000,
      location: 'Bangalore',
      propertyType: '1BHK Apartment',
      dealType: 'Rent',
      leadSource: 'Social Media',
      status: 'Converted',
      assignedToId: agent.id,
      notes: 'Converted - signed lease for 1BHK in Koramangala',
    },
    {
      name: 'Sneha Joshi',
      phone: '+91-9876543213',
      email: 'sneha@example.com',
      budget: 12000000,
      location: 'Delhi',
      propertyType: '4BHK Penthouse',
      dealType: 'Buy',
      leadSource: 'Walk-in',
      status: 'Followup',
      assignedToId: admin.id,
      notes: 'Interested in premium penthouse',
      followupDate: new Date('2026-10-04T14:00:00Z'),
    },
    {
      name: 'Raj Malhotra',
      phone: '+91-9876543214',
      email: 'raj@example.com',
      budget: 3000000,
      location: 'Chennai',
      propertyType: 'Plot',
      dealType: 'Buy',
      leadSource: 'Advertisement',
      status: 'Lost',
      assignedToId: agent.id,
      notes: 'Lost - budget constraints',
    },
  ];

  for (const leadData of leads) {
    const lead = await prisma.lead.create({ data: leadData });
    
    // Add follow-ups for some leads
    if (leadData.name === 'Rahul Sharma') {
      await prisma.followUp.create({
        data: {
          leadId: lead.id,
          title: 'Initial site visit',
          date: new Date('2026-10-05T16:00:00Z'),
          notes: 'Client interested in 2BHK, schedule site visit in Andheri West',
          status: 'Pending',
        },
      });
    }
    if (leadData.name === 'Sneha Joshi') {
      await prisma.followUp.create({
        data: {
          leadId: lead.id,
          title: 'Price negotiation call',
          date: new Date('2026-10-04T14:00:00Z'),
          notes: 'Discuss pricing and amenities for penthouse',
          status: 'Pending',
        },
      });
    }
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
