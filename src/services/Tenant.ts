import { config } from './types';
import dbConfig from '../config/DB';
import { getNamespace } from 'continuation-local-storage';
import knex, { Knex } from 'knex';
import passwordGenerator from 'generate-password';
import slugify from 'slugify';
import { v4 as uuid } from 'uuid';
import { config as conf } from 'dotenv';
conf();
export class Connection {
    private static Tenants: any[] = [];


    private static getConfig(db_username: string, db_name: string, db_password: string) {
        try {
            return {
                client: process.env.DB_CLIENT,
                connection: {
                    user: db_username,
                    host: process.env.DB_HOST,
                    port: process.env.DB_PORT,
                    database: db_name,
                    password: db_password
                },
                pool: { min: 2, max: 10 }
            }

        } catch (err) {
            throw err;
        }
    }

    static getConnection(db_username: string, db_name: string, db_password: string) {   //get gonnection from local storage 
        try {

            return getNamespace('tenants')?.get('connection') || null;

        } catch (err) {
            throw err;
        }
    }

    static async bootstrap() {                        //app start 
        try {
            //create telnet table if not existed 
            const isHere = await dbConfig.db.schema.hasTable('tenants');

            if (!isHere) {
                await dbConfig.db.schema.createTable('tenants', function (table) {
                    table.uuid('id').primary().unique().notNullable();
                    table.string('db_name').notNullable().unique();
                    table.string('db_username').notNullable();
                    table.string('db_password').notNullable();
                    table.timestamp('created_at', { precision: 6 }).defaultTo(dbConfig.db.fn.now(6));
                    table.timestamp('updated_at', { precision: 6 }).defaultTo(dbConfig.db.fn.now(6));
                })
            }
            // await dbConfig.db.schema.dropTableIfExists('tenants')

            const tanants = await dbConfig.db.select('id', 'db_name', 'db_username', 'db_password')
                .from('tenants')


            Connection.Tenants = tanants.map((tanant: any) => {


                return ({
                    id: tanant.id,
                    Connection: knex({
                        client: process.env.DB_CLIENT,
                        connection: {
                            user: tanant.db_name,
                            host: process.env.DB_HOST,
                            port: <any>process.env.DB_PORT,
                            database: tanant.db_name,
                            password: tanant.db_password,
                            ssl: true
                        },
                        pool: { min: 2, max: 10 }
                    })
                })
            });

            // console.log(Connection.Tenants);



        } catch (err) {

            throw err;
        }
    }

    static getTanantConnection(id: string) {                        //app start 
        try {

            const tenant = Connection.Tenants.find((tenant) => tenant.id === id)

            if (!tenant) return null;


            return tenant.Connection


        } catch (err) {
            throw err;
        }
    }

    static async deleteAll() {
        try {
            const tenents = await dbConfig.db.select('db_name', 'id').from('tenants')

            for (let ten of tenents) {
                await dbConfig.db.raw(`DROP DATABASE IF EXISTS ${ten.db_name};`)
                await dbConfig.db.raw(`DROP ROLE ${ten.db_name};`)

            }
            await dbConfig.db('tenants').del();

            await this.bootstrap()
        } catch (err) {
            throw err;
        }
    }


}

//tanant service

export class Services {
    static async up(tenant: any) {
        try {
            await dbConfig.db.raw(`CREATE ROLE ${tenant.tenantName} WITH LOGIN ENCRYPTED PASSWORD '${tenant.password}';`)
            await dbConfig.db.raw(`GRANT ${tenant.tenantName} TO postgres;`)
            await dbConfig.db.raw(`CREATE DATABASE ${tenant.tenantName};`)
            await dbConfig.db.raw(`GRANT ALL PRIVILEGES ON DATABASE ${tenant.tenantName} TO ${tenant.tenantName};`)

            await Connection.bootstrap();


        } catch (err) {
            throw err;
        }
    }

