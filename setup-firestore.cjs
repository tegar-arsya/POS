// eslint-disable-next-line @typescript-eslint/no-require-imports
const admin = require('firebase-admin');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const serviceAccount = require('./coffe-shop-1d616-firebase-adminsdk-fbsvc-ec570121c4.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setupFirestore() {

  const menuItems = [
    { name: "Chicken Sandwich", category: "Main Dish", price: 10.99, description: "Grilled chicken breast with lettuce, tomato, and mayo on a toasted bun", isAvailable: true, preparationTime: 15 },
    { name: "Caesar Salad", category: "Appetizer", price: 8.99, description: "Crisp romaine lettuce, croutons, and parmesan cheese with Caesar dressing", isAvailable: true, preparationTime: 10 },
    { name: "Latte", category: "Hot Drink", price: 4.99, description: "Espresso with steamed milk and a light layer of foam", isAvailable: true, preparationTime: 5 },
    { name: "Iced Americano", category: "Cold Drink", price: 3.99, description: "Espresso shots topped with cold water", isAvailable: true, preparationTime: 3 },
  ];
  for (const item of menuItems) {
    await db.collection('menu').add(item);
  }

  console.log("Sample menu items added");

  // Add sample tables
  const tables = [
    { tableNumber: "1", capacity: 2, isOccupied: false },
    { tableNumber: "2", capacity: 4, isOccupied: false },
    { tableNumber: "3", capacity: 6, isOccupied: false },
    { tableNumber: "4", capacity: 4, isOccupied: false },
    { tableNumber: "5", capacity: 2, isOccupied: false },
  ];

  for (const table of tables) {
    await db.collection('tables').add(table);
  }

  console.log("Sample tables added");

  // Add sample users
  const users = [
    { name: "John Doe", email: "john@example.com", role: "cashier", createdAt: admin.firestore.Timestamp.now(), lastLogin: admin.firestore.Timestamp.now() },
    { name: "Jane Smith", email: "jane@example.com", role: "kitchen", createdAt: admin.firestore.Timestamp.now(), lastLogin: admin.firestore.Timestamp.now() },
    { name: "Mike Johnson", email: "mike@example.com", role: "bar", createdAt: admin.firestore.Timestamp.now(), lastLogin: admin.firestore.Timestamp.now() },
  ];

  for (const user of users) {
    await db.collection('users').add(user);
  }

  console.log("Sample users added");

  // Add a sample order
  const sampleOrder = {
    tableNumber: "3",
    NamaPembeli: "tegar",
    kitchenItems: [
      { itemId: "chicken_sandwich_id", name: "Chicken Sandwich", quantity: 1, notes: "Extra mayo on the side" }
    ],
    barItems: [
      { itemId: "latte_id", name: "Latte", quantity: 1, notes: "" }
    ],
    kitchenStatus: "pending",
    barStatus: "pending",
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    totalAmount: 15.98,
    paymentStatus: "unpaid",
  };

  await db.collection('orders').add(sampleOrder);

  console.log("Sample order added");
}

setupFirestore()
  .then(() => console.log("Firestore setup completed"))
  .catch((error) => console.error("Error setting up Firestore:", error));

