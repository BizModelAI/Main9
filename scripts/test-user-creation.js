import { storage } from "../server/storage.js";
import bcrypt from "bcrypt";

console.log("Testing user creation and login...");

try {
  // Check if user exists
  const existingUser = await storage.getUserByEmail("caseyedunham@gmail.com");
  console.log("Existing user:", existingUser);

  if (existingUser) {
    console.log("User exists. Testing password...");
    const validPassword = await bcrypt.compare(
      "Mittins2202",
      existingUser.password,
    );
    console.log("Password valid:", validPassword);

    if (!validPassword) {
      console.log("Password invalid, updating password...");
      const hashedPassword = await bcrypt.hash("Mittins2202", 10);
      await storage.updateUser(existingUser.id, { password: hashedPassword });
      console.log("Password updated!");
    }
  } else {
    console.log("User doesn't exist, creating user...");
    const hashedPassword = await bcrypt.hash("Mittins2202", 10);
    const newUser = await storage.createUser({
      email: "caseyedunham@gmail.com",
      password: hashedPassword,
      name: "Kacey Dunham",
    });
    console.log("User created:", newUser);
  }

  console.log("✅ Test completed!");
} catch (error) {
  console.error("❌ Test failed:", error);
}
