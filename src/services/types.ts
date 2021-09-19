export type config = {
    client: string,
    connection: {
        user: string,
        host: string,
        port: number,
        database: string,
        password: string
    },
    pool: { min: 2, max: 10 } 
}