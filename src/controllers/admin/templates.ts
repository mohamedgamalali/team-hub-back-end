import { Request, Response, NextFunction } from 'express';
import response from '../../helpers/Response'
import { validationResult } from 'express-validator'
import { IGetUserAuthInfoRequest } from '../../services/isAuth';
// import authServices from '../../services/auth'
import { v4 as uuid } from 'uuid';
import { selectFields } from 'express-validator/src/select-fields';

export async function createSlide(req: any, res: Response, next: NextFunction) {

    try {

        const { name } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return response.ValidationFaild(res, 'validation faild', errors.array())
        }

        const newSlide = await req.DB('slides').insert({
            id: uuid(),
            name: name,
            user: req.user
        }).returning('*');

        return response.created(res, 'slide created', {
            ...newSlide[0]
        });


    } catch (err) {

        return next(err);
    }
}

export async function deleteSlide(req: any, res: Response, next: NextFunction) {  //delete and restore

    try {

        const { id } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return response.ValidationFaild(res, 'validation faild', errors.array())
        }

        const slide = await req.DB.select('*').from('slides').where({
            id:id
        });

        if(!slide.length){
            return response.NotFound(res, 'slide not found');
        }


        const newSlide = await req.DB('slides')
        .where({
            id:id
        })
        .update({
            hide:!slide[0].hide
        }).returning('*');

        return response.created(res, 'slide created', {
            slide:newSlide[0]
        });


    } catch (err) {

        return next(err);
    }
}

export async function addSlideFile(req: any, res: Response, next: NextFunction) {

    try {

        const { description, fileLink, slideId } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return response.ValidationFaild(res, 'validation faild', errors.array())
        }

        const slide = await req.DB.select('id').from('slides').where({
            id: slideId
        });

        if (!slide.length) {
            return response.NotFound(res, 'slide not found', {
                slideId: slideId
            });
        }

        const newSlideFile = await req.DB('slides-files').insert({
            id: uuid(),
            description: description,
            fileLink: fileLink,
            user: req.user,
            slide: slideId
        }).returning('*');

        return response.created(res, 'slide file added', {
            ...newSlideFile[0]
        });

    } catch (err) {

        return next(err);
    }
}


export async function deleteSlidesFile(req: any, res: Response, next: NextFunction) {  //delete and restore

    try {

        const { id } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return response.ValidationFaild(res, 'validation faild', errors.array())
        }

        const slide = await req.DB.select('*').from('slides-files').where({
            id:id
        });
        
        if(!slide.length){
            return response.NotFound(res, 'slide file not found');
        }


        const newSlide = await req.DB('slides-files')
        .where({
            id:id
        })
        .update({
            hide:!slide[0].hide
        }).returning('*');

        return response.created(res, 'slide created', {
            slide:newSlide[0]
        });


    } catch (err) {

        return next(err);
    }
}


export async function addSignature(req: any, res: Response, next: NextFunction) {

    try {

        const { description, fileLink } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return response.ValidationFaild(res, 'validation faild', errors.array())
        }

        const newSignature = await req.DB('signatures').insert({
            id: uuid(),
            description: description,
            fileLink: fileLink,
            user: req.user,
        }).returning('*');


        return response.created(res, 'signature added', {
            signature: newSignature[0]
        });

    } catch (err) {

        return next(err);
    }
}


export async function deleteSignature(req: any, res: Response, next: NextFunction) {  //delete and restore

    try {

        const { id } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return response.ValidationFaild(res, 'validation faild', errors.array())
        }


        const signature = await req.DB.select('*').from('signatures').where({
            id: id
        });

        if (!signature.length) {
            return response.NotFound(res, 'signature not found!!')
        } 


        const updatedSignature = await req.DB('signatures').update({
            hide: !signature[0].hide
        }).where({
            id: id
        }).returning('*');


        return response.ok(res, 'deleted', {
            signature: updatedSignature[0]
        });

    } catch (err) {

        return next(err);
    }
}