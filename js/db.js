import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.KOLEKA_DB_HOST || 'database', // 'database' is the service name in compose
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
});

export default pool;
