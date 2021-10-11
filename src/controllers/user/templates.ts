import { Request, Response, NextFunction } from 'express';
import response from '../../helpers/Response'
import { validationResult } from 'express-validator'
import { IGetUserAuthInfoRequest } from '../../services/isAuth';
// import authServices from '../../services/auth'
import { v4 as uuid } from 'uuid';

export async function getTemplatesCategory(req: any, res: Response, next: NextFunction) {

    try {

        const { template } = req.params;

        const perPage = 10;

        const page = req.query.page || 1;

        if (!['slides', 'signatures'/*, 'letterhead'*/].includes(template)) {
            return response.ValidationFaild(res, 'invalid template name', {
                template: template
            });
        }

        const categories: object[] = await req.DB.select('*')
            .from(template).where({
                hide: false
            })
            .orderBy(`${template}.created_at`, 'desc')
            .limit(perPage)
            .offset((page - 1) * perPage);;

        const total: object[] | any = await req.DB(template)
            .where({
                hide: false
            }).count('id as count')

        return response.ok(res, `${template}`, {
            categories,
            total: Number(total[0].count) 
        });


    } catch (err) {

        return next(err);
    }
}

export async function getTemplatesFiles(req: any, res: Response, next: NextFunction) {

    try {

        const { template, categoryId } = req.params;
        const page = req.query.page || 1;

        if (!['slides'/*, 'signatures', 'letterhead'*/].includes(template)) {
            return response.ValidationFaild(res, 'invalid template name', {
                template: template
            });
        }

        const files: object[] = await req.DB.select('description', 'id', 'fileLink').from(`${template}-files`).where({
            hide: false,
            slide: categoryId
        });


        return response.ok(res, `files in ${template} `, {
            files
        });


    } catch (err) {

        return next(err);
    }
}