import {Response} from 'express'

type Res = {
    state:number,
    message:string,
    data:any
}

export default class response {
    
    static async CustomResponse(res:Response,status:number, message:string, data:any ,state:number){
        const response:Res = {
            state:state,
            message:message,
            data:data
        }
        return res.status(status).json({...response});
    }
    
    //200 ok
    static async ok(res:Response, message:string, data:any ){
        const response:Res = {
            state:1,
            message:message,
            data:data
        }
        return res.status(200).json({...response});
    }

    //201 created
    static async created(res:Response, message:string, data:any ){
        const response:Res = {
            state:1,
            message:message,
            data:data
        }
        return res.status(201).json({...response});
    }

    //ERRORS

    //401 unauthrized state = 2
    static async unauthorized(res:Response, message:string = 'unauthrized',data:any = 'error' ){
        const response:Res = {
            state:2,
            message:message,
            data:data
        }
        return res.status(401).json({...response});
    }

    //402 payment required state = 3
    static async paymentRequired(res:Response, message:string = 'payment required', data:any = 'error'  ){
        const response:Res = {
            state:3,
            message:message,
            data:data
        }
        return res.status(402).json({...response});
    }

    //403 Forbidden state = 4
    static async Forbidden(res:Response , message:string = 'Forbidden', data:any = 'error' ){
        const response:Res = {
            state:4,
            message:message,
            data:data
        }
        return res.status(403).json({...response});
    }

    //404 notFound state = 5
    static async NotFound(res:Response, message:string = 'not Found', data:any = 'error' ){
        const response:Res = {
            state:5,
            message:message,
            data:data
        }
        return res.status(404).json({...response});
    }

    //409 Conflict state = 8
    static async Conflict(res:Response, message:string = 'Conflict', data:any = 'error' ){
        const response:Res = {
            state:8,
            message:message,
            data:data
        }
        return res.status(409).json({...response});
    }

    //415 Unsupported Media Type state = 6
    static async UnsupportedMediaType(res:Response, message:string = 'Unsupported Media Type', data:any = 'error' ){
        const response:Res = {
            state:6,
            message:message,
            data:data
        }
        return res.status(415).json({...response});
    }

    //422 validation faild = 7
    static async ValidationFaild(res:Response, message:string = 'validation faild', data:any = 'error' ){
        const response:Res = {
            state:7,
            message:message,
            data:data
        }
        return res.status(422).json({...response});
    }

    //server error state = 0
    static async serverError(res:Response, message:string, data:string = 'error' ){
        const response:Res = {
            state:0,
            message:message,
            data:data
        }
        return res.status(500).json({...response});
    }

    

}