import React, { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

interface AdBannerProps {
    // If using AdSense
    dataAdSlot?: string;
    dataAdFormat?: string;
    dataFullWidthResponsive?: boolean;
    // If using Adsterra or others (HTML/Script code)
    adCode?: string; 
    type?: 'adsense' | 'custom';
    height?: string; // New prop for dynamic height
}

// REPLACE THIS WITH YOUR REAL PUBLISHER ID IF USING ADSENSE
const ADSENSE_PUB_ID = 'ca-pub-YOUR_ID_HERE'; 

export const AdBanner: React.FC<AdBannerProps> = ({ 
    dataAdSlot, 
    dataAdFormat = 'auto', 
    dataFullWidthResponsive = true,
    adCode,
    type = 'adsense',
    height = '90px' // Default to banner height
}) => {
    const [adError, setAdError] = useState(false);
    const adLoaded = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // ADSENSE LOGIC
    useEffect(() => {
        if (type === 'adsense' && dataAdSlot && !adError && !adLoaded.current) {
            try {
                const timer = setTimeout(() => {
                    try {
                        (window.adsbygoogle = window.adsbygoogle || []).push({});
                        adLoaded.current = true;
                    } catch (e) {
                         console.error("AdSense Push Error:", e);
                         setAdError(true);
                    }
                }, 100);
                return () => clearTimeout(timer);
            } catch (e) {
                setAdError(true);
            }
        }
    }, [dataAdSlot, adError, type]);

    // CUSTOM AD LOGIC (Adsterra/PropellerAds)
    useEffect(() => {
        if (type === 'custom' && adCode && containerRef.current) {
            // Clear previous content
            containerRef.current.innerHTML = '';
            
            // Create a friendly iframe to sandbox the ad script safely within React
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.style.overflow = 'hidden';
            iframe.scrolling = 'no';
            
            containerRef.current.appendChild(iframe);

            const doc = iframe.contentWindow?.document;
            if (doc) {
                doc.open();
                // We inject CSS to center the content inside the iframe
                doc.write(`
                    <html>
                    <head>
                        <style>
                            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; }
                        </style>
                    </head>
                    <body>
                        ${adCode}
                    </body>
                    </html>
                `);
                doc.close();
            }
        }
    }, [adCode, type]);

    // Fallback UI (Affiliate Placeholder)
    const renderFallback = () => (
        <div className="w-full max-w-4xl mx-auto bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold animate-pulse-slow">
                    AD
                </div>
                <div>
                    <h4 className="text-white font-bold text-lg">Advertise Here</h4>
                    <p className="text-sm text-gray-400">Place your Adsterra or Affiliate banners here.</p>
                </div>
            </div>
            <button className="bg-white text-black font-bold px-6 py-2.5 rounded-full hover:bg-gray-200 transition text-sm relative z-10">
                Contact Us
            </button>
        </div>
    );

    return (
        <div className="w-full flex justify-center py-8 px-4 my-4">
            {type === 'adsense' && dataAdSlot && !adError ? (
                <div className="w-full max-w-[970px] min-h-[90px] bg-black/20 rounded overflow-hidden text-center mx-auto block">
                    <ins className="adsbygoogle"
                        style={{ display: 'block', width: '100%' }}
                        data-ad-client={ADSENSE_PUB_ID}
                        data-ad-slot={dataAdSlot}
                        data-ad-format={dataAdFormat}
                        data-full-width-responsive={dataFullWidthResponsive ? "true" : "false"}
                    ></ins>
                </div>
            ) : type === 'custom' && adCode ? (
                 <div ref={containerRef} style={{ height }} className="w-full max-w-[728px] mx-auto bg-black/20 rounded overflow-hidden">
                     {/* Custom Ad Injected Here */}
                 </div>
            ) : (
                renderFallback()
            )}
        </div>
    );
};