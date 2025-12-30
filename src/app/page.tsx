"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
// --- THEME CONFIGURATION ---
const themes = {
  neon: {
    name: "Neon Space",
    bg: "bg-black",
    text: "text-white",
    primary: "from-green-400 to-emerald-600",
    accent: "text-green-400",
    score: "from-green-500 to-emerald-900",
    cardBorder: "border-green-500/30",
    cardHover: "hover:border-green-400/50 hover:shadow-[0_0_30px_rgba(74,222,128,0.3)]",
    button: "bg-green-500 hover:bg-green-400 text-black",
  },
  cyberpunk: {
    name: "Cyberpunk City",
    bg: "bg-slate-900",
    text: "text-yellow-50",
    primary: "from-yellow-400 to-pink-600",
    accent: "text-yellow-400",
    score: "from-yellow-500 to-pink-900",
    cardBorder: "border-yellow-500/30",
    cardHover: "hover:border-yellow-400/50 hover:shadow-[0_0_30px_rgba(250,204,21,0.3)]",
    button: "bg-yellow-500 hover:bg-yellow-400 text-black",
  },
  retro: {
    name: "Retro Wave",
    bg: "bg-[#120024]",
    text: "text-pink-100",
    primary: "from-blue-400 to-purple-600",
    accent: "text-blue-400",
    score: "from-blue-500 to-purple-900",
    cardBorder: "border-blue-500/30",
    cardHover: "hover:border-blue-400/50 hover:shadow-[0_0_30px_rgba(96,165,250,0.3)]",
    button: "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white",
  },
  minimal: {
    name: "Minimal Dark",
    bg: "bg-neutral-950",
    text: "text-neutral-200",
    primary: "from-neutral-100 to-neutral-400",
    accent: "text-white",
    score: "from-neutral-100 to-neutral-600",
    cardBorder: "border-white/20",
    cardHover: "hover:border-white/40 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]",
    button: "bg-white hover:bg-neutral-200 text-black",
  },
};

type ThemeKey = keyof typeof themes;

