import { Router } from 'express';
import { body } from 'express-validator'
import * as profileController from '../../controllers/user/profile';
import passport from 'passport'
import isAuth from '../../middlewere/isAuth'

const router = Router();

router.post('/',[
    body('jop_title')
    .not().isEmpty(),
    body('phone')
    .not().isEmpty()
    .isMobilePhone(['en-US','ar-EG']),
    body('birthday')
    .not().isEmpty()

], isAuth, profileController.postProfile);



module.exports = router;