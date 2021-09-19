import { Request, Response, NextFunction } from 'express';
import response from '../../helpers/Response'
import { validationResult } from 'express-validator'
// import authServices from '../../services/auth'


export async function login(req: Request, res: Response, next: NextFunction) {

    try {
        
        return res.status(400).json({
            state:1,
            message:'hello'
        })

    } catch (err) {
        console.debug(err)
        return next(err);
    }
}