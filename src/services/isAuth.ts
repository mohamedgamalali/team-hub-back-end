import { sign, verify,  } from 'jsonwebtoken'
import { Request, Response, NextFunction, response } from 'express';
import httpError from '../helpers/httpError'
import DB from '../config/DB'
import { Connection, Services } from './Tenant';
import knex, { Knex } from 'knex';
import { Profile } from 'passport';
import { v4 as uuid } from 'uuid';
import { config } from 'dotenv';
config();
import slugify from 'slugify';
import worSpace from './googleWorkspace';

//create new object in request
export interface IGetUserAuthInfoRequest extends Request {
    userId: string,
    DB: Knex
}

//token type
export type Token = {
    email: string,
    id: string,
} | any;

export default class Auth {

    static async generateJWT(user: any, privateKye: string) {


        return {

            token: sign(
                {
                    email: user.email,
                    id: user.id.toString(),
                    workspaceId: user.connection
                },
                privateKye,
                { expiresIn: '15m' }
            ),
            refresh_token: sign({
                email: user.email,
                id: user.id.toString(),
                workspaceId: user.connection,
                updated_at:user.updated_at
            }, <string>process.env.USER_REFRESH_TOKEN),
            expiresIn: 800000,
            email: user.email,
            image: user.image,
            name: user.name,
            jop_title: user.jop_title,
            info_check: user.info_check
        };
    }

    static async generateGeneralJWT(profile: any, privateKye: string) {

        return {

            token: sign(
                {
                    profile: profile
                },
                privateKye,
                { expiresIn: '3h' }
            ),
            expiresIn: 10000000,
            email: profile.emails[0].value
        };
    }

    static async getToken(req: Request) {
        try {
            const authHeader: string | undefined = req.get('Authorization');

            if (!authHeader) {
                //regular error throw
                const error = new httpError(401, 2, 'missed JWT header');
                throw error;
            }
            return authHeader.split(' ')[1];
        } catch (err) {


            throw err;
        }

    }

    static async verifyToken(token: string, privateKey: string) {

        try {
            const decodedToken: Token = await verify(token, privateKey);
            if (!decodedToken) {
                //regular error throw
                const error = new httpError(401, 2, 'not authrized');
                throw error;
            }
            return decodedToken;

        } catch (err:any) {
            //regular error throw
            const error = new httpError(401, 2, err.message);
            
            throw error;
        }

    }
    //user
    private static async checkForRegesteredEmail(email: string, tenantId: string | boolean = false) {
        try {


            //must be converted to postgresql

            if (tenantId) {
                const connection: any = Connection.getTanantConnection(<string>tenantId);
                const user = await connection.select('id').from('users').where('email', '=', email)
                console.log(user);

            } else {
                const tenants = await DB.db.select('id', 'db_name').from('tenants');
                for (let tenant of tenants) {
                    const connection: any = Connection.getTanantConnection(<string>tenant.id);
                    const user = await connection.select('id').from('users').where('email', '=', email)
                    console.log(user);
                }
            }



        } catch (err) {

            throw err
        }
    }


    static async regesterSocialMedia(profile: any, req: Request) {
        try {
            if (profile) {
                if (profile.emails[0].value == '') {
                    const err = new httpError(422, 7, "looks like you are trying to login with token does not have an email access")
                    throw err;
                }

                if (!profile.displayName) {
                    const err = new httpError(422, 7, "looks like you are trying to login with token does not have an profile access")
                    throw err;
                }
            }


            if (!req.body.workspace) {
                const err = new httpError(422, 7, 'missing workspace')
                throw err;
            }


            // const tenants = await DB.db.select('*').from('tenants')
            // for (let tenant of tenants) {
            //     const connection: any = Connection.getTanantConnection(tenant.id);
            //     if (!connection) {
            //         const err = new httpError(422, 20, "not a workspace id!!")
            //         throw err;
            //     }
            //     console.log(tenant);

            //     let user = await connection.select('id', 'email').from('users').where('email', '=', profile.emails[0].value)
            //     if (user.length == 0) {
            //         //onlt for testing
            //         user = await connection('users').insert({
            //             id: uuid(),
            //             name: profile.displayName,
            //             google_id: profile.id,
            //             image: profile._json.picture,
            //             email: profile.emails[0].value
            //         }).returning('*');

            //     }
            // }

            const workspace = await DB.db.select('id').from('tenants').where('db_name', '=', slugify(req.body.workspace.toLowerCase(), '_'))

            if (workspace.length == 0) {
                const err = new httpError(404, 5, "workspace not found!!")
                throw err;
            }

            const connection: Knex = Connection.getTanantConnection(workspace[0].id);

            const user = await connection.select('*').from('users').where({ google_id: profile.id, });

            if (user.length == 0) {
                const err = new httpError(404, 5, "user not found in this worspace")
                throw err;
            }


            let image = user[0].image;


            if (!user[0].image) {
                await connection('users').where({ google_id: profile.id, }).update({
                    image: profile._json.picture,
                })
                image = profile._json.picture;
            }




            req.user = {
                email: user[0].email,
                id: user[0].id,
                connection: workspace[0].id,
                image: image,
                name: user[0].name,
                jop_title: user[0].jop_title,
                info_check: user[0].info_check,
                updated_at:user[0].updated_at
            };

            return req.user;



        } catch (err) {


            throw err
        }
    }

