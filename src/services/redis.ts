import { createClient, RedisClient } from 'redis'

export default class radisServis {

    client: RedisClient;

    constructor() {
        this.client = createClient();
    }
    async insert(key: string, data: object) {
        try {



            const allData: any = await this._get(key);

            const elementActualKey = `${key}-${allData.length}`;

            const DD = new Promise((resolve, reject) => {
                this.client.hmset(elementActualKey, this._radisObject(data))
                resolve('done')
            });


            await DD



        } catch (err) {
            throw err;
        }
    }

    private _radisObject(data: object) {
        try {
            let redisObject = []
            for (let [key, value] of Object.entries(data)) {

                redisObject.push(key)
                redisObject.push(value)

            }
            return redisObject;

        } catch (err) {
            throw err;
        }
    }

    private async _get(key: string) {
        try {

            let finalData: object[] = [];
            for (let index = 0; ; index++) {
                const data:any = await this._element(key, index)
                if(!data){
                    break;
                }
                finalData.push({...data});
            }

            return finalData; 



        } catch (err) {
            throw err;
        }
    }

    async find(key: string, data:object = {}) {
        try {

            const allData = await this._get(key);

            const item = allData.filter((item:any)=>{
                let found = true ;
                for(let [key, value] of Object.entries(data) ){
                    if(item[key] != value){
                        found = false ;
                    }
                }
                if(found){
                    return item ;
                }
                
            });

            return item;
            

        } catch (err) {
            throw err;
        }
    }

    private async _element(key: string, index: number) {
        try {

            const get = new Promise((resolve, reject) => {

                this.client.hgetall(`${key}-${index}`, (err, data) => {
                    if (err) {
                        reject(err)
                    }

                    resolve(data)


                });

            });

            const D = await get;
            return D;

        } catch (err) {
            throw err;
        }
    }

}