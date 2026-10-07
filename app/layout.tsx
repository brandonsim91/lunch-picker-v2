import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'밥Lah — Eat where today?',description:'Three good lunch options around Mapletree Business City. Pick, go, eat.',robots:{index:false,follow:false},applicationName:'밥Lah',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'밥Lah',statusBarStyle:'default'},icons:{icon:[{url:'/favicon-v2.ico',sizes:'16x16 32x32 48x48',type:'image/x-icon'},{url:'/icon-192.png?v=2',sizes:'192x192',type:'image/png'},{url:'/icon-512.png?v=2',sizes:'512x512',type:'image/png'}],apple:[{url:'/apple-touch-icon-v2.png',sizes:'180x180',type:'image/png'}],shortcut:'/favicon-v2.ico'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#FFF8ED'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
