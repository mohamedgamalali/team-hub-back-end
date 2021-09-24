import express, { Application, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import errorHandler from './helpers/error'
import path from 'path'
import fs from 'fs';
import passAuth from './services/passport';
// import response from './helpers/Response';
// import swaggerUi from 'swagger-ui-express'
import bodyParser from 'body-parser';
//multer
const fileStorage = multer.diskStorage({
    destination: (req: any, file: any, cb: CallableFunction) => {
        cb(null, 'uploads');
    },
    filename: (req: any, file: any, cb: CallableFunction) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});




const fileFilter: any = (req: any, file: any, cb: any) => {
    if (file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false, new Error('only images are allowed'));
    }
}



export default (app: Application) => {

    const BASE_URL: string = `/api/${process.env.VERSION || 'v1'}`

    //bodyParser
    app.use(bodyParser.json());

    //multer image
    app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).array('image'));

    //passport
    app.use(passAuth.initialize());

    // app.use('/uploads', express.static(path.join(__dirname, '../', 'uploads')));


    //headers meddlewere
    app.use((req: Request, res: Response, next: NextFunction) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
        next();
    });


    app.use((req: Request, res: Response, next: NextFunction) => {

        if (req.method == 'OPTIONS') {
            return res.status(200).json({})
        }

        next() ;

    })


    // fs.readdir(path.join(__dirname, 'routes'), (err, files) => {
    //     if (err) console.error(err)

    //     for(let file of files) {
    //         fs.readdir(path.join(__dirname, 'routes', file), (err, tsFiles) => {
    //             tsFiles.forEach(f => {
    //                 const ext: string = path.extname(path.join(__dirname, 'routes', file, f))


    //                 app.use(`${BASE_URL}/${file}/${f.replace(ext, '')}`, require(`./routes/${file}/${f}`))

    //             })
    //         })
    //     }

    // })

    //user
    app.use(`${BASE_URL}/user/auth`, require(`./routes/user/auth`));
    app.use(`${BASE_URL}/user/kudos`, require(`./routes/user/kudos`));
    app.use(`${BASE_URL}/user/profile`, require(`./routes/user/profile`));

    //admin
    app.use(`${BASE_URL}/admin/auth`, require(`./routes/admin/auth`));




    //error handler
    app.use(errorHandler);


    return app;
}