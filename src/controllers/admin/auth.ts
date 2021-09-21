import { Request, Response, NextFunction } from 'express';
import response from '../../helpers/Response'
import { validationResult } from 'express-validator'
// import authServices from '../../services/auth'
import Auth from '../../services/isAuth';

export async function signup(req: Request, res: Response, next: NextFunction) {

    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return response.ValidationFaild(res, 'validation faild', errors.array())
        }
        
        const result = await Auth.signupWorkspaec(req.body.access_token, req.body.email, req.body.workspace);

        return response.created(res, 'workspace created', {
            ...result
        })
       

    } catch (err) {

        return next(err);
    }
}