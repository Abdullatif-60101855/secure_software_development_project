const persistence = require("./persistence.js")
const business = require('./business.js')


// async function main(){
// }
// main()

const bcrypt = require('bcrypt');
const saltRounds = 10;

// Function to hash a password with a generated salt
async function hashPassword(password) {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        throw new Error('Error hashing password');
    }
}

// Function to compare a plain text password with a hashed password
async function comparePasswords(plainPassword, hashedPassword) {
    try {
        const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
        return isMatch;
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
}

// Example usage
async function example() {
    const plainPassword = 'password123';
    
    // Hash the password and store it in the database along with the salt
    const hashedPassword = await hashPassword(plainPassword);
    console.log('Hashed password:', hashedPassword);

    // Simulating database retrieval of hashed password and salt
    const storedHashedPassword = hashedPassword; // Pretend this is fetched from the database
    const storedSalt = storedHashedPassword.substring(0, 29); // Extracting the salt part from the hashed password

    // When a user tries to log in, compare the provided password with the stored hashed password
    const isMatch = await comparePasswords(plainPassword, storedHashedPassword);
    console.log('Passwords match:', isMatch);
}

example();



