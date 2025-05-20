const User = require('../models/userModel'); // Adjust the path as necessary

const userService = {
  // Create a new user
  createUser: async (userData) => {
    try {
      const newUser = new User(userData);
      return await newUser.save();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Get all users
  getAllUsers: async () => {
    try {
      return await User.find().populate('car');
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get a single user by ID
  getUserById: async (id) => {
    try {
      return await User.findById(id).populate('car');
    } catch (error) {
      console.error(`Error fetching user with id ${id}:`, error);
      throw error;
    }
  },

  // Update an existing user
  updateUser: async (id, userData) => {
    try {
      return await User.findByIdAndUpdate(id, userData, { new: true }).populate('car');
    } catch (error) {
      console.error(`Error updating user with id ${id}:`, error);
      throw error;
    }
  },

  // Delete an user
  deleteUser: async (id) => {
    try {
      return await User.findByIdAndDelete(id);
    } catch (error) {
      console.error(`Error deleting user with id ${id}:`, error);
      throw error;
    }
  },

  // Get users by status
  getUsersByStatus: async (status) => {
    try {
      return await User.find({ status: status }).populate('car');
    } catch (error) {
      console.error(`Error fetching users with status ${status}:`, error);
      throw error;
    }
  },

  // Get users for a specific car
  getUsersForCar: async (carId) => {
    try {
      return await User.find({ car: carId }).populate('car');
    } catch (error) {
      console.error(`Error fetching users for car ${carId}:`, error);
      throw error;
    }
  },

  // Get users for a specific customer (by email)
  getUsersForCustomer: async (email) => {
    try {
      return await User.find({ email: email }).populate('car');
    } catch (error) {
      console.error(`Error fetching users for customer ${email}:`, error);
      throw error;
    }
  },

  // Check if a car is available for a given date range
  checkCarAvailability: async (carId, startDate, endDate) => {
    try {
      const conflictingUsers = await User.find({
        car: carId,
        $or: [
          { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
          { startDate: { $gte: startDate, $lte: endDate } },
          { endDate: { $gte: startDate, $lte: endDate } }
        ],
        status: { $in: ['Pending', 'Confirmed'] }
      });
      return conflictingUsers.length === 0;
    } catch (error) {
      console.error(`Error checking availability for car ${carId}:`, error);
      throw error;
    }
  },

  // Get all users within a date range
  getUsersInDateRange: async (startDate, endDate) => {
    try {
      return await User.find({
        $or: [
          { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
          { startDate: { $gte: startDate, $lte: endDate } },
          { endDate: { $gte: startDate, $lte: endDate } }
        ]
      }).populate('car');
    } catch (error) {
      console.error('Error fetching users in date range:', error);
      throw error;
    }
  },

  // Update user status
  updateUserStatus: async (id, status) => {
    try {
      return await User.findByIdAndUpdate(id, { status: status }, { new: true }).populate('car');
    } catch (error) {
      console.error(`Error updating status for user ${id}:`, error);
      throw error;
    }
  },

  // Get total revenue for a given period
  getTotalRevenue: async (startDate, endDate) => {
    try {
      const users = await User.find({
        startDate: { $gte: startDate },
        endDate: { $lte: endDate },
        status: 'Completed'
      }).populate('car');

      return users.reduce((total, user) => {
        const rentalDays = (user.endDate - user.startDate) / (1000 * 60 * 60 * 24);
        return total + (rentalDays * user.car.dailyRate);
      }, 0);
    } catch (error) {
      console.error('Error calculating total revenue:', error);
      throw error;
    }
  }
};

module.exports = userService;
