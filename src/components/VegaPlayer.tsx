import React,{useEffect,useRef,useState} from 'react';
import {BackHandler,Pressable,StyleSheet,Text,View} from 'react-native';
import {KeplerCaptionsView,KeplerVideoSurfaceView,VideoPlayer} from '@amazon-devices/react-native-w3cmedia';
import {JellyfinApi,JItem,JMediaSource} from '../api/jellyfin';
import {playbackUrl,secondsToTicks,ticksToSeconds} from '../api/playback';

export function VegaPlayer({api,item,onClose,onEnded}:{api:JellyfinApi;item:JItem;onClose:()=>void;onEnded?:()=>void}){
 const player=useRef<VideoPlayer|null>(null); const source=useRef<JMediaSource|null>(null);
 const [ready,setReady]=useState(false); const [paused,setPaused]=useState(false); const [position,setPosition]=useState(ticksToSeconds(item.UserData?.PlaybackPositionTicks));
 const [duration,setDuration]=useState(ticksToSeconds(item.RunTimeTicks)); const [error,setError]=useState(''); const [controls,setControls]=useState(true); const [audioIndex,setAudioIndex]=useState<number|undefined>(); const [subtitleIndex,setSubtitleIndex]=useState<number|undefined>();
 const streamUrl=(s:JMediaSource)=>{const p=playbackUrl(api,item,s);return p?p.url:''};
 const report=async(final=false)=>{try{const t=secondsToTicks(position);if(final)await api.reportStop(item.Id,source.current?.Id,t);else await api.reportProgress(item.Id,source.current?.Id,t,paused);}catch{}};
 const load=async(start:number)=>{
  try{setError('');const info=await api.playbackInfo(item.Id,secondsToTicks(start),audioIndex,subtitleIndex);const s=info.MediaSources?.find(x=>x.SupportsDirectPlay)||info.MediaSources?.find(x=>x.SupportsDirectStream)||info.MediaSources?.find(x=>x.SupportsTranscoding)||info.MediaSources?.[0];
   if(!s)throw new Error('Keine abspielbare Quelle gefunden.');source.current=s;const url=streamUrl(s);if(!url)throw new Error('Keine Wiedergabe-URL verfügbar.');
   const p=new VideoPlayer();player.current=p;await p.initialize();p.autoplay=false;
   const onMeta=()=>{const d=Number(p.duration||0);if(d>0)setDuration(d);try{p.currentTime=Math.max(0,start)}catch{}p.play().catch(()=>{});setReady(true)};
   const onTime=()=>{setPosition(Number(p.currentTime||0));const d=Number(p.duration||0);if(d>0)setDuration(d)};
   const onPlay=()=>setPaused(false);const onPause=()=>setPaused(true);const onEnd=async()=>{await report(true);onEnded&&onEnded()};const onErr=()=>setError('Die Wiedergabe konnte nicht gestartet werden.');
   p.addEventListener('loadedmetadata',onMeta);p.addEventListener('timeupdate',onTime);p.addEventListener('play',onPlay);p.addEventListener('pause',onPause);p.addEventListener('ended',onEnd);p.addEventListener('error',onErr);p.src=url;const method=s.SupportsDirectPlay?'DirectPlay':s.SupportsDirectStream?'DirectStream':'Transcode';await api.reportStart(item.Id,s.Id,secondsToTicks(start),method);
  }catch(e:any){setError(e?.message||'Wiedergabefehler.')} 
 };
 useEffect(()=>{load(position);const timer=setInterval(()=>{if(player.current)report(false)},5000);const back=BackHandler.addEventListener('hardwareBackPress',()=>{report(true);player.current?.pause();onClose();return true});return()=>{clearInterval(timer);back.remove();report(true);player.current?.pause();player.current?.deinitialize?.();player.current=null}},[]);
 const switchTrack=async(type:'audio'|'subtitle')=>{const streams=(source.current?.MediaStreams||item.MediaStreams||[]).filter(v=>v.Type===(type==='audio'?'Audio':'Subtitle'));if(!streams.length)return;const current=type==='audio'?audioIndex:subtitleIndex;const next=streams.find(v=>v.Index!==current)?.Index??streams[0].Index;if(type==='audio')setAudioIndex(next);else setSubtitleIndex(next);const pos=Number(player.current?.currentTime||position);await player.current?.deinitialize?.();player.current=null;setReady(false);setTimeout(()=>load(pos),0)};
 const seek=(delta:number)=>{if(!player.current)return;const n=Math.max(0,Math.min(duration||Number.MAX_SAFE_INTEGER,Number(player.current.currentTime||0)+delta));player.current.currentTime=n;setPosition(n)};
 const toggle=()=>{if(!player.current)return;if(paused)player.current.play().catch(()=>{});else player.current.pause()};
 const progress=duration>0?Math.min(1,position/duration):0;
 return <View style={s.root}>
  <KeplerVideoSurfaceView style={s.video} onSurfaceViewCreated={(h:string)=>{player.current?.setSurfaceHandle(h);if(ready&&!paused)player.current?.play().catch(()=>{})}} onSurfaceViewDestroyed={(h:string)=>player.current?.clearSurfaceHandle(h)}/>
  <KeplerCaptionsView onCaptionViewCreated={(h:string)=>player.current?.setCaptionViewHandle(h)} style={s.captions}/>
  <Pressable style={s.touch} onPress={()=>setControls(v=>!v)}/>
  {!ready&&!error&&<View style={s.center}><Text style={s.centerText}>Wiedergabe wird vorbereitet …</Text></View>}
  {!!error&&<View style={s.center}><Text style={s.error}>{error}</Text><Pressable hasTVPreferredFocus onPress={()=>load(position)} style={s.action}><Text style={s.actionText}>ERNEUT VERSUCHEN</Text></Pressable><Pressable onPress={onClose} style={s.secondary}><Text style={s.actionText}>ZURÜCK</Text></Pressable></View>}
  {controls&&!error&&<View style={s.controls}><Text numberOfLines={1} style={s.title}>{item.Name}</Text><View style={s.row}>
   <Pressable hasTVPreferredFocus onPress={()=>seek(-30)} style={({focused})=>[s.control,focused&&s.focus]}><Text style={s.controlText}>−30</Text></Pressable>
   <Pressable onPress={toggle} style={({focused})=>[s.control,focused&&s.focus]}><Text style={s.controlText}>{paused?'▶':'❚❚'}</Text></Pressable>
   <Pressable onPress={()=>seek(30)} style={({focused})=>[s.control,focused&&s.focus]}><Text style={s.controlText}>+30</Text></Pressable>
   <Pressable onPress={()=>switchTrack('audio')} style={({focused})=>[s.control,focused&&s.focus]}><Text style={s.controlText}>AUDIO</Text></Pressable>
   <Pressable onPress={()=>switchTrack('subtitle')} style={({focused})=>[s.control,focused&&s.focus]}><Text style={s.controlText}>UT</Text></Pressable>
   <Pressable onPress={()=>{report(true);player.current?.pause();onClose()}} style={({focused})=>[s.control,focused&&s.focus]}><Text style={s.controlText}>ZURÜCK</Text></Pressable>
  </View><View style={s.progress}><View style={[s.fill,{width:(progress*100)+'%'}]}/></View><Text style={s.time}>{fmt(position)} / {fmt(duration)}</Text></View>}
 </View>;
}
const fmt=(v:number)=>{const n=Math.max(0,Math.floor(v||0));const h=Math.floor(n/3600);const m=String(Math.floor((n%3600)/60)).padStart(2,'0');const sec=String(n%60).padStart(2,'0');return h?String(h)+':'+m+':'+sec:m+':'+sec};
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#000'},video:{position:'absolute',left:0,right:0,top:0,bottom:0},captions:{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'transparent'},touch:{position:'absolute',left:0,right:0,top:0,bottom:0},controls:{position:'absolute',left:42,right:42,bottom:30,backgroundColor:'rgba(10,10,10,0.92)',padding:20,borderRadius:12},title:{color:'#fff',fontSize:25,fontWeight:'800',marginBottom:14},row:{flexDirection:'row',gap:10},control:{backgroundColor:'#252525',paddingHorizontal:20,paddingVertical:13,borderRadius:7},controlText:{color:'#fff',fontSize:16,fontWeight:'800'},focus:{backgroundColor:'#00a4dc',transform:[{scale:1.05}]},progress:{height:6,backgroundColor:'#555',marginTop:18,borderRadius:3,overflow:'hidden'},fill:{height:6,backgroundColor:'#00a4dc'},time:{color:'#ddd',marginTop:7,fontSize:14},center:{position:'absolute',left:0,right:0,top:0,bottom:0,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(0,0,0,.5)'},centerText:{color:'#fff',fontSize:24},error:{color:'#fff',fontSize:22,textAlign:'center',maxWidth:800,marginBottom:18},action:{backgroundColor:'#00a4dc',paddingHorizontal:22,paddingVertical:14,borderRadius:7,marginTop:10},secondary:{backgroundColor:'#333',paddingHorizontal:22,paddingVertical:14,borderRadius:7,marginTop:10},actionText:{color:'#fff',fontSize:16,fontWeight:'800'}});