// --- IMPROVED 3D TILT CARD COMPONENT (WITH MOBILE TAP SUPPORT) ---
const TiltCard = ({ item, theme }: { item: any, theme: any }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  
  // New State: Controls visibility of the roast (Hybrid: Hover on PC, Click on Mobile)
  const [isRevealed, setIsRevealed] = useState(false);

  // 3D Tilt Logic
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    const rotateX = (mouseY / height) * -20; 
    const rotateY = (mouseX / width) * 20;

    setRotate({ x: rotateX, y: rotateY });
  };

  // Interaction Handlers
  const handleMouseEnter = () => setIsRevealed(true);
  
  const handleMouseLeave = () => {
    setIsRevealed(false);
    setRotate({ x: 0, y: 0 }); // Reset tilt on leave
  };

  const handleClick = () => {
    // On mobile, this toggles. On desktop, it does nothing because hover handles it.
    setIsRevealed(!isRevealed);
  };

  return (
    <div 
      className="perspective-container" 
      style={{ perspective: "1000px" }}
    >
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick} // Added click handler for mobile
        style={{ 
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        }}
        className={`relative h-[450px] w-full rounded-3xl overflow-hidden transition-transform duration-200 ease-out shadow-2xl border ${theme.cardBorder} cursor-pointer`}
      >
        {/* 1. BACKGROUND IMAGE */}
        <div className="absolute inset-0 z-0 bg-neutral-900">
          {item.image ? (
            <img 
              src={item.image} 
              alt={item.name} 
              className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${isRevealed ? 'scale-110 blur-md opacity-50' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-800">
               <span className="text-6xl opacity-20">🎵</span>
            </div>
          )}
        </div>

        {/* 2. DARK OVERLAY */}
        <div className={`absolute inset-0 z-10 bg-gradient-to-t from-black via-black/40 to-transparent transition-all duration-500 ${isRevealed ? 'bg-black/80 opacity-100' : 'opacity-80'}`} />

        {/* 3. CONTENT CONTAINER */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-8">
          
          {/* MOVING CONTAINER */}
          <div className={`transform transition-transform duration-500 ease-out ${isRevealed ? '-translate-y-4' : 'translate-y-[10px]'}`}>
            
            {/* LABEL */}
            <span className={`text-[10px] font-extrabold ${theme.accent} uppercase tracking-[0.2em] mb-2 block transition-opacity duration-300 ${isRevealed ? 'opacity-100' : 'opacity-0'}`}>
               DETECTED
            </span>

            {/* ARTIST NAME */}
            <h3 className="text-white font-black text-3xl leading-none drop-shadow-xl mb-4 transition-all duration-500">
              {item.name}
            </h3>

            {/* MOBILE HINT (Only shows when NOT revealed on small screens) */}
            <p className={`md:hidden text-xs ${theme.accent} animate-pulse mb-2 ${isRevealed ? 'hidden' : 'block'}`}>
              Tap to see roast...
            </p>

            {/* THE ROAST (Controlled by State now, not group-hover) */}
            <div className={`overflow-hidden transition-all duration-500 ${isRevealed ? 'h-auto opacity-100' : 'h-0 opacity-0'}`}>
              <div className={`w-10 h-1 bg-gradient-to-r ${theme.primary} mb-4 rounded-full`} />
              <p className="text-gray-200 text-sm leading-relaxed font-medium italic border-l-2 border-white/20 pl-4">
                "{item.roast}"
              </p>
            </div>

          </div>
        </div>

        {/* BORDER GLOW */}
        <div className={`absolute inset-0 border-2 border-transparent transition-all duration-300 rounded-3xl pointer-events-none ${isRevealed ? theme.cardHover.replace('hover:', '') : ''}`} />
      
      </div>
    </div>
  );
};
// --- LOADING SPINNER COMPONENT ---
const LoadingSpinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// --- SKELETON CARD COMPONENT ---
// --- NEW: SCORE SKELETON (Prevents layout shift) ---
const ScoreSkeleton = ({ theme }: { theme: any }) => (
  <div className="text-center mb-20 relative flex flex-col items-center animate-pulse">
    {/* Big Number Placeholder */}
    <div className={`h-40 w-64 rounded-xl animate-shimmer ${theme.cardBorder} border-white/5`}></div>
    {/* Text Label Placeholder */}
    <div className="h-6 w-48 mt-6 rounded-full animate-shimmer"></div>
  </div>
);

