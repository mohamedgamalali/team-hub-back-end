import { sign, verify } from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express';
import httpError from '../helpers/httpError'
import DB from '../config/DB'
import { Connection } from './Tenant';
import knex, { Knex } from 'knex';
import { Profile } from 'passport';
import { v4 as uuid } from 'uuid';
import { config } from 'dotenv';
config();
import slugify from 'slugify';


//create new object in request
export interface IGetUserAuthInfoRequest extends Request {
    userId: string,
    DB:Knex
}

//token type
export type Token = {
    email: string,
    id: string,
} | any;

export default class Auth {

    static async generateJWT(user: any, privateKye: string) {
        console.log(user);

        return {

            token: sign(
                {
                    email: user.email,
                    id: user.id.toString(),
                    workspaceId: user.connection
                },
                privateKye,
                { expiresIn: '3h' }
            ),
            expiresIn: 10000000,
            email: user.email
        };
    }

    static async generateGeneralJWT(profile: any, privateKye: string) {
        console.log(profile);

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

        } catch (err) {
            //regular error throw
            // const error = new httpError(401, 2, err.message);
            throw err;
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


            const tenants = await DB.db.select('*').from('tenants')
            for (let tenant of tenants) {
                const connection: any = Connection.getTanantConnection(tenant.id);
                if (!connection) {
                    const err = new httpError(422, 20, "not a workspace id!!")
                    throw err;
                }
                console.log(tenant);

                let user = await connection.select('id', 'email').from('users').where('email', '=', profile.emails[0].value)
                if (user.length == 0) {
                    //onlt for testing
                    user = await connection('users').insert({
                        id: uuid(),
                        name: profile.displayName,
                        google_id: profile.id,
                        image: profile._json.picture,
                        email: profile.emails[0].value
                    }).returning('*');

                }
            }

            const workspace = await DB.db.select('id').from('tenants').where('db_name', '=', slugify(req.body.workspace.toLowerCase(), '_'))

            if (workspace.length == 0) {
                const err = new httpError(404, 5, "workspace not found!!")
                throw err;
            }

            const connection: Knex = Connection.getTanantConnection(workspace[0].id);

            const user = await connection.select('*').from('users').where('email', '=', profile.emails[0].value);

            if (user.length == 0) {
                const err = new httpError(404, 5, "user not found in this worspace")
                throw err;
            }

            if(!user[0].google_id){
                await connection('users').where('email', '=', profile.emails[0].value).update({
                    google_id:profile.id,
                })
            }

            if(!user[0].image){
                await connection('users').where('email', '=', profile.emails[0].value).update({
                    image: profile._json.picture,
                })
            }


            req.user = {
                email: user[0].email,
                id: user[0].id,
                connection: workspace[0].id
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

    static async IsAuthrizedUser(req: IGetUserAuthInfoRequest, res: Response, next: NextFunction, q:boolean = false) {
        try {
            //get token

            let token:string ;
            if(q){
                token = await this.getTokenQuery(<Request>req);
            }else{
                token = await this.getToken(<Request>req);
            } 

         
            //decode token
            const decodedToken: Token = await this.verifyToken(token, <string>process.env.USER_PRIVATE_KEY);

            
            const connection:Knex = Connection.getTanantConnection(decodedToken.workspaceId);
            
            if(!connection){
                const error = new httpError(404, 2, 'work space not found');
                throw error;
            }
            //check for admin
            const user = await connection.select('*').from('users').where('id','=',decodedToken.id)

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

            console.log(decodedToken.id);
            

            req.user = decodedToken.id;
            req.DB   = connection ;

            return next();
        } catch (err) {
            next(err);
        }
    }

    // static async optionalAuth(req: Request, res: Response, next: NextFunction) {
    //     try {
    //         //get token

    //         const authHeader: string | undefined = req.get('Authorization');

    //         if (!authHeader) {
    //             return false
    //         }
    //         const token = authHeader.split(' ')[1];
    //         const decodedToken: Token = await verify(token, <string>process.env.JWT_PRIVATE_KEY_USER);
    //         if (!decodedToken) {
    //             return false
    //         }

    //         const user = await User.findById(decodedToken.id);

    //         if (!user) {
    //             return false
    //         }

    //         req.user = decodedToken.id;

    //         return true;
    //     } catch (err) {
    //         throw err;
    //     }
    // }

    // static async IsAuthrizedAdmin(req: any, res: Response, next: NextFunction, q: boolean = false) {
    //     try {
    //         //get token
    //         let token: any;
    //         if (!q) {
    //             token = await this.getToken(<Request>req);
    //         } else {
    //             token = await this.getTokenQuery(<Request>req);

    //         }


    //         //decode token
    //         const decodedToken: Token = await this.verifyToken(token, <string>process.env.JWT_PRIVATE_KEY_ADMIN);

    //         //check for admin
    //         const admin = await Admin.findById(decodedToken.id);

    //         if (!admin) {
    //             //regular error throw
    //             const error = new httpError(404, 2, 'admin not found');
    //             throw error;
    //         }

    //         req.user = decodedToken.id;

    //         next();
    //     } catch (err) {
    //         next(err);
    //     }
    // }


}

