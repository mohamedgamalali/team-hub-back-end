
import { Request, Response, NextFunction} from 'express';
import isAuth from '../services/isAuth'

export default async function(req:Request, res:Response, next:NextFunction){
    try{
        await isAuth.IsAuthrizedUserGeneral(<any>req, res, next);
    }
    catch(err){
        next(err);
    }
}