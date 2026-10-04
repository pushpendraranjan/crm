const prisma = require('../config/db');

const getLeadScope = (user) => (user.role === 'ADMIN' ? {} : { assignedToId: user.id });
const getFollowUpScope = (user) =>
  user.role === 'ADMIN' ? {} : { lead: { is: { assignedToId: user.id } } };

const createFollowUp = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const lead = await prisma.lead.findFirst({ where: { id: leadId, ...getLeadScope(req.user) } });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const { title, date, notes, status } = req.body;
    const followUp = await prisma.followUp.create({
      data: {
        leadId,
        title,
        date: new Date(date),
        notes: notes || null,
        status: status || 'Pending',
      },
      include: { lead: { select: { id: true, name: true } } },
    });
    res.status(201).json({ message: 'Follow-up scheduled', followUp });
  } catch (error) {
    next(error);
  }
};

const getFollowUpsByLead = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const lead = await prisma.lead.findFirst({ where: { id: leadId, ...getLeadScope(req.user) } });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const followUps = await prisma.followUp.findMany({
      where: { leadId },
      orderBy: { date: 'asc' },
    });
    res.json({ followUps });
  } catch (error) {
    next(error);
  }
};

const getAllFollowUps = async (req, res, next) => {
  try {
    const { status, upcoming } = req.query;
    const where = getFollowUpScope(req.user);
    if (status) where.status = status;
    if (upcoming === 'true') where.date = { gte: new Date() };

    const followUps = await prisma.followUp.findMany({
      where,
      orderBy: { date: 'asc' },
      include: { lead: { select: { id: true, name: true, phone: true, status: true } } },
    });
    res.json({ followUps });
  } catch (error) {
    next(error);
  }
};

const updateFollowUp = async (req, res, next) => {
  try {
    const existing = await prisma.followUp.findFirst({
      where: { id: req.params.id, ...getFollowUpScope(req.user) },
    });
    if (!existing) return res.status(404).json({ message: 'Follow-up not found' });

    const { title, date, notes, status } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (date !== undefined) updateData.date = new Date(date);
    if (notes !== undefined) updateData.notes = notes || null;
    if (status !== undefined) updateData.status = status;

    const followUp = await prisma.followUp.update({
      where: { id: req.params.id },
      data: updateData,
      include: { lead: { select: { id: true, name: true } } },
    });
    res.json({ message: 'Follow-up updated', followUp });
  } catch (error) {
    next(error);
  }
};

const deleteFollowUp = async (req, res, next) => {
  try {
    const existing = await prisma.followUp.findFirst({
      where: { id: req.params.id, ...getFollowUpScope(req.user) },
    });
    if (!existing) return res.status(404).json({ message: 'Follow-up not found' });

    await prisma.followUp.delete({ where: { id: req.params.id } });
    res.json({ message: 'Follow-up deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createFollowUp, getFollowUpsByLead, getAllFollowUps, updateFollowUp, deleteFollowUp };
