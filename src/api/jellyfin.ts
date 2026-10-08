export type JellyfinAuth={server:string;token:string;user:any};
export type JItem={Id:string;Name:string;Type:string;ImageTags?:{Primary?:string};Overview?:string;ProductionYear?:number;RunTimeTicks?:number;MediaSources?:any[]};

export class JellyfinApi{
  constructor(private auth:JellyfinAuth){}
  private async request<T>(path:string, init:RequestInit={}):Promise<T>{
    const res=await fetch(this.auth.server.replace(/\\/$/,'')+path,{...init,headers:{'Content-Type':'application/json','X-Emby-Token':this.auth.token,...(init.headers||{})}});
    if(!res.ok) throw new Error('Jellyfin '+res.status+' '+res.statusText);
    return res.status===204?null as T:res.json();
  }
  views(){return this.request<{Items:JItem[]}>('/Users/'+this.auth.user.Id+'/Views');}
  items(params:string){return this.request<{Items:JItem[]}>('/Users/'+this.auth.user.Id+'/Items?'+params);}
  item(id:string){return this.request<JItem>('/Users/'+this.auth.user.Id+'/Items/'+encodeURIComponent(id)+'?Fields=Overview,Genres,People,MediaSources,Chapters,RunTimeTicks,ProductionYear');}
  authenticate(server:string,user:string,password:string){return fetch(server.replace(/\\/$/, '')+'/Users/AuthenticateByName',{method:'POST',headers:{'Content-Type':'application/json','X-Emby-Authorization':'MediaBrowser Client="Jellyfin Vega TV", Device="Fire TV", DeviceId="jellyfin-vega-tv", Version="0.1.0"'},body:JSON.stringify({Username:user,Pw:password})}).then(async r=>{if(!r.ok)throw new Error('Anmeldung fehlgeschlagen');return r.json();});}
  image(id:string){return this.auth.server+'/Items/'+encodeURIComponent(id)+'/Images/Primary?fillWidth=420&quality=90&api_key='+encodeURIComponent(this.auth.token);}
  stream(id:string,source:any){return this.auth.server+'/Videos/'+encodeURIComponent(id)+'/stream?Static=true&MediaSourceId='+encodeURIComponent(source.Id)+'&api_key='+encodeURIComponent(this.auth.token);}
}
