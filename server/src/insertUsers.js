const mongoose = require('mongoose');
const User = require('../models/userModel'); // Assuming your User model is in a file named userModel.js

// Array of 20 user objects
const users = [
  {
    username: "john_doe",
    email: "john@example.com",
    password: "password123",
    firstName: "John",
    lastName: "Doe",
    age: 30
  },
  {
    username: "jane_smith",
    email: "jane@example.com",
    password: "securepass456",
    firstName: "Jane",
    lastName: "Smith",
    age: 28
  },
  {
    username: "bob_johnson",
    email: "bob@example.com",
    password: "bobpass789",
    firstName: "Bob",
    lastName: "Johnson",
    age: 35
  },
  {
    username: "alice_wonder",
    email: "alice@example.com",
    password: "alicepass101",
    firstName: "Alice",
    lastName: "Wonder",
    age: 27
  },
  {
    username: "charlie_brown",
    email: "charlie@example.com",
    password: "snoopy202",
    firstName: "Charlie",
    lastName: "Brown",
    age: 25
  },
  {
    username: "emma_watson",
    email: "emma@example.com",
    password: "hermione303",
    firstName: "Emma",
    lastName: "Watson",
    age: 31
  },
  {
    username: "david_beckham",
    email: "david@example.com",
    password: "football404",
    firstName: "David",
    lastName: "Beckham",
    age: 46
  },
  {
    username: "sarah_connor",
    email: "sarah@example.com",
    password: "terminator505",
    firstName: "Sarah",
    lastName: "Connor",
    age: 35
  },
  {
    username: "tony_stark",
    email: "tony@example.com",
    password: "ironman606",
    firstName: "Tony",
    lastName: "Stark",
    age: 45
  },
  {
    username: "natasha_romanoff",
    email: "natasha@example.com",
    password: "blackwidow707",
    firstName: "Natasha",
    lastName: "Romanoff",
    age: 36
  },
  {
    username: "peter_parker",
    email: "peter@example.com",
    password: "spiderman808",
    firstName: "Peter",
    lastName: "Parker",
    age: 23
  },
  {
    username: "leia_organa",
    email: "leia@example.com",
    password: "alderaan909",
    firstName: "Leia",
    lastName: "Organa",
    age: 40
  },
  {
    username: "luke_skywalker",
    email: "luke@example.com",
    password: "jedi1010",
    firstName: "Luke",
    lastName: "Skywalker",
    age: 40
  },
  {
    username: "hermione_granger",
    email: "hermione@example.com",
    password: "hogwarts1111",
    firstName: "Hermione",
    lastName: "Granger",
    age: 30
  },
  {
    username: "bruce_wayne",
    email: "bruce@example.com",
    password: "batman1212",
    firstName: "Bruce",
    lastName: "Wayne",
    age: 38
  },
  {
    username: "diana_prince",
    email: "diana@example.com",
    password: "wonderwoman1313",
    firstName: "Diana",
    lastName: "Prince",
    age: 800
  },
  {
    username: "clark_kent",
    email: "clark@example.com",
    password: "superman1414",
    firstName: "Clark",
    lastName: "Kent",
    age: 35
  },
  {
    username: "thor_odinson",
    email: "thor@example.com",
    password: "mjolnir1515",
    firstName: "Thor",
    lastName: "Odinson",
    age: 1500
  },
  {
    username: "steve_rogers",
    email: "steve@example.com",
    password: "captain1616",
    firstName: "Steve",
    lastName: "Rogers",
    age: 100
  },
  {
    username: "carol_danvers",
    email: "carol@example.com",
    password: "marvel1717",
    firstName: "Carol",
    lastName: "Danvers",
    age: 35
  }
];

// Function to feed users into the database
async function feedUsersToDatabase() {
  try {
      console.log('Connected to MongoDB');

    // Insert users
    const result = await User.insertMany(users);
    console.log(`${result.length} users inserted successfully`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Call the function to feed users

 
  module.exports = { feedUsersToDatabase };
