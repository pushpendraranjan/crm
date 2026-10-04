const prisma = require('../config/db');

const getLeadScope = (user) => (user.role === 'ADMIN' ? {} : { assignedToId: user.id });

const createLead = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      email,
      budget,
      location,
      propertyType,
      dealType,
      leadSource,
      status,
      assignedToId,
      followupDate,
      notes,
    } = req.body;

    const data = {
      name,
      phone: phone || null,
      email: email || null,
      budget: budget !== undefined && budget !== null && budget !== '' ? Number(budget) : null,
      location: location || null,
      propertyType: propertyType || null,
      dealType: dealType || 'Buy',
      leadSource: leadSource || null,
      status: status || 'New',
      assignedToId: req.user.role === 'ADMIN' ? assignedToId || null : req.user.id,
      followupDate: followupDate ? new Date(followupDate) : null,
      notes: notes || null,
    };

    const lead = await prisma.lead.create({
      data,
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json({ message: 'Lead created', lead });
  } catch (error) {
    next(error);
  }
};

const getLeads = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      location,
      propertyType,
      assignedToId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = getLeadScope(req.user);

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (propertyType) where.propertyType = { contains: propertyType, mode: 'insensitive' };
    if (req.user.role === 'ADMIN' && assignedToId) where.assignedToId = assignedToId;

    const validSortFields = ['createdAt', 'name', 'status', 'budget', 'followupDate'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderByDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take,
        include: { assignedTo: { select: { id: true, name: true, email: true } } },
        orderBy: { [orderByField]: orderByDir },
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({
      leads,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getLeadById = async (req, res, next) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, ...getLeadScope(req.user) },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        followUps: { orderBy: { date: 'asc' } },
      },
    });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json({ lead });
  } catch (error) {
    next(error);
  }
};

const updateLead = async (req, res, next) => {
  try {
    const existing = await prisma.lead.findFirst({
      where: { id: req.params.id, ...getLeadScope(req.user) },
    });
    if (!existing) return res.status(404).json({ message: 'Lead not found' });

    const {
      name,
      phone,
      email,
      budget,
      location,
      propertyType,
      dealType,
      leadSource,
      status,
      assignedToId,
      followupDate,
      notes,
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone || null;
    if (email !== undefined) updateData.email = email || null;
    if (budget !== undefined) updateData.budget = budget !== null && budget !== '' ? Number(budget) : null;
    if (location !== undefined) updateData.location = location || null;
    if (propertyType !== undefined) updateData.propertyType = propertyType || null;
    if (dealType !== undefined) updateData.dealType = dealType;
    if (leadSource !== undefined) updateData.leadSource = leadSource || null;
    if (status !== undefined) updateData.status = status;
    if (req.user.role === 'ADMIN' && assignedToId !== undefined) {
      updateData.assignedToId = assignedToId || null;
    }
    if (followupDate !== undefined) updateData.followupDate = followupDate ? new Date(followupDate) : null;
    if (notes !== undefined) updateData.notes = notes || null;

    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: updateData,
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    });
    res.json({ message: 'Lead updated', lead });
  } catch (error) {
    next(error);
  }
};

const deleteLead = async (req, res, next) => {
  try {
    const existing = await prisma.lead.findFirst({
      where: { id: req.params.id, ...getLeadScope(req.user) },
    });
    if (!existing) return res.status(404).json({ message: 'Lead not found' });

    await prisma.lead.delete({ where: { id: req.params.id } });
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const leadScope = getLeadScope(req.user);

    const [total, newLeads, converted, lost, followupsToday] = await Promise.all([
      prisma.lead.count({ where: leadScope }),
      prisma.lead.count({ where: { ...leadScope, status: 'New' } }),
      prisma.lead.count({ where: { ...leadScope, status: 'Converted' } }),
      prisma.lead.count({ where: { ...leadScope, status: 'Lost' } }),
      prisma.followUp.count({
        where: {
          date: { gte: startOfDay, lt: endOfDay },
          status: 'Pending',
          ...(req.user.role === 'ADMIN' ? {} : { lead: { is: leadScope } }),
        },
      }),
    ]);

    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : 0;

    // Status breakdown for chart
    const statusBreakdown = await prisma.lead.groupBy({
      where: leadScope,
      by: ['status'],
      _count: { status: true },
    });

    // Recent leads
    const recentLeads = await prisma.lead.findMany({
      where: leadScope,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { assignedTo: { select: { id: true, name: true } } },
    });

    // Upcoming follow-ups
    const upcomingFollowUps = await prisma.followUp.findMany({
      where: {
        status: 'Pending',
        date: { gte: today },
        ...(req.user.role === 'ADMIN' ? {} : { lead: { is: leadScope } }),
      },
      take: 5,
      orderBy: { date: 'asc' },
      include: { lead: { select: { id: true, name: true } } },
    });

    res.json({
      stats: {
        total,
        newLeads,
        converted,
        lost,
        followupsToday,
        conversionRate: parseFloat(conversionRate),
      },
      statusBreakdown: statusBreakdown.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      recentLeads,
      upcomingFollowUps,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createLead, getLeads, getLeadById, updateLead, deleteLead, getDashboardStats };
