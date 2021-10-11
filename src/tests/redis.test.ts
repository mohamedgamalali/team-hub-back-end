import Redis from '../src/services/redis';

describe('redis test', ()=>{
    test('radis object', async()=>{

        const redis = new Redis();
        // await redis.insert('test',{
        //     name:'mohamed',
        //     number:653456
        // });

        const data = await redis.find('test')

        console.log(data);
         

    }, 100000)

    test('radis find one', async()=>{

        const redis = new Redis();
        const item = await redis.find('test', {
            name:'mohamed',
            number:20
        });

        

        console.log(item);
         

    }, 100000)
})