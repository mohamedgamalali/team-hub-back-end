import { Request, Response, NextFunction } from 'express';
import response from '../../helpers/Response'
import { validationResult } from 'express-validator'
import Kudos, {KudosData} from '../../services/kudos'
import { IGetUserAuthInfoRequest } from '../../services/isAuth';
import { v4 as uuid } from 'uuid';


export async function addKudo(req: any, res: Response, next: NextFunction) {

    try {


        const content = req.body.content;
        const files = req.files;
        const images_src = req.body.images_src;
        let finalImageSrc: any = [];

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return response.ValidationFaild(res, 'validation faild', errors.array())
        }

        const kudo = new Kudos(content, req.DB);
        const tage = await kudo.getTags();

        if (files) {
            files.forEach((element: any) => {
                finalImageSrc.push(element.path)
            });

        }

        if (images_src) {
            if (Array.isArray(images_src)) {

                finalImageSrc = finalImageSrc.concat(images_src)

            } else {
                return response.ValidationFaild(res, 'validation faild for images_src must be array', errors.array())
            }
        }



        const newKudo = await req.DB('kudos').insert({
            id: uuid(),
            user: req.user,
            content: content,
            images: finalImageSrc,
        }).returning('*');

        return response.created(res, 'created', {
            kudo: newKudo[0],
            tages: tage
        })

    } catch (err) {
        console.debug(err)
        return next(err);
    }
}

export async function like(req: any, res: Response, next: NextFunction) {

    try {


        const id = req.body.id;
        let status = 'created';
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return response.ValidationFaild(res, 'validation faild', errors.array())
        }
        const kudo = await req.DB.select('id').from('kudos').where('id', '=', id);
        if (kudo.length == 0) {
            return response.NotFound(res, 'kudo not found')
        }
        const like = await req.DB.select('*').from('kudos_likes').where({
            kudo: id,
            user: req.user
        });

        if (like.length == 0) {
            await req.DB('kudos_likes').insert({
                kudo: kudo[0].id,
                user: req.user,
                id: uuid(),
            }).returning('*');
        } else {
            await req.DB('kudos_likes').where({
                kudo: id,
                user: req.user
            }).del();
            status = 'deleted'
        }

        const totalLikes = await req.DB.select('*').from('kudos_likes').where({
            kudo: id
        });




        return response.ok(res, `like effected with status = ${status}`, {
            totalLikes: totalLikes.length
        })

    } catch (err) {
        console.debug(err)
        return next(err);
    }
}

export async function tagsSearch(req: any, res: Response, next: NextFunction) {

    try {


        const userName = req.params.userName;

        const users = await req.DB.select('name', 'id').from('users').where('name', 'like', `%${userName}%`)

        return response.ok(res, 'users with matching names', {
            users: users,
            total: users.length
        })

    } catch (err) {
        console.debug(err)
        return next(err);
    }
}

export async function postReplay(req: any, res: Response, next: NextFunction) {

    try {

        const content = req.body.content;
        const kudoId = req.body.kudoId;
        const files = req.files;
        const images_src = req.body.images_src;
        let finalImageSrc: any = [];
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return response.ValidationFaild(res, 'validation faild', errors.array())
        }

        const kudo = await req.DB.select('id').from('kudos').where({
            id: kudoId
        });

        if (kudo.length == 0) {
            return response.NotFound(res, 'kudo not found!!')
        }

        const kudoService = new Kudos(content, req.DB);
        const tage = await kudoService.getTags();
        
        if (files) {
            files.forEach((element: any) => {
                finalImageSrc.push(element.path)
            });

        }

        if (images_src) {
            if (Array.isArray(images_src)) {

                finalImageSrc = finalImageSrc.concat(images_src)

            } else {
                return response.ValidationFaild(res, 'validation faild for images_src must be array', errors.array())
            }
        }

        const replay = await req.DB('kudos_replay').insert({
            kudo: kudo[0].id,
            user: req.user,
            id: uuid(),
            content: content,
            images:finalImageSrc
        }).returning('*');



        return response.created(res, `replay added to kudo ${kudo[0].id}`, {
            replay: replay,
            tage: tage
        })

    } catch (err) {
        console.debug(err)
        return next(err);
    }
}

export async function getKudos(req: any, res: Response, next: NextFunction) {

    try {


        const tap  = req.query.tap  || 1;
        const page = Number(req.query.page) || 1;
        let data = {} ;


        const k = new KudosData(req.DB);

        if(tap == 1){
            data = await k.get(page, req.user)
        }else if(tap == 2){
            data = await k.get(page, req.user, {
                'kudos.user':req.user
            })
        }

        return response.ok(res, `kudos in page ${page}`, {
            ...data
        })




    } catch (err) {
        console.debug(err)
        return next(err);
    }
}


// export async function editKudo(req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) {

//     try {

//         const kudoId = req.body.kudoId ;
//         const content = req.body.content;
//         const files = req.files;
//         const images_src = req.body.images_src;
//         const deletedImages = req.body.deletedImages ;
//         let finalImageSrc: any = [];

//         const errors = validationResult(req);

//         if (!errors.isEmpty()) {
//             return response.ValidationFaild(res, 'validation faild', errors.array())
//         }



//         const kudo = new Kudos(content, req.DB);
//         const tage = await kudo.getTags();

//         if (files) {
//             files.forEach((element: any) => {
//                 finalImageSrc.push(element.path)
//             });

//         }

//         if (images_src) {
//             if (Array.isArray(images_src)) {

//                 finalImageSrc = finalImageSrc.concat(images_src)

//             } else {
//                 return response.ValidationFaild(res, 'validation faild for images_src must be array', errors.array())
//             }
//         }

//         const findKudo = await req.DB.select('*').from('kudos').where({
//             id:kudoId
//         });

//         if(findKudo.length == 0){
//             return response.NotFound(res, 'kudo not found');
//         }

//         let imgaesAfterDelete:any  ;

//         if(deletedImages){
//             if(!Array.isArray(deletedImages)){
//                 return response.ValidationFaild(res, 'deleted images must be array')
//             }else if(deletedImages.length > 0){
//                 imgaesAfterDelete = deletedImages.forEach(deleted=>{
//                     findKudo[0].images.filter((element:string) => element != deleted);
//                 })
//             }
//         }
        

//         imgaesAfterDelete = imgaesAfterDelete.concat(finalImageSrc);





//     } catch (err) {
//         console.debug(err)
//         return next(err);
//     }
// }