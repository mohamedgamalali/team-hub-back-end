import { Knex } from "knex";
import { check } from 'express-validator'
import httpError from "../helpers/httpError";
export default class Kudos {
    private content: string;
    private connection: Knex;
    constructor(content: string, connection: Knex) {
        this.content = content
        this.connection = connection
    }

    async getTags() {
        try {

            let userIds = [];
            const length = this.content.length;
            let i = 0;
            while (i < length) {
                const index = this.content.indexOf('@', i)

                if (index >= 0) {
                    const idNextIndex = this.content.indexOf(' ' || '\n', index);
                    i = index;

                    let user_id;
                    if (idNextIndex >= 0) {
                        user_id = this.content.slice(index + 1, idNextIndex)
                    } else {
                        user_id = this.content.slice(index + 1)
                    }

                    if (user_id.match(new RegExp(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i))) {
                        const us = await this.connection.select('id', 'name').from('users').where('id', '=', user_id)
                        if (us.length > 0) {
                            userIds.push(us[0])
                        }
                    } else {
                        const err = new httpError(422, 7, `tag must be uder id 'user id'!`)
                        throw err;
                    }

                } else {
                    break;
                }
                i++;

            }

            return userIds;

        } catch (err) {
            throw err;
        }
    }

    
}

export class KudosData {
    private perPage: number = 10;

    private connection: Knex;

    constructor(connection: Knex) {
        this.connection = connection;
    }

    async get(page: number, userId:string, query: object = {}) {
        try {
            console.log(page);

            const kudos = await this.connection('kudos')
                .orderBy('kudos.created_at', 'desc')
                .join('users', 'users.id', 'kudos.user')
                .select(
                    'users.name as userNamme', 'users.jop_title',
                    'users.image as userProfileImage', 'kudos.user',
                    'kudos.content', 'kudos.images',
                    'kudos.id','kudos.created_at'
                )
                .where(query)
                .limit(this.perPage)
                .offset((page - 1) * this.perPage);

            const total = await this.connection('kudos').where(query).count('id as count')


            let finalKudos = []
            for (let item of kudos) {
                const kudo = new Kudos(item.content, this.connection);
                const tages = await kudo.getTags();
                const isLiked = await this.isLiked(item.id, userId)
                finalKudos.push({
                    tages: tages,
                    isLiked:isLiked,
                    ...item
                })
            }

            return {
                kudos: finalKudos,
                total: total[0].count
            }






        } catch (err) {
            throw err;
        }
    }

    async isLiked(kudoId: string, userId: string) {
        try {

            const likes = await this.connection.select('user').from('kudos_likes').where({
                kudo:kudoId,
                user:userId
            });

            if(likes.length > 0){
                return true ;
            }

            return false ;

        } catch (err) {
            throw err;
        }
    }
}