export default class httpError {
    status:number
    state:number
    message:string
    
    constructor(status:number, state:number,message:string ){
        this.status  = status
        this.state   = state
        this.message = message
    }

}