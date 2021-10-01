import { Router } from 'express';
import { body } from 'express-validator'
import * as newsControllers from '../../controllers/admin/templates';
import isAuth from '../../middlewere/isAuthAdmin'

const router = Router();

router.put('/slide/category',[
    body('name')
    .not().isEmpty()
], isAuth, newsControllers.createSlide);

router.put('/slide/file',[
    body('description')
    .not().isEmpty(),
    body('fileLink')
    .not().isEmpty().isURL()
    .withMessage('must be valid url'),
    body('slideId')
    .not().isEmpty()
    .isUUID()
], isAuth, newsControllers.addSlideFile);



module.exports = router;