import { Request, Response, NextFunction } from 'express';
import response from '../../helpers/Response'
import { validationResult } from 'express-validator'
import { IGetUserAuthInfoRequest } from '../../services/isAuth';
// import authServices from '../../services/auth'
import { v4 as uuid } from 'uuid';

export async function createSlide(req: any, res: Response, next: NextFunction) {

    try {

        const {name} = req.body ;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return response.ValidationFaild(res, 'validation faild', errors.array())
        }

        const newSlide = await req.DB('slides').insert({
            id:uuid(),
            name:name,
            user:req.user
        }).returning('*') ;
        
        return response.created(res, 'slide created', {
            ...newSlide[0]
        });

       
    } catch (err) {

        return next(err);
    }
}

export async function addSlideFile(req: any, res: Response, next: NextFunction) {

    try {

        const {description, fileLink, slideId} = req.body ;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return response.ValidationFaild(res, 'validation faild', errors.array())
        }

        const slide = await req.DB.select('id').from('slides').where({
            id:slideId
        });

        if(!slide.length){
            return response.NotFound(res, 'slide not found', {
                slideId:slideId
            });
        }

        const newSlideFile = await req.DB('slides-files').insert({
            id:uuid(),
            description:description,
            fileLink:fileLink,
            user:req.user,
            slide:slideId
        }).returning('*') ;

        return response.created(res, 'slide file added', {
            ...newSlideFile[0]
        });
       
    } catch (err) {

        return next(err);
    }
}