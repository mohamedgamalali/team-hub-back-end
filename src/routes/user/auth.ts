import { Router } from 'express';
import { body } from 'express-validator'
import * as authController from '../../controllers/user/auth';
import passport from 'passport'
import isAuth from '../../middlewere/isAuthGeneral'

const router = Router();
router.post('/login', passport.authenticate('googleToken', { session: false }), authController.login);

router.post('/refresh_token', [
    body('refresh_token')
    .not().isEmpty()
], authController.regreshToken)



module.exports = router;