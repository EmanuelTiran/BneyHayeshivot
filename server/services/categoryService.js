const Category = require('../models/Category');

const getAll  = ()         => Category.find().sort({ order: 1, createdAt: 1 });
const getById = (id)       => Category.findById(id);
const create  = (data)     => Category.create(data);
const update  = (id, data) => Category.findByIdAndUpdate(id, data, { new: true });
const remove  = (id)       => Category.findByIdAndDelete(id);

module.exports = { getAll, getById, create, update, remove };