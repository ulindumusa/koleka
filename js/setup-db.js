import pool from './db.js';

export async function setupDatabase() {
    const client = await pool.connect();
    try {
        console.log('Checking database schema...');

        // Users table
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Projects table
        await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        goal NUMERIC(12, 2) NOT NULL,
        raised NUMERIC(12, 2) DEFAULT 0,
        owner_name TEXT NOT NULL,
        owner_email TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Pledges table
        await client.query(`
      CREATE TABLE IF NOT EXISTS pledges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        amount NUMERIC(12, 2) NOT NULL,
        phone TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

        console.log('Database schema verified.');
    } catch (err) {
        console.error('Error setting up database:', err);
    } finally {
        client.release();
    }
}
