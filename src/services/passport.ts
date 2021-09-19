import passport, { Profile } from 'passport';

const googlePlusToken = require('passport-google-token').Strategy;

import { Request } from 'express'

import Auth from './isAuth';

import { validationResult } from 'express-validator'
import httpError from '../helpers/httpError';



passport.use('googleToken', new googlePlusToken({
    clientID: '331695122020-dmv4p069jbaimuog39vl07lgm8dmol5m.apps.googleusercontent.com',
    clientSecret: 'NZ-CDaqU_gLa2KvCZR41rBCk',
    passReqToCallback: true
}, async (req: Request, accessToken: any, refreshToken: any, profile: Profile, done: any) => {
    try {

        // await Services.createTenant('gpogrop');
        const result = await Auth.regesterSocialMedia(profile, req);
        return done(null, result);


    } catch (err) {

        return done(err, false);
    }


}))

export default passport;