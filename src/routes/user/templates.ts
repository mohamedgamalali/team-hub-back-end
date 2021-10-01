import { Router } from 'express';
import { body } from 'express-validator'
import * as templatesController from '../../controllers/user/templates';
import passport from 'passport'
import isAuth from '../../middlewere/isAuth'

const router = Router();

router.get('/:template/category', isAuth, templatesController.getTemplatesCategory);

router.get('/:template/files/:categoryId', isAuth, templatesController.getTemplatesFiles);


module.exports = router;