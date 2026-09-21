const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function createAdminUser() {
    const client = new Client({
        host: 'localhost',
        port: 15432,
        user: 'postgres',
        password: 'postgrespassword',
        database: 'examdb'
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // Hash the admin password
        const hash = await bcrypt.hash('admin123', 10);
        console.log('Password hashed');

        // Insert admin user
        await client.query(
            `INSERT INTO "Users" (username, password_hash, role, "createdAt", "updatedAt") 
             VALUES ($1, $2, $3, NOW(), NOW()) 
             ON CONFLICT(username) DO NOTHING`,
            ['admin', hash, 'admin']
        );

        console.log('✅ Admin user created successfully!');
        console.log('Username: admin');
        console.log('Password: admin123');

        await client.end();
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

createAdminUser();
