const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ where: { username: 'admin' } });

        if (existingAdmin) {
            console.log('✓ Admin user already exists');
            return;
        }

        // Create default admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
            username: 'admin',
            password_hash: hashedPassword,
            plain_password: 'admin123', // For visibility
            role: 'admin',
            first_name: 'System',
            last_name: 'Administrator'
        });

        console.log('✓ Default admin user created successfully');
        console.log('  Username: admin');
        console.log('  Password: admin123');
        console.log('  IMPORTANT: Change these credentials in production!');
    } catch (error) {
        console.error('Error seeding admin user:', error.message);
    }
}

module.exports = seedAdmin;
