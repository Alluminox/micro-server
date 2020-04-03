const fs = require('fs');
const path = require('path');

const dotenv = require('dotenv-safe');
const { EventEmitter } = require('events');

const HttpService = require('./services/HttpService');

class Server {

    constructor() {

        // Server State
        this.state = {
            emitter: new EventEmitter()
        }

        // Config files
        this.configFile = (basePath, baseName, ext = 'json') => {
            const env = process.env.NODE_ENV;
            let file;
            switch(env) {
                case 'dev':
                case 'development':
                    file = 'dev'; 
                    break;
    
                case 'prod':
                case 'production':
                    file = "prod"
                    break;
    
                default:
                    file = "";
                }
                
                file = `${baseName}.${file ? file + '.' :  ''}${ext}`;
        
                return path.resolve(process.cwd(), basePath, file)                
        }
    
        // Import Config files
        this.importConfig = (path) =>  {
            if (fs.existsSync(path)) {
                this.setState(JSON.parse(fs.readFileSync(path, { encoding: 'utf-8' })))
            }
        }


        this.init();
    }

    init() {

        dotenv.config()
        this.importConfig(this.configFile('', 'config'));

        this.setState({
            events: [
                {
                    key: 'START',
                    action: this.createServer.bind(this)
                },

                {
                    key: 'STOP',
                    action: this.destroyServer.bind(this)
                },
                {
                    key: 'ERROR',
                    action: this.resolveErrors.bind(this)
                }
            ]
        }, () => this.listenEvents(this.state))
    }

    listenEvents() {
        const { emitter } = this.state;
        this.state.events.forEach(event => {
            emitter.on(event.key, event.action);
        });
    }

    setState = (data, callback) => {
        this.state = Object.assign({}, this.state, data)

        if (callback) {
            callback(this.state);
        }
    }


    start() {
        // this.listenProcessEvents();

        const { emitter } = this.state;
        emitter.emit('START');

    }


    stop() {
        const { emitter } = this.state;
        emitter.emit('STOP');
    }


    reportError(err) {
        if (err) {
            const { emitter } = this.state;
            emitter.emit('ERROR', err);
        }
    }

    resolveErrors(err) {
        console.log("[x] Error ocurrend on server", err.message);
        process.exit(0);
    }
}

class BootstrapServer extends Server {

    init () {
        super.init();
    }

    createServer() {
        throw new Error("Implement this method");
    }

    destroyServer() {
        const { running, server } = this.state;

        if (running) {
            this.setState({ 
                server: null, 
                running: false 
            }, () => {
                
                server.close((err) => {
                    if (err) {
                        this.reportError(err);
                        return process.exit(-1);
                    }
                    process.exit(1)
                })
            })
        }
    }
}


class MicroBootstrapServer extends BootstrapServer {
    
    async discoveryRegistry() {

        try {
            const { registry, server, api } = this.state;
            
            
            this.httpService =  new HttpService(registry.repo);
            
            const { type, host, port } = server;
            const { basePath } = api;

       

             if (registry.self) {
                 return await this.httpService.post('/', {
                     type,
                     basePath,
                     address: {
                         port,
                         host
                     }
                 })
             }
 
             Promise.resolve({});
        } catch(err) {
            throw err;
        }
     }
}

module.exports = MicroBootstrapServer;
