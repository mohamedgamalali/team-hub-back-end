import { Router } from 'express';
import { body } from 'express-validator'
import * as authController from '../../controllers/admin/auth';
// import passport from 'passport'


const router = Router();

router.post('/signup',[
    body('workspace')
    .not().isEmpty(),
    body('access_token')
    .not().isEmpty(),
    body('email')
    .not().isEmpty(),
], authController.signup);




module.exports = router;