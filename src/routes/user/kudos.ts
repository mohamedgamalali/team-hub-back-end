import { Router } from 'express';
import { body } from 'express-validator'
import * as kudosController from '../../controllers/user/kudos';
import passport from 'passport'
import isAuth from '../../middlewere/isAuth'

const router = Router();

router.post('/',[
    body('content')
    .not().isEmpty()
], isAuth, kudosController.addKudo);

router.post('/like',[
    body('id')
    .not().isEmpty()
], isAuth, kudosController.like);

router.get('/tag/:userName', isAuth, kudosController.tagsSearch);

router.post('/replay',[
    body('content')
    .not().isEmpty(),
    body('kudoId')
    .not().isEmpty()
    .isUUID(),
], isAuth, kudosController.postReplay);

router.get('/', isAuth, kudosController.getKudos);


module.exports = router;