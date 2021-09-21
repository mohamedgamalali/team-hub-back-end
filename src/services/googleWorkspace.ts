import axios from 'axios';
import httpError from '../helpers/httpError';

export default class WorkSpace {

    async listUsers(token: string, email: string) {
        try {

            const domain = email.slice(email.indexOf('@') + 1, email.length);





            const response = await axios.get(`https://admin.googleapis.com/admin/directory/v1/users?domain=${domain}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            let users: object[] = [];
            let isWorker = false;
            response.data.users.forEach((user: any) => {

                if (user.primaryEmail == email) {

                    isWorker = true;

                    if (!user.isAdmin) {
                        const err = new httpError(403, 4, 'not an admin');
                        throw err;
                    }
                }

                
                let role = 'user';

                if (user.isAdmin) {
                    role = 'admin';
                }

                users.push({
                    email: user.primaryEmail,
                    googleId: user.id,
                    role: role,
                    name: user.name.fullName
                });

            });


            if (!isWorker) {
                const err = new httpError(403, 4, 'not a member in the workplace');
                throw err;
            }

            return users;


        } catch (err) {
            throw err;
        }
    }

}