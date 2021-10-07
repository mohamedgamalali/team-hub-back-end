import { Request, Response, NextFunction } from 'express';
import response from '../../helpers/Response'
import { validationResult } from 'express-validator'
import authServices, { Token, IGetUserAuthInfoRequest } from '../../services/isAuth'
import { Workspace, Services, Connection } from '../../services/Tenant';

import DB from '../../config/DB';
import { Knex } from 'knex';

import { verify, sign } from 'jsonwebtoken';
import { ErrorCode } from 'multer';

export async function login(req: Request, res: Response, next: NextFunction) {

    try {


        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return response.ValidationFaild(res, 'validation faild', errors.array())
        }


        const token: Token = await authServices.generateJWT(req.user, <string>process.env.USER_PRIVATE_KEY)

        return response.ok(res, 'loggedin', {
            ...token
        })


    } catch (err) {

        next(err);
    }
}


export async function regreshToken(req: any, res: Response, next: NextFunction) {

    try {
        const { refresh_token } = req.body;
        let decodedToken: Token;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return response.ValidationFaild(res, 'validation faild', errors.array())
        }


        try {
            decodedToken = verify(refresh_token, <string>process.env.USER_REFRESH_TOKEN)
        } catch (err:any) {
            return response.unauthorized(res, err.message)
        }

        if (!decodedToken) {
            return response.unauthorized(res, 'invalid refresh_token')
        }

        const connection: Knex = Connection.getTanantConnection(decodedToken.workspaceId)

        if (!connection) {
            return response.Conflict(res, 'workspace not found');
        }

        const user = await connection.select('*').from('users').where({
            id: decodedToken.id
        });
        if (!user.length) {
            return response.NotFound(res, 'user not found');
        }
        
        if (decodedToken.updated_at != user[0].updated_at.toISOString()) {
            return response.unauthorized(res, 'expided refresh_token')
        }

        const token: Token = sign({
            email: user[0].email,
            id: user[0].id.toString(),
            workspaceId: decodedToken.workspaceId
        }, <string>process.env.USER_PRIVATE_KEY, { expiresIn: '15m' })

        return response.ok(res, 'access_token generated',{
            token,
            expiresIn:800000
        });

    } catch (err) {

        next(err);
    }
}

export async function workspace(req: any, res: Response, next: NextFunction) {

    try {
        const workspaceId = req.body.workspaceId;

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return response.ValidationFaild(res, 'validation faild', errors.array())
        }

        const workspace = await DB.db.select('*').from('tenants').where('id', '=', workspaceId)

        if (workspace.length == 0) {
            return response.NotFound(res, 'workspace not found')
        }
        const connection: Knex = Connection.getTanantConnection(workspace[0].id);

        if (!connection) {
            return response.serverError(res, 'workspace connection not found')
        }

        const user = await connection.select('*').from('users').where('email', '=', req.profile.emails[0].value) //req.user have the value of user email that we extracted from the profile in token "auth middelewere"

        if (user.length == 0) {
            return response.Forbidden(res, 'user is not a member on this workspace')
        }




        if (user[0].blocked) {
            return response.Forbidden(res, 'blocked user');
        }


        const token: Token = await authServices.generateJWT({
            email: user[0].email,
            id: user[0].id.toString(),
            workSpacesId: workspaceId

        }, <string>process.env.USER_PRIVATE_KEY)

        return response.ok(res, 'workspace sellected', {
            ...token,
            workspace: {
                id: workspace[0].id,
                name: workspace[0].db_username
            }
        })



    } catch (err) {

        next(err);
    }
}