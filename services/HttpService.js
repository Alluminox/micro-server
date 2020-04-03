const axios = require('axios');

class HttpService {
    constructor(apiUrl) {
        this.apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, apiUrl.length -1) : apiUrl;
    }

    async integrate(method, uri, data, config = {}) {
        try {
            method = method.toLowerCase();

            const apiMethod = axios[method];
            if (!apiMethod) throw new Error("Invalid http method ", method);
    
            const params = [ `${this.apiUrl}/${uri === '/' ? '' : uri}` ];

            switch(method.toLowerCase()) {
                case 'post':
                case 'puth':
                case 'patch':
                    params.push(data)
                    params.push(config)
             
                    break;
                default:
                    params.push(config)
                    break;
            }
    
            return (await apiMethod(...params)).data;

        } catch(err) {
            throw err;
        }
        
    }

    get(uri, config = {}) {

        return this.integrate('get', uri, null, config);
    }

    post(uri, data, config = {}) {
        return this.integrate('post', uri, data, config);
    }

    patch(uri, data, config = {}) {
        return this.integrate('patch', uri, data, config);
    }

    put(uri, data, config = {}) {
        return this.integrate('put', uri, data, config);
    }

    delete(uri, config = {}) {
        return this.integrate('delete', uri, data, config);
    }

}


module.exports = HttpService;