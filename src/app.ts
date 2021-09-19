import express, { Application, Request, Response, NextFunction } from 'express';
import { config } from 'dotenv';
import meddlewere from './meddlewere';
import { Connection, Services } from './services/Tenant';

config();


let app: Application = express();
const port: number | string = process.env.PORT || 8080;


app = meddlewere(app);

Connection.bootstrap().then((result) => {
    app.listen(port, () => {
        console.log(`server running on port: ${port}`);
    })
    // Connection.deleteAll();
    // Services.createTenant('test')
}).catch(err => {
    console.log(err);

});


