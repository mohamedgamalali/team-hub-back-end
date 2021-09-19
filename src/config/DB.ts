import knex from 'knex';
import { config as dotenv } from 'dotenv'
dotenv();
const config: any = {
    client: process.env.DB_CLIENT,
    connection: {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        ssl:true
    },
    pool: { min: 2, max: 10 }
}

const db = knex(config)

export default { db, config }
