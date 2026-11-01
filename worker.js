import {onRequest} from './functions/api/[[path]].js';
export default {async fetch(request,env){
 const u=new URL(request.url);
 if(u.pathname.startsWith('/api/'))return onRequest({request,env,params:{path:u.pathname.slice(5).split('/')}});
 return env.ASSETS.fetch(request)}}
