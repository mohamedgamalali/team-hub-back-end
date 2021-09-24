import { Router } from 'express';
import { body } from 'express-validator'
import * as newsControllers from '../../controllers/admin/news';
import passport from 'passport'
import isAuth from '../../middlewere/isAuthAdmin'

const router = Router();

router.post('/',[
    body('content')
    .not().isEmpty()
], isAuth, newsControllers.postNews);



module.exports = router;