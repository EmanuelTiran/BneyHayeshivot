const PortalItem = require('../models/PortalItem');

const getAll        = ()       => PortalItem.find().sort({ order: 1, createdAt: 1 });
const getByCategory = (catId)  => PortalItem.find({ categoryId: catId }).sort({ order: 1, createdAt: 1 });
const getById       = (id)     => PortalItem.findById(id).populate('categoryId');
const create        = (data)   => PortalItem.create(data);
const update        = (id, data) => PortalItem.findByIdAndUpdate(id, data, { new: true });
const remove        = (id)     => PortalItem.findByIdAndDelete(id);

module.exports = { getAll, getByCategory, getById, create, update, remove };