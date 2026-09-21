const { Sequelize } = require('sequelize');
require('dotenv').config();

const common = { dialect: 'postgres', logging: false };

// Hosted Postgres (Neon, Supabase, Render, Railway) gives a single DATABASE_URL and requires SSL.
// Locally the DB_* variables are used.
const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
        ...common,
        dialectOptions: process.env.DB_SSL === 'false' ? {} : { ssl: { require: true, rejectUnauthorized: false } }
    })
    : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
        ...common,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432
    });

module.exports = sequelize;