// --- IMPROVED SKELETON CARD (Fluid Shimmer) ---
const SkeletonCard = ({ theme }: { theme: any }) => (
  <div className={`relative h-[450px] w-full bg-white/5 backdrop-blur-md border ${theme.cardBorder} rounded-3xl overflow-hidden shadow-2xl`}>
    
    {/* Image Area - Shimmering */}
    <div className="h-full w-full absolute inset-0 z-0 animate-shimmer opacity-50" />
    
    {/* Content Skeleton */}
    <div className="absolute inset-0 z-10 p-8 flex flex-col justify-end space-y-5">
      
      {/* Fake Title */}
      <div className="h-10 w-3/4 rounded-lg animate-shimmer bg-white/10" />
      
      {/* Fake Roast Lines */}
      <div className="space-y-3 pt-2">
        <div className="h-3 w-full rounded-full animate-shimmer bg-white/5" />
        <div className="h-3 w-5/6 rounded-full animate-shimmer bg-white/5" />
        <div className="h-3 w-4/6 rounded-full animate-shimmer bg-white/5" />
      </div>
    </div>

    {/* Subtle Border Glow */}
    <div className="absolute inset-0 border border-white/5 rounded-3xl" />
  </div>
);
export default function Home() {
  const { data: session } = useSession();
  const [roastData, setRoastData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>("neon");
  const [showThemes, setShowThemes] = useState(false);
  
  // New States for Playlist Mode
  const [mode, setMode] = useState<'user' | 'playlist'>('user');
  const [playlistUrl, setPlaylistUrl] = useState("");

  const theme = themes[currentTheme];

// --- MOUSE PARALLAX EFFECT ---
  useEffect(() => {
    let ticking = false;
    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const x = e.clientX / window.innerWidth;
          const y = e.clientY / window.innerHeight;
          
          // Move stars opposite to mouse
          const s1 = document.getElementById('stars1');
          const s2 = document.getElementById('stars2');
          const s3 = document.getElementById('stars3');
          
          // Layer 1 (Slowest)
          if (s1) s1.style.transform = `translate(${x * -20}px, ${y * -20}px)`;
          // Layer 2 (Medium)
          if (s2) s2.style.transform = `translate(${x * -40}px, ${y * -40}px)`;
          // Layer 3 (Fastest - Closest)
          if (s3) s3.style.transform = `translate(${x * -80}px, ${y * -80}px)`;
          
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

const handleRoast = async () => {
    if (!session) return;
    setLoading(true);
    setRoastData([]);
    setScore(null);

    try {
      const headers = { Authorization: `Bearer ${(session as any).accessToken}` };
      let allItems: any[] = [];

      if (mode === 'user') {
        // --- MODE 1: ROAST CURRENT USER ---
        // FIX: Replaced "googleusercontent" with actual Spotify API URLs
        const [artistsRes, tracksRes] = await Promise.all([
          fetch("https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=5", { headers }),
          fetch("https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=5", { headers }),
        ]);

        if (!artistsRes.ok || !tracksRes.ok) {
            // Check for 401 (Unauthorized) which means token expired
            if (artistsRes.status === 401 || tracksRes.status === 401) {
                alert("Spotify Session Expired. Please sign out and sign in again.");
                return;
            }
            throw new Error("Failed to fetch Top Artists/Tracks");
        }

        const artistsData = await artistsRes.json();
        const tracksData = await tracksRes.json();

        const artistItems = artistsData.items.map((item: any) => ({
          name: item.name,
          image: item.images?.[0]?.url || "",
        }));
        const trackItems = tracksData.items.map((item: any) => ({
          name: item.name,
          image: item.album?.images?.[0]?.url || "",
        }));
        allItems = [...artistItems, ...trackItems];

      } else {
        // --- MODE 2: ROAST PLAYLIST ---
        // 1. Extract Playlist ID correctly
        const playlistIdMatch = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/);
        if (!playlistIdMatch) {
          alert("Invalid Spotify Playlist URL. It should look like: open.spotify.com/playlist/...");
          setLoading(false);
          return;
        }
        const playlistId = playlistIdMatch[1];

        // 2. FIX: Use the correct Spotify Playlist Endpoint
        const playlistRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=8`, { headers });
        
        if (!playlistRes.ok) throw new Error("Failed to fetch Playlist");
        
        const playlistData = await playlistRes.json();
        
        // 3. Map playlist items
        allItems = playlistData.items.map((item: any) => ({
          name: item.track.name + " by " + item.track.artists[0].name,
          image: item.track.album?.images?.[0]?.url || "",
        }));
      }

      // --- SEND TO AI ---
      const namesList = allItems.map(item => item.name).join(", ");
      
      const response = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: namesList }),
      });

      if (!response.ok) throw new Error("AI Request Failed");
      
      const data = await response.json();

      // FIX: Check if 'roasts' exists before mapping to prevent "data.roasts is undefined" error
      if (!data || !data.roasts) {
          throw new Error("AI returned invalid data format");
      }

      // --- MERGE DATA ---
      const finalRoast = data.roasts.map((roastItem: any) => {
        // Fuzzy match logic
        const original = allItems.find(item => item.name.includes(roastItem.name) || roastItem.name.includes(item.name));
        return { 
          name: roastItem.name, 
          roast: roastItem.roast, 
          image: original?.image || "" 
        };
      });

      setScore(data.score);
      setRoastData(finalRoast);

    } catch (error) {
      console.error(error);
      alert("System Failure: The AI refuses to perceive this level of bad taste. (Check Console for details)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col items-center p-8 relative overflow-hidden transition-colors duration-500`}>
      
{/* --- Global CSS: Scrollbar Hiding & Shimmer Animation --- */}
      <style jsx global>{`
        /* 1. Hide Scrollbar but keep functionality (Cross-Browser) */
        html, body {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }
        html::-webkit-scrollbar, body::-webkit-scrollbar {
          display: none; /* Chrome/Safari/Webkit */
          width: 0;
          height: 0;
        }

        /* 2. Parallax Stars */
        .star-layer { position: fixed; top: 0; left: 0; width: 100%; height: 200%; pointer-events: none; }
        #stars1 { background-image: radial-gradient(1px 1px at 10% 10%, white, transparent), radial-gradient(1px 1px at 30% 40%, white, transparent), radial-gradient(1px 1px at 60% 70%, white, transparent), radial-gradient(1px 1px at 80% 20%, white, transparent); background-size: 400px 400px; opacity: 0.3; }
        #stars2 { background-image: radial-gradient(2px 2px at 15% 15%, white, transparent), radial-gradient(2px 2px at 35% 45%, white, transparent), radial-gradient(2px 2px at 65% 75%, white, transparent), radial-gradient(2px 2px at 85% 25%, white, transparent); background-size: 550px 550px; opacity: 0.5; }
        #stars3 { background-image: radial-gradient(3px 3px at 20% 20%, white, transparent), radial-gradient(3px 3px at 40% 50%, white, transparent), radial-gradient(3px 3px at 70% 80%, white, transparent), radial-gradient(3px 3px at 90% 30%, white, transparent); background-size: 700px 700px; opacity: 0.7; }

        /* 3. Fluid Shimmer Animation */
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .animate-shimmer {
          background: #ffffff05; /* Base dark color */
          background-image: linear-gradient(
            to right, 
            rgba(255, 255, 255, 0) 0%, 
            rgba(255, 255, 255, 0.05) 20%, 
            rgba(255, 255, 255, 0.1) 40%, 
            rgba(255, 255, 255, 0) 100%
          );
          background-repeat: no-repeat;
          background-size: 1000px 100%; 
          animation: shimmer 2s infinite linear;
        }
      `}</style>
      
      <div id="stars1" className="star-layer"></div>
      <div id="stars2" className="star-layer"></div>
      <div id="stars3" className="star-layer"></div>

      {/* Theme Switcher */}
      <div className="absolute top-6 right-6 z-50">
        <button onClick={() => setShowThemes(!showThemes)} className={`p-3 rounded-full bg-white/10 backdrop-blur-md border ${theme.cardBorder} transition hover:scale-110`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.077-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.635m0 0a2.25 2.25 0 0 1 2.4-2.245 4.5 4.5 0 0 0-8.4 2.245c0 .399.077.78.22 1.128m0 0a15.998 15.998 0 0 0-3.388 1.62m5.043.025a15.994 15.994 0 0 1-1.622 3.395" />
          </svg>
        </button>
        {showThemes && (
          <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
            {Object.entries(themes).map(([key, t]) => (
              <button key={key} onClick={() => { setCurrentTheme(key as ThemeKey); setShowThemes(false); }} className={`w-full text-left px-4 py-3 hover:bg-white/10 transition flex items-center gap-2 ${currentTheme === key ? theme.accent : ""}`}>
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${t.primary}`}></div>
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative z-10 max-w-5xl w-full flex flex-col items-center">
        
        {/* Header */}
        <div className="text-center mt-10 mb-8">
          <h1 className={`text-7xl font-black mb-4 tracking-tighter bg-gradient-to-r ${theme.primary} text-transparent bg-clip-text drop-shadow-sm`}>
            ROAST MY SPOTIFY
          </h1>
          <p className={`${theme.text} opacity-80 text-xl`}>Dare to let an AI judge your horrible music taste?</p>
        </div>

        {/* --- MAIN INTERFACE --- */}
        {!session ? (
          <button onClick={() => signIn("spotify")} className={`group relative px-8 py-4 rounded-full font-bold text-lg transition hover:scale-105 ${theme.button} shadow-lg mt-8`}>
            <span className="relative z-10">Login with Spotify</span>
          </button>
        ) : (
          <div className="w-full max-w-2xl flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Mode Switcher */}
            <div className="flex bg-white/5 backdrop-blur-md rounded-full p-1 border border-white/10">
              <button 
                onClick={() => setMode('user')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'user' ? theme.button : 'text-gray-400 hover:text-white'}`}
              >
                My Taste
              </button>
              <button 
                onClick={() => setMode('playlist')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'playlist' ? theme.button : 'text-gray-400 hover:text-white'}`}
              >
                Roast a Playlist
              </button>
            </div>

            {/* Input Area (Only for Playlist Mode) */}
            {mode === 'playlist' && (
              <div className="w-full animate-in fade-in zoom-in duration-300">
                <input 
                  type="text" 
                  placeholder="Paste Spotify Playlist Link here..." 
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  className={`w-full bg-white/5 backdrop-blur-xl border ${theme.cardBorder} rounded-xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 ring-opacity-50 ${theme.accent.replace('text', 'ring')}`}
                />
              </div>
            )}
            
{/* Roast Button */}
            <button 
              onClick={handleRoast} 
              disabled={loading} 
              className={`w-full md:w-auto px-12 py-5 rounded-full font-bold text-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-xl ${theme.button} flex items-center justify-center gap-3`}
            >
              {loading ? (
                <>
                  <LoadingSpinner />
                  <span>Analyzing Cringe...</span>
                </>
              ) : (
                mode === 'user' ? "ROAST MY TASTE" : "ROAST THIS PLAYLIST"
              )}
            </button>

            {/* User Badge - NOW CLICKABLE FOR LOGOUT */}
            <button 
              onClick={() => signOut()}
              className={`flex items-center gap-3 bg-white/5 backdrop-blur-xl px-6 py-2 rounded-full border ${theme.cardBorder} shadow-sm hover:bg-red-500/20 hover:border-red-500 transition-all group`}
              title="Click to Logout"
            >
                {session.user?.image && <img src={session.user.image} className="w-6 h-6 rounded-full border border-white/20" alt="profile"/>}
                <div className="flex flex-col text-left">
                  <span className="text-sm font-medium opacity-80 group-hover:text-red-300">
                    Logged in as <span className={theme.accent}>{session.user?.name}</span>
                  </span>
                  <span className="text-[10px] text-red-400 opacity-0 h-0 group-hover:h-auto group-hover:opacity-100 transition-all">Click to Sign Out</span>
                </div>
            </button>

          </div>
        )}

{/* --- RESULTS GRID (Optimized Layout) --- */}
        {(roastData.length > 0 || loading) && (
          <div className="mt-24 w-full">
            
            {/* 1. SCORE SECTION: Handles both Loading and Loaded states to prevent jumping */}
            {loading ? (
              <ScoreSkeleton theme={theme} />
            ) : score ? (
              <div className="text-center mb-20 relative animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="inline-block relative">
                   <h2 className={`text-[10rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b ${theme.score} drop-shadow-2xl`}>
                    {score}
                  </h2>
                  <span className={`absolute top-4 -right-8 text-4xl font-bold ${theme.accent} rotate-12 opacity-80`}>/100</span>
                </div>
                <p className={`${theme.accent} uppercase tracking-[0.3em] mt-4 font-bold text-lg`}>Basic Score Detected</p>
              </div>
            ) : null}

            {/* 2. CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
              {loading 
                ? // Render 6 Fluid Skeletons
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-in fade-in duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                      <SkeletonCard theme={theme} />
                    </div>
                  ))
                : // Render Real Cards
                  roastData.map((item, index) => (
                     <div key={index} className="animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${index * 100}ms` }}>
                       <TiltCard item={item} theme={theme} />
                     </div>
                  ))
              }
            </div>
          </div>
        )}
      </div>
    </main>
  );
}