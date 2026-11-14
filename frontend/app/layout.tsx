import './globals.css';
import type { ReactNode } from 'react';
export const metadata={title:'OmniAgent AI',description:'Unified AI customer support inbox'};
export default function RootLayout({children}:{children:ReactNode}) {
 return <html lang="en"><body>{children}</body></html>;
}
