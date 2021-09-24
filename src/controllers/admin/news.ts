import { Request, Response, NextFunction } from 'express';
import response from '../../helpers/Response'
import { validationResult } from 'express-validator'
import { IGetUserAuthInfoRequest } from '../../services/isAuth';
// import authServices from '../../services/auth'
import { v4 as uuid } from 'uuid';

export async function postNews(req: any, res: Response, next: NextFunction) {

    try {

        const content = req.body.content ; 
        const images:any = req.files ; 
        const errors = validationResult(req);

        let image ;
        if (!errors.isEmpty()) {
            return response.ValidationFaild(res, 'validation faild', errors.array())
        }

        if(images?.length){
            image = images[0].path ;
        }

        
        const newNews = await req.DB('news').insert({
            user:req.user,
            id:uuid(),
            content:content,
            image:image
        }).returning('*');

        return response.created(res, 'created', {
            ...newNews[0]
        });

        

       
       

    } catch (err) {

        return next(err);
    }
}