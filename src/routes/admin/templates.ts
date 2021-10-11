import { Router } from 'express';
import { body } from 'express-validator'
import * as newsControllers from '../../controllers/admin/templates';
import isAuth from '../../middlewere/isAuthAdmin'

const router = Router();

router.put('/slide/category',[
    body('name')
    .not().isEmpty()
], isAuth, newsControllers.createSlide);


router.delete('/slide/category',[
    body('id')
    .not().isEmpty(),
], isAuth, newsControllers.deleteSlide);

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

router.delete('/slide/file',[
    body('id')
    .not().isEmpty(),
], isAuth, newsControllers.deleteSlidesFile);

router.put('/signatures',[
    body('description')
    .not().isEmpty(),
    body('fileLink')
    .not().isEmpty().isURL()
    .withMessage('must be valid url'),
], isAuth, newsControllers.addSignature);


router.delete('/signatures',[
    body('id')
    .not().isEmpty(),
], isAuth, newsControllers.deleteSignature);



module.exports = router;