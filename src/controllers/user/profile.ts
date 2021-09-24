import { Request, Response, NextFunction } from 'express';
import response from '../../helpers/Response'
import { validationResult } from 'express-validator'
import authServices, { Token, IGetUserAuthInfoRequest } from '../../services/isAuth'
import { Workspace, Services, Connection } from '../../services/Tenant';

import DB from '../../config/DB';
import { Knex } from 'knex';

export async function postProfile(req: any, res: Response, next: NextFunction) {

    try {
    
        const jop_title = req.body.jop_title ;
        const phone     = req.body.phone ;
        const birthday     = req.body.birthday ;

        
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return response.ValidationFaild(res, 'validation faild', errors.array())
        }

        const phoneHere = await req.DB.select('id').from('users').where({
            phone:phone
        }).whereNot({
            id:req.user
        });

        if(phoneHere.length){
            return response.Conflict(res, 'this phone allready registered with another user');
        }

        await req.DB('users').where({
            id:req.user
        }).update({
            phone:phone,
            jop_title:jop_title,
            birthday:new Date(birthday),
            info_check:true
        });

        const user = await req.DB.select('phone', 'jop_title', 'birthday', 'info_check').from('users').where({
            id:req.user
        });

        

        return response.ok(res, 'profile edited', {
            ...user[0]
        });


        
    

    } catch (err) {

        next(err);
    }
}