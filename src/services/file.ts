import fs from 'fs';

export default class File {

    readonly files:string[]
    
    constructor(a:string[]){
        this.files = a ;
    }

    async deleteFile() {
        this.files.forEach((i:string)=>{
                fs.unlink(__dirname +'/../../'+ i,err=>{console.log(err);
            });
        });
    }
}