    static async getTokenQuery(req: Request) {
        try {
            const authHeader: any = req.query.token;

            if (!authHeader) {
                //regular error throw
                const error = new httpError(401, 2, 'missed JWT header');
                throw error;
            }
            return authHeader;
        } catch (err) {
            throw err;
        }
    }

    static async IsAuthrizedUserGeneral(req: any, res: Response, next: NextFunction, q: boolean = false) {
        try {
            //get token

            let token: string;
            if (q) {
                token = await this.getTokenQuery(<Request>req);
            } else {
                token = await this.getToken(<Request>req);
            }


            //decode token
            const decodedToken: Token = await this.verifyToken(token, <string>process.env.USER_PRIVATE_KEY_GENERAL);

            if (!decodedToken.profile) {
                const err = new httpError(422, 21, 'got access token rather than general token')
            }





            req.profile = decodedToken.profile;

            return next();
        } catch (err) {
            next(err);
        }
    }

    static async IsAuthrizedUser(req: IGetUserAuthInfoRequest, res: Response, next: NextFunction, q: boolean = false) {
        try {
            //get token

            let token: string;
            if (q) {
                token = await this.getTokenQuery(<Request>req);
            } else {
                token = await this.getToken(<Request>req);
            }


            //decode token
            const decodedToken: Token = await this.verifyToken(token, <string>process.env.USER_PRIVATE_KEY);


            const connection: Knex = Connection.getTanantConnection(decodedToken.workspaceId);


            if (!connection) {
                const error = new httpError(404, 2, 'work space not found');
                throw error;
            }
            //check for admin
            const user = await connection.select('*').from('users').where('id', '=', decodedToken.id)

            if (user.length == 0) {
                //regular error throw
                const error = new httpError(404, 2, 'user not found');
                throw error;
            }

            if (user[0].blocked) {
                //regular error throw
                const error = new httpError(403, 4, 'user blocked');
                throw error;
            }


            req.user = decodedToken.id;
            req.DB = connection;

            return next();
        } catch (err) {
            next(err);
        }
    }


    static async IsAuthrizedAdmin(req: IGetUserAuthInfoRequest, res: Response, next: NextFunction, q: boolean = false) {
        try {
            //get token

            let token: string;
            if (q) {
                token = await this.getTokenQuery(<Request>req);
            } else {
                token = await this.getToken(<Request>req);
            }


            //decode token
            const decodedToken: Token = await this.verifyToken(token, <string>process.env.USER_PRIVATE_KEY);


            const connection: Knex = Connection.getTanantConnection(decodedToken.workspaceId);


            if (!connection) {
                const error = new httpError(404, 2, 'work space not found');
                throw error;
            }
            //check for admin
            const user = await connection.select('*').from('users').where('id', '=', decodedToken.id)

            if (user.length == 0) {
                //regular error throw
                const error = new httpError(404, 2, 'user not found');
                throw error;
            }

            if (user[0].blocked) {
                //regular error throw
                const error = new httpError(403, 4, 'user blocked');
                throw error;
            }

            if (user[0].role != 'admin') {
                const error = new httpError(403, 4, 'not an admin');
                throw error;
            }

            req.user = decodedToken.id;
            req.DB = connection;

            return next();
        } catch (err) {
            next(err);
        }
    }

    static async signupWorkspaec(token: string, email: string, workspace: string) {
        try {



            const work = new worSpace()

            const users: any = await work.listUsers(token, email)

            const tenantId = await Services.createTenant(workspace)

            const connection: Knex = await Connection.getTanantConnection(tenantId);

            for (let user of users) {
                const isUser = await connection.select('id').from('users').where({
                    google_id: user.googleId
                });
                if (!isUser.length) {
                    const newUser = await connection('users').insert({
                        id: uuid(),
                        name: user.name,
                        google_id: user.googleId,
                        email: user.email,
                        role: user.role
                    }).returning('*');

                }

            }

            const thisUser = await connection.select('*').from('users').where({
                email: email,
            });





            /// generate token and send it back to the client

            const userToken: Token = await this.generateJWT({
                email: thisUser[0].email,
                id: thisUser[0].id,
                connection: tenantId,
                image: thisUser[0].image,
                name: thisUser[0].name,
                jop_title: thisUser[0].jop_title,
                info_check: thisUser[0].info_check,
                updated_at:thisUser[0].updated_at
            }, <string>process.env.USER_PRIVATE_KEY)


            return userToken;

        } catch (err) {
            throw err;
        }

    }

}