    static async createTenant(name: string) {
        try {
            const password = passwordGenerator.generate({
                length: 12,
                numbers: true
            });
            const tenantName = slugify(name.toLowerCase(), '_');

            const newTenant = await dbConfig.db('tenants').insert({
                id: uuid(),
                db_name: tenantName,
                db_username: tenantName,
                db_password: password
            }).returning('*');
            console.log(newTenant);

            await this.up({ tenantName: newTenant[0].db_name, id: newTenant[0].id, password: newTenant[0].db_password })

            await this.createTables(newTenant[0].id)

        } catch (err) {
            throw err;
        }
    }

    static async createTables(id: string) {
        try {
            const connection: Knex = Connection.getTanantConnection(id);


            const isHere = await connection.schema.hasTable('users');
            if (!isHere) {
                await connection.schema.createTable('users', function (table: any) {
                    table.uuid('id').primary().unique().notNullable();
                    table.string('name').notNullable();
                    table.string('google_id');
                    table.string('image');
                    table.string('email').notNullable().unique();
                    table.boolean('blocked').notNullable().defaultTo(false);
                    table.string('jop_title')
                    table.timestamp('created_at', { precision: 6 }).defaultTo(connection.fn.now(6));
                    table.timestamp('updated_at', { precision: 6 }).defaultTo(connection.fn.now(6));
                });
            }

            await connection.schema.createTable('kudos', ((table: any) => {
                table
                    .uuid("user")
                    .notNullable()
                    .references("id")
                    .inTable("users")
                    .onDelete("CASCADE");
                table.string('content').notNullable();
                table.specificType('images', 'text ARRAY');
                // table.specificType('tags', 'json ARRAY');
                table.uuid('id').primary().unique().notNullable();
                table.timestamp('created_at', { precision: 6 }).defaultTo(connection.fn.now(6));
                table.timestamp('updated_at', { precision: 6 }).defaultTo(connection.fn.now(6));
            }));

            await connection.schema.createTable('kudos_likes', ((table: any) => {
                table
                    .uuid("kudo")
                    .notNullable()
                    .references("id")
                    .inTable("kudos")
                    .onDelete("CASCADE");
                table
                    .uuid("user")
                    .notNullable()
                    .references("id")
                    .inTable("users")
                    .onDelete("CASCADE");
                table.uuid('id').primary().unique().notNullable();
                table.timestamp('created_at', { precision: 6 }).defaultTo(connection.fn.now(6));
                table.timestamp('updated_at', { precision: 6 }).defaultTo(connection.fn.now(6));

            }));

            await connection.schema.createTable('kudos_replay', ((table: any) => {
                table
                    .uuid("kudo")
                    .notNullable()
                    .references("id")
                    .inTable("kudos")
                    .onDelete("CASCADE");
                table
                    .uuid("user")
                    .notNullable()
                    .references("id")
                    .inTable("users")
                    .onDelete("CASCADE");
                table.uuid('id').primary().unique().notNullable();
                table.timestamp('created_at', { precision: 6 }).defaultTo(connection.fn.now(6));
                table.timestamp('updated_at', { precision: 6 }).defaultTo(connection.fn.now(6));
                table.string('content').notNullable();
                table.specificType('images', 'text ARRAY');


            }));


        } catch (err) {
            throw err;
        }
    }




}

//tenants in action 

export class Workspace {
    static async getWorkspaces(email: string) {
        try {
            let workspace: any = [];
            const tenants = await dbConfig.db.select('*').from('tenants');

            for (let tanent of tenants) {
                const connection = Connection.getTanantConnection(tanent.id);

                const user = await connection.select('id').from('users').where('email', '=', email);

                if (user.length > 0) {                           //without the if conition just for testing
                    workspace.push({
                        name: tanent.db_username,
                        id: tanent.id
                    });
                }

            }

            return workspace;

        } catch (err) {
            throw err;
        }
    }
}