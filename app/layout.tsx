import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'밥Lah — Eat where today?',description:'Three good lunch options around Mapletree Business City. Pick, go, eat.',robots:{index:false,follow:false},icons:{icon:'/brand/baplah-mark.svg',apple:'/brand/baplah-app-icon-180.png'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#FFF8ED'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
