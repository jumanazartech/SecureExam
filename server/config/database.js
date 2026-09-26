const { Sequelize } = require('sequelize');
require('dotenv').config();

// Neon's pooled connection (the "-pooler" host, needed for serverless/transaction pooling) rejects
// search_path as a startup parameter and hands out sessions with an EMPTY search_path, so every
// unqualified table name Sequelize generates ("Users", not "public"."Users") would 404. Running
// this once per new physical connection fixes it for that connection's whole lifetime; it is a
// no-op on a plain local Postgres. See: https://neon.tech/docs/connect/connection-errors#unsupported-startup-parameter
const common = {
    dialect: 'postgres',
    logging: false,
    hooks: { afterConnect: (connection) => connection.query('SET search_path TO public') }
};

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
