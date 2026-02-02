import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Film, Loader2, Star, TrendingUp, X, Globe, Flame, Sword, Heart, Laugh, Cpu, Skull, Zap, Compass, Users, Music, BookOpen, Bookmark, Share2, Moon, Sun, Clock, Calendar, Eye, Popcorn} from "lucide-react";

/* ─────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────── */
interface Movie {
  title: string;
  poster_path: string;
  overview: string;
  genres: string;
  tagline: string;
  original_language: string;
  vote_average: number;
  popularity: number;
  is_searched: boolean;
  release_year?: number;
  runtime?: number;
}

/* ─────────────────────────────────────────────
   CONFIG
   ───────────────────────────────────────────── */
const API_BASE = "https://movie-recommender-api-jtoc.onrender.com";

const SEED_MOVIES   = ["Inception", "Titanic", "The Dark Knight", "Interstellar", "Pulp Fiction", "The Godfather", "Parasite", "Spirited Away"];
const MARQUEE_SEEDS = ["Avatar", "The Matrix", "Gladiator", "Fight Club", "Parasite", "Joker", "Dune", "Everything Everywhere All at Once"];
const QUICK_CHIPS   = ["Inception", "Titanic", "The Dark Knight", "Interstellar", "Pulp Fiction", "The Godfather", "La La Land", "Spider-Man"];

/* Each category has: label, icon, and genre keywords to match AND a fallback seed movie to fetch if local filter returns 0 */
const CATEGORIES: { label: string; icon: React.ReactNode; keywords: string[]; seed: string }[] = [
  { label: "All",       icon: <Flame size={14}/>,    keywords: [],                                          seed: "" },
  { label: "Action",    icon: <Sword size={14}/>,    keywords: ["action"],                                  seed: "John Wick" },
  { label: "Drama",     icon: <BookOpen size={14}/>, keywords: ["drama"],                                   seed: "The Shawshank Redemption" },
  { label: "Romance",   icon: <Heart size={14}/>,    keywords: ["romance"],                                 seed: "The Notebook" },
  { label: "Comedy",    icon: <Laugh size={14}/>,    keywords: ["comedy"],                                  seed: "The Hangover" },
  { label: "Sci-Fi",    icon: <Cpu size={14}/>,      keywords: ["sci-fi","science fiction","scifi"],        seed: "Blade Runner 2049" },
  { label: "Horror",    icon: <Skull size={14}/>,    keywords: ["horror"],                                  seed: "The Conjuring" },
  { label: "Thriller",  icon: <Zap size={14}/>,      keywords: ["thriller"],                                seed: "Gone Girl" },
  { label: "Adventure", icon: <Compass size={14}/>,  keywords: ["adventure"],                               seed: "Indiana Jones" },
  { label: "Family",    icon: <Users size={14}/>,    keywords: ["family","animation"],                     seed: "The Lion King" },
  { label: "Musical",   icon: <Music size={14}/>,    keywords: ["music","musical"],                         seed: "La La Land" },
  { label: "Mystery",   icon: <BookOpen size={14}/>, keywords: ["mystery"],                                 seed: "Knives Out" },
];

/* ─────────────────────────────────────────────
   ENHANCED STYLES WITH LIGHT/DARK MODE
   ───────────────────────────────────────────── */
const LIGHT_THEME_CSS = `
  :root {
    --bg: #f8fafc;
    --card: #ffffff;
    --accent: #f59e0b;
    --accent2: #3b82f6;
    --accent-gradient: linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f97316 100%);
    --accent-gradient-soft: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    --t1: #1f2937;
    --t2: #6b7280;
    --t3: #9ca3af;
    --brd: #e5e7eb;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
    --info: #3b82f6;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
    --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  }
  
  body {
    background: var(--bg);
    color: var(--t1);
  }
  
  .search-bar {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid var(--brd);
  }
  
  .chip {
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid var(--brd);
    color: var(--t2);
  }
  
  .cat {
    border: 1px solid var(--brd);
    color: var(--t2);
  }
  
  .card {
    background: var(--card);
    border: 1px solid var(--brd);
  }
  
  .marquee-card {
    border: 1px solid var(--brd);
  }
  
  .modal {
    background: var(--card);
    border: 1px solid var(--brd);
  }
  
  .theme-toggle {
    background: var(--card);
    border: 1px solid var(--brd);
    color: var(--t2);
  }
`;

const DARK_THEME_CSS = `
  :root {
    --bg: #0a0e17;
    --card: #111827;
    --accent: #fbbf24;
    --accent2: #60a5fa;
    --accent-gradient: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #dc2626 100%);
    --accent-gradient-soft: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    --t1: #f3f4f6;
    --t2: #9ca3af;
    --t3: #4b5563;
    --brd: #1f2937;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
    --info: #3b82f6;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
    --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -1px rgba(0,0,0,0.3);
    --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -2px rgba(0,0,0,0.4);
  }
  
  body {
    background: var(--bg);
    color: var(--t1);
  }
  
  .search-bar {
    background: var(--card);
    border: 1px solid var(--brd);
  }
  
  .chip {
    background: var(--card);
    border: 1px solid var(--brd);
    color: var(--t2);
  }
  
  .cat {
    border: 1px solid var(--brd);
    color: var(--t2);
  }
  
  .card {
    background: var(--card);
    border: 1px solid var(--brd);
  }
  
  .marquee-card {
    border: 1px solid var(--brd);
  }
  
  .modal {
    background: var(--card);
    border: 1px solid var(--brd);
  }
  
  .theme-toggle {
    background: var(--card);
    border: 1px solid var(--brd);
    color: var(--t2);
  }
`;

const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600&display=swap');

  *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{
    background: var(--bg);
    background-image: 
      radial-gradient(at 40% 20%, rgba(96, 165, 250, 0.15) 0px, transparent 50%),
      radial-gradient(at 80% 0%, rgba(139, 92, 246, 0.1) 0px, transparent 50%),
      radial-gradient(at 0% 50%, rgba(251, 191, 36, 0.05) 0px, transparent 50%);
    color:var(--t1);
    font-family:'DM Sans',sans-serif;
    min-height:100vh;
    overflow-x:hidden;
    -webkit-font-smoothing:antialiased;
    transition: background-color 0.3s ease;
    touch-action: manipulation;
  }

  /* ── grain ── */
  body::after{
    content:'';
    position:fixed;
    inset:0;
    z-index:9999;
    pointer-events:none;
    opacity:.02;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  /* ═══ LAYOUT ═══ */
  .app{
    max-width:1400px;
    margin:0 auto;
    padding:0 16px 80px;
    position:relative;
    z-index:1;
  }

  /* ═══ HEADER ═══ */
  .header{
    text-align:center;
    padding:40px 0 20px;
    position:relative;
  }
  .header-glow{
    position:absolute;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%);
    width:min(100%,800px);
    height:400px;
    pointer-events:none;
    background: radial-gradient(ellipse at center, rgba(251, 191, 36, 0.15) 0%, transparent 70%);
    filter: blur(40px);
  }
  .logo{
    font-family:'Space Grotesk', sans-serif;
    font-weight:700;
    font-size:clamp(36px,8vw,64px);
    letter-spacing:-1px;
    color:var(--t1);
    position:relative;
    line-height:1;
    margin-bottom:8px;
    background: var(--accent-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 4px 30px rgba(251, 191, 36, 0.2);
  }
  .logo::after {
    content: "🎬";
    position: absolute;
    right: -40px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 32px;
    animation: logoPopcorn 3s infinite ease-in-out;
  }
  
  @keyframes logoPopcorn {
    0%, 100% { transform: translateY(-50%) rotate(0deg); }
    25% { transform: translateY(-50%) rotate(-10deg); }
    50% { transform: translateY(-50%) rotate(10deg); }
    75% { transform: translateY(-50%) rotate(-10deg); }
  }
  
  .tagline{
    color:var(--t2);
    font-size:12px;
    letter-spacing:2px;
    text-transform:uppercase;
    font-weight:300;
    position:relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 16px;
  }
  .tagline::after{
    content:'';
    position:absolute;
    bottom:-8px;
    left:50%;
    transform:translateX(-50%);
    width:80px;
    height:2px;
    background:var(--accent-gradient);
    border-radius:2px;
  }

  /* theme toggle */
  .theme-toggle{
    position:fixed;
    top:16px;
    right:16px;
    background:var(--card);
    border:1px solid var(--brd);
    border-radius:50%;
    width:44px;
    height:44px;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    color:var(--t2);
    transition:all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    z-index:100;
    backdrop-filter: blur(10px);
  }
  .theme-toggle:hover{
    background:var(--accent);
    color:var(--bg);
    transform:rotate(15deg) scale(1.1);
    box-shadow:0 8px 32px rgba(251, 191, 36, 0.3);
    border-color:var(--accent);
  }

  /* ═══ SEARCH ═══ */
  .search-wrap{
    max-width:100%;
    margin:32px auto 0;
    position:relative;
    padding: 0 8px;
  }
  .search-bar{
    display:flex;
    align-items:center;
    gap:8px;
    background:var(--card);
    border:1px solid var(--brd);
    border-radius:16px;
    padding:4px 4px 4px 16px;
    transition:all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    position:relative;
    overflow:hidden;
    backdrop-filter:blur(10px);
  }
  .search-bar::before{
    content:'';
    position:absolute;
    inset:0;
    background:linear-gradient(105deg, transparent 35%, rgba(251, 191, 36, 0.08) 50%, transparent 65%);
    background-size:250% 100%;
    animation:shimmer 4s ease infinite;
    pointer-events:none;
    z-index:0;
  }
  @keyframes shimmer{
    0%{background-position:250% 0}
    100%{background-position:-250% 0}
  }
  .search-bar:focus-within{
    border-color:var(--accent);
    box-shadow:0 0 32px rgba(251, 191, 36, 0.15),
               0 8px 24px rgba(0, 0, 0, 0.3);
    transform:translateY(-2px);
  }
  .search-bar input{
    flex:1;
    background:transparent;
    border:none;
    outline:none;
    color:var(--t1);
    font-size:16px;
    font-family:inherit;
    padding:14px 0;
    position:relative;
    z-index:1;
    min-width: 0;
  }
  .search-bar input::placeholder{
    color:var(--t3);
  }
  .search-btn{
    background:var(--accent-gradient);
    border:none;
    border-radius:14px;
    min-width:52px;
    height:52px;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    color:var(--bg);
    font-weight:600;
    flex-shrink:0;
    transition:all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    position:relative;
    z-index:1;
    overflow:hidden;
  }
  .search-btn::before{
    content:'';
    position:absolute;
    inset:0;
    background:linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%);
    opacity:0;
    transition:opacity 0.3s;
  }
  .search-btn:hover,
  .search-btn:active{
    transform:scale(1.08) rotate(5deg);
    box-shadow:0 8px 24px rgba(251, 191, 36, 0.4);
  }
  .search-btn:hover::before{
    opacity:1;
  }

  /* chips - FIXED FOR MOBILE */
  .chips{
    display:flex;
    flex-wrap:wrap;
    gap:8px;
    margin-top:16px;
    justify-content:center;
    padding:8px 0 12px;
  }
  .chip{
    background:var(--card);
    border:1px solid var(--brd);
    color:var(--t2);
    font-size:12px;
    padding:8px 16px;
    border-radius:20px;
    cursor:pointer;
    font-family:inherit;
    transition:all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    position:relative;
    overflow:hidden;
    white-space: nowrap;
    flex-shrink: 0;
    min-height: 36px;
    display: flex;
    align-items: center;
  }
  .chip::before{
    content:'';
    position:absolute;
    inset:0;
    background:var(--accent-gradient);
    opacity:0;
    transition:opacity 0.3s;
    z-index:-1;
  }
  .chip:hover,
  .chip:active{
    color:var(--bg);
    border-color:transparent;
    transform:translateY(-2px);
    box-shadow:0 8px 16px rgba(251, 191, 36, 0.2);
  }
  .chip:hover::before,
  .chip:active::before{
    opacity:1;
  }

  /* ═══ CATEGORIES - FIXED FOR MOBILE ── */
  .cats{
    display:flex;
    flex-wrap:wrap;
    gap:8px;
    justify-content:center;
    padding:16px 8px;
    margin:0 auto;
    max-width: 100%;
    overflow: visible;
  }
  .cat{
    display:flex;
    align-items:center;
    gap:6px;
    background:transparent;
    border:1px solid var(--brd);
    color:var(--t2);
    font-size:12px;
    padding:10px 16px;
    border-radius:20px;
    cursor:pointer;
    font-family:inherit;
    font-weight:500;
    transition:all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    position:relative;
    overflow:hidden;
    white-space: nowrap;
    flex-shrink: 0;
    min-height: 40px;
  }
  .cat svg{
    transition:all 0.25s;
    color:var(--t3);
    flex-shrink: 0;
  }
  .cat::before{
    content:'';
    position:absolute;
    inset:0;
    background:var(--accent-gradient);
    opacity:0;
    transition:opacity 0.3s;
    z-index:-1;
  }
  .cat:hover,
  .cat:active{
    border-color:var(--accent);
    color:var(--t1);
    transform:translateY(-2px);
    box-shadow:0 8px 16px rgba(251, 191, 36, 0.15);
  }
  .cat:hover svg,
  .cat:active svg{
    color:var(--t1);
  }
  .cat:hover::before,
  .cat:active::before{
    opacity:0.1;
  }
  .cat.active{
    background:var(--accent-gradient);
    border-color:transparent;
    color:var(--bg);
    font-weight:600;
    transform:translateY(-2px);
    box-shadow:0 8px 24px rgba(251, 191, 36, 0.3);
    animation:catPop 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .cat.active svg{
    color:var(--bg);
  }
  @keyframes catPop{
    0%{transform:translateY(0) scale(0.9); opacity:0.8}
    70%{transform:translateY(-6px) scale(1.05); opacity:1}
    100%{transform:translateY(-2px) scale(1); opacity:1}
  }

  /* ═══ STATUS ═══ */
  .status{
    display:flex;
    align-items:center;
    justify-content:space-between;
    margin:16px 0 24px;
    min-height:24px;
    padding:0 8px;
    gap: 12px;
  }
  .status-left{
    font-size:12px;
    color:var(--t3);
    letter-spacing:0.5px;
    text-transform:uppercase;
    display:flex;
    align-items:center;
    gap:8px;
    flex-wrap: wrap;
  }
  .status-left .dot{
    width:8px;
    height:8px;
    border-radius:50%;
    background:var(--accent-gradient);
    position:relative;
    flex-shrink: 0;
  }
  .status-left .dot::after{
    content:'';
    position:absolute;
    inset:-3px;
    border-radius:50%;
    background:var(--accent);
    opacity:0.3;
    animation:pulse 2s ease infinite;
  }
  @keyframes pulse{
    0%,100%{transform:scale(1); opacity:0.3}
    50%{transform:scale(1.5); opacity:0.1}
  }
  .status-left strong{
    color:var(--accent);
    font-weight:600;
    text-transform:none;
    letter-spacing:0;
    font-size:13px;
  }
  .status-right{
    font-size:12px;
    color:var(--t2);
    display:flex;
    align-items:center;
    gap:8px;
    flex-shrink: 0;
  }
  .view-toggle{
    background:var(--card);
    border:1px solid var(--brd);
    border-radius:8px;
    padding:6px 12px;
    font-size:11px;
    color:var(--t2);
    cursor:pointer;
    transition:all 0.2s;
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }
  .view-toggle:hover,
  .view-toggle:active{
    border-color:var(--accent);
    color:var(--accent);
  }

  /* ═══ MARQUEE ═══ */
  .marquee-wrap{
    width:100%;
    overflow:hidden;
    margin:0 0 24px;
    position:relative;
    padding:12px 0;
    border-top:1px solid rgba(251, 191, 36, 0.1);
    border-bottom:1px solid rgba(251, 191, 36, 0.1);
    background:linear-gradient(90deg, rgba(251, 191, 36, 0.02) 0%, transparent 50%, rgba(251, 191, 36, 0.02) 100%);
  }
  .marquee-wrap::before,
  .marquee-wrap::after{
    content:'';
    position:absolute;
    top:0;
    bottom:0;
    width:40px;
    z-index:2;
    pointer-events:none;
  }
  .marquee-wrap::before{
    left:0;
    background:linear-gradient(to right,var(--bg),transparent)
  }
  .marquee-wrap::after{
    right:0;
    background:linear-gradient(to left,var(--bg),transparent)
  }
  .marquee-track{
    display:flex;
    gap:16px;
    animation:marquee 40s linear infinite;
    width:max-content;
  }
  .marquee-track:hover{
    animation-play-state:paused;
  }
  @keyframes marquee{
    from{transform:translateX(0)}
    to{transform:translateX(-50%)}
  }
  .marquee-card{
    flex-shrink:0;
    width:120px;
    height:180px;
    border-radius:12px;
    overflow:hidden;
    position:relative;
    cursor:pointer;
    border:1px solid var(--brd);
    transition:all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .marquee-card::before{
    content:'';
    position:absolute;
    inset:-2px;
    background:var(--accent-gradient);
    border-radius:14px;
    z-index:-1;
    opacity:0;
    transition:opacity 0.4s;
  }
  .marquee-card:hover,
  .marquee-card:active{
    transform:translateY(-6px) scale(1.05);
    box-shadow:0 12px 32px rgba(251, 191, 36, 0.2),
               0 6px 24px rgba(0,0,0,0.4);
    border-color:transparent;
  }
  .marquee-card:hover::before,
  .marquee-card:active::before{
    opacity:1;
  }
  .marquee-card img{
    width:100%;
    height:100%;
    object-fit:cover;
    transition:transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .marquee-card:hover img,
  .marquee-card:active img{
    transform:scale(1.12);
  }
  .marquee-card .mc-overlay{
    position:absolute;
    inset:0;
    background:linear-gradient(to top,rgba(0,0,0,0.9) 0%,transparent 50%);
    opacity:0.8;
    transition:opacity 0.4s;
  }
  .marquee-card:hover .mc-overlay,
  .marquee-card:active .mc-overlay{
    opacity:0.6;
  }
  .marquee-card .mc-title{
    position:absolute;
    bottom:0;
    left:0;
    right:0;
    padding:10px 8px;
    font-family:'Space Grotesk', sans-serif;
    font-weight:600;
    font-size:11px;
    color:var(--t1);
    line-height:1.3;
    background:linear-gradient(to top, rgba(0,0,0,0.8), transparent);
    transform:translateY(5px);
    opacity:0;
    transition:all 0.3s;
  }
  .marquee-card:hover .mc-title,
  .marquee-card:active .mc-title{
    transform:translateY(0);
    opacity:1;
  }

  /* ═══ GRID - 4x4 DESKTOP, 2x2 MOBILE ── */
  .grid{
    display:grid;
    grid-template-columns:repeat(2, 1fr);
    gap:16px;
    padding: 0 4px;
  }

  /* ═══ CARD ═══ */
  .card{
    position:relative;
    border-radius:12px;
    overflow:hidden;
    aspect-ratio:2/3;
    cursor:pointer;
    background:var(--card);
    border:1px solid var(--brd);
    opacity:0;
    transform:translateY(20px) scale(0.95);
    animation:cardIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    transition:all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .card::before{
    content:'';
    position:absolute;
    inset:-2px;
    background:var(--accent-gradient);
    border-radius:14px;
    z-index:-1;
    opacity:0;
    transition:opacity 0.4s;
  }
  .card:hover,
  .card:active{
    box-shadow:0 16px 48px rgba(251, 191, 36, 0.2),
               0 8px 32px rgba(0,0,0,0.5);
    transform:translateY(-6px);
    border-color:transparent;
  }
  .card:hover::before,
  .card:active::before{
    opacity:1;
  }
  .card:hover .card-ov,
  .card:active .card-ov{
    background:linear-gradient(to top,rgba(0,0,0,0.95) 0%,rgba(0,0,0,0.6) 50%,rgba(0,0,0,0.1) 80%);
  }

  /* card entrance animation */
  .card:nth-child(1){animation-delay:.05s}.card:nth-child(2){animation-delay:.1s}
  .card:nth-child(3){animation-delay:.15s}.card:nth-child(4){animation-delay:.2s}
  .card:nth-child(5){animation-delay:.25s}.card:nth-child(6){animation-delay:.3s}
  .card:nth-child(7){animation-delay:.35s}.card:nth-child(8){animation-delay:.4s}
  .card:nth-child(9){animation-delay:.45s}.card:nth-child(10){animation-delay:.5s}
  .card:nth-child(11){animation-delay:.55s}.card:nth-child(12){animation-delay:.6s}
  .card:nth-child(13){animation-delay:.65s}.card:nth-child(14){animation-delay:.7s}
  .card:nth-child(15){animation-delay:.75s}.card:nth-child(16){animation-delay:.8s}
  @keyframes cardIn{
    from{opacity:0; transform:translateY(20px) scale(0.95)}
    to{opacity:1; transform:translateY(0) scale(1)}
  }

  /* card image */
  .card img{
    position:absolute;
    inset:0;
    width:100%;
    height:100%;
    object-fit:cover;
    transition:transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .card:hover img,
  .card:active img{
    transform:scale(1.15);
  }
  .card-fb{
    position:absolute;
    inset:0;
    display:flex;
    align-items:center;
    justify-content:center;
    background:linear-gradient(145deg,#1a1a22,#111118);
    color:var(--t3);
  }
  .card-ov{
    position:absolute;
    inset:0;
    background:linear-gradient(to top,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.3) 40%,transparent 70%);
    transition:background 0.5s;
  }

  /* badge */
  .badge{
    position:absolute;
    top:10px;
    left:10px;
    z-index:2;
    background:var(--accent-gradient);
    color:var(--bg);
    font-size:10px;
    font-weight:700;
    letter-spacing:1px;
    text-transform:uppercase;
    padding:5px 10px;
    border-radius:16px;
    box-shadow:0 4px 12px rgba(0,0,0,0.3);
    animation:badgeFloat 3s ease-in-out infinite;
  }
  @keyframes badgeFloat{
    0%,100%{transform:translateY(0)}
    50%{transform:translateY(-3px)}
  }

  /* card info */
  .card-info{
    position:absolute;
    bottom:0;
    left:0;
    right:0;
    padding:16px 12px 12px;
    transition:all 0.3s;
    z-index:1;
    background:linear-gradient(to top, rgba(0,0,0,0.9), transparent);
  }
  .card:hover .card-info,
  .card:active .card-info{
    opacity:0;
    transform:translateY(8px);
  }
  .card-title{
    font-family:'Space Grotesk', sans-serif;
    font-weight:600;
    font-size:14px;
    line-height:1.3;
    color:var(--t1);
    margin-bottom:6px;
    letter-spacing:-0.1px;
  }
  .card-meta{
    display:flex;
    align-items:center;
    gap:10px;
    font-size:11px;
    color:var(--t2);
    flex-wrap:wrap;
  }
  .card-rating{
    display:flex;
    align-items:center;
    gap:3px;
    color:var(--accent);
    font-weight:600;
    font-size:11px;
  }
  .card-genres{
    color:var(--t3);
    font-size:10px;
  }

  /* card details on hover */
  .card-det{
    position:absolute;
    inset:0;
    padding:16px;
    display:flex;
    flex-direction:column;
    justify-content:flex-end;
    opacity:0;
    transform:translateY(15px);
    transition:all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    pointer-events:none;
    z-index:1;
    background:linear-gradient(to top, rgba(0,0,0,0.95), transparent 30%);
  }
  .card:hover .card-det,
  .card:active .card-det{
    opacity:1;
    transform:translateY(0);
  }
  .det-overview{
    font-size:11px;
    color:var(--t2);
    line-height:1.5;
    margin-top:10px;
    display:-webkit-box;
    -webkit-line-clamp:4;
    -webkit-box-orient:vertical;
    overflow:hidden;
  }
  .det-pop{
    font-size:10px;
    color:var(--t3);
    margin-top:10px;
    display:flex;
    align-items:center;
    gap:5px;
  }

  /* action buttons */
  .card-actions{
    position:absolute;
    top:10px;
    right:10px;
    z-index:2;
    display:flex;
    gap:6px;
    opacity:0;
    transform:translateY(-8px);
    transition:all 0.3s;
  }
  .card:hover .card-actions,
  .card:active .card-actions{
    opacity:1;
    transform:translateY(0);
  }
  .card-btn{
    width:32px;
    height:32px;
    border-radius:50%;
    background:rgba(0,0,0,0.6);
    backdrop-filter:blur(10px);
    border:1px solid rgba(255,255,255,0.1);
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    color:var(--t1);
    transition:all 0.2s;
  }
  .card-btn:hover,
  .card-btn:active{
    background:var(--accent);
    color:var(--bg);
    transform:scale(1.1);
    border-color:var(--accent);
  }

  /* ═══ MODAL ═══ */
  .modal-backdrop{
    position:fixed;
    inset:0;
    z-index:1000;
    background:rgba(10, 14, 23, 0.95);
    backdrop-filter:blur(20px);
    -webkit-backdrop-filter:blur(20px);
    display:flex;
    align-items:center;
    justify-content:center;
    padding:16px;
    opacity:0;
    animation:mBdIn 0.3s ease forwards;
  }
  @keyframes mBdIn{
    to{opacity:1}
  }

  .modal{
    background:var(--card);
    border:1px solid var(--brd);
    border-radius:20px;
    max-width:100%;
    width:100%;
    max-height:90vh;
    overflow-y:auto;
    position:relative;
    display:flex;
    flex-direction:column;
    opacity:0;
    transform:translateY(30px) scale(0.95);
    animation:modalIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards;
    scrollbar-width:thin;
    scrollbar-color:var(--accent) transparent;
    box-shadow:0 24px 64px rgba(0,0,0,0.6);
  }
  .modal::-webkit-scrollbar{width:6px}
  .modal::-webkit-scrollbar-track{background:transparent}
  .modal::-webkit-scrollbar-thumb{background:var(--accent-gradient); border-radius:3px}
  @keyframes modalIn{
    to{opacity:1; transform:translateY(0) scale(1)}
  }

  /* close button */
  .modal-close{
    position:absolute;
    top:16px;
    right:16px;
    z-index:10;
    background:rgba(0,0,0,0.6);
    border:1px solid var(--brd);
    border-radius:50%;
    width:40px;
    height:40px;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    color:var(--t2);
    transition:all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    backdrop-filter:blur(10px);
  }
  .modal-close:hover,
  .modal-close:active{
    background:var(--accent);
    border-color:var(--accent);
    color:var(--bg);
    transform:scale(1.2) rotate(90deg);
    box-shadow:0 8px 24px rgba(251, 191, 36, 0.3);
  }

  /* ── Poster section ── */
  .modal-poster-col{
    position:relative;
    border-radius:20px 20px 0 0;
    overflow:hidden;
    height:300px;
    background:#0a0e17;
  }
  .modal-poster-col::before{
    content:'';
    position:absolute;
    inset:0;
    background:var(--accent-gradient);
    opacity:0.1;
    z-index:1;
  }
  .modal-poster-col img{
    width:100%;
    height:100%;
    object-fit:cover;
    position:absolute;
    inset:0;
    transition:transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .modal-poster-col:hover img{
    transform:scale(1.08);
  }
  .modal-poster-col .poster-overlay{
    position:absolute;
    inset:0;
    background:linear-gradient(to top,rgba(10, 14, 23, 0.95) 0%,rgba(10, 14, 23, 0.3) 50%,transparent 100%);
    z-index:1;
  }
  /* star rating badge floating on poster */
  .poster-rating{
    position:absolute;
    bottom:20px;
    left:20px;
    z-index:2;
    background:rgba(0,0,0,0.6);
    backdrop-filter:blur(10px);
    border:1px solid rgba(251, 191, 36, 0.3);
    border-radius:14px;
    padding:10px 16px;
    display:flex;
    align-items:center;
    gap:8px;
    opacity:0;
    transform:translateY(15px);
    animation:heroTextIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.4s forwards;
  }
  .poster-rating .pr-num{
    color:var(--accent);
    font-weight:700;
    font-size:20px;
    line-height:1;
  }
  .poster-rating .pr-max{
    color:var(--t3);
    font-size:11px;
  }
  .poster-rating .pr-label{
    color:var(--t2);
    font-size:10px;
    text-transform:uppercase;
    letter-spacing:1px;
    margin-top:3px;
  }

  /* ── Details section ── */
  .modal-details{
    padding:24px 20px 28px;
    display:flex;
    flex-direction:column;
  }

  .modal-title{
    font-family:'Space Grotesk', sans-serif;
    font-weight:700;
    font-size:clamp(20px,5vw,28px);
    color:var(--t1);
    line-height:1.2;
    opacity:0;
    transform:translateY(15px);
    animation:heroTextIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards;
  }
  .modal-tagline{
    color:var(--accent);
    font-size:13px;
    font-style:italic;
    margin-top:6px;
    opacity:0;
    transform:translateY(12px);
    animation:heroTextIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
  }
  @keyframes heroTextIn{
    to{opacity:1; transform:translateY(0)}
  }

  /* meta row */
  .modal-meta-row{
    display:flex;
    align-items:center;
    gap:12px;
    flex-wrap:wrap;
    margin-top:20px;
    opacity:0;
    transform:translateY(12px);
    animation:heroTextIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.4s forwards;
  }
  .modal-meta-badge{
    display:flex;
    align-items:center;
    gap:6px;
    font-size:11px;
    color:var(--t2);
    background:var(--bg);
    border:1px solid var(--brd);
    border-radius:10px;
    padding:6px 12px;
    transition:all 0.2s;
    white-space: nowrap;
  }
  .modal-meta-badge:hover,
  .modal-meta-badge:active{
    border-color:var(--accent);
    transform:translateY(-2px);
  }
  .modal-meta-badge svg{
    color:var(--accent)
  }
  .modal-meta-badge.pop svg{
    color:var(--warning)
  }

  /* genre pills */
  .modal-genres{
    display:flex;
    flex-wrap:wrap;
    gap:8px;
    margin-top:20px;
  }
  .modal-genre-pill{
    background:var(--bg);
    border:1px solid var(--brd);
    color:var(--t2);
    font-size:11px;
    padding:5px 12px;
    border-radius:16px;
    font-weight:500;
    opacity:0;
    transform:translateY(8px) scale(0.9);
    animation:pillIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    transition:all 0.2s;
  }
  .modal-genre-pill:hover,
  .modal-genre-pill:active{
    background:var(--accent);
    color:var(--bg);
    border-color:var(--accent);
    transform:translateY(-2px);
  }
  @keyframes pillIn{
    to{opacity:1; transform:translateY(0) scale(1)}
  }

  /* overview */
  .modal-overview-label{
    font-size:10px;
    color:var(--t3);
    letter-spacing:1.5px;
    text-transform:uppercase;
    margin-top:24px;
    margin-bottom:8px;
    opacity:0;
    transform:translateY(8px);
    animation:heroTextIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.6s forwards;
  }
  .modal-overview{
    font-size:13.5px;
    color:var(--t2);
    line-height:1.6;
    opacity:0;
    transform:translateY(8px);
    animation:heroTextIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.7s forwards;
  }

  /* modal actions */
  .modal-actions{
    display:flex;
    gap:12px;
    margin-top:28px;
    opacity:0;
    transform:translateY(8px);
    animation:heroTextIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.8s forwards;
  }
  .modal-action-btn{
    display:flex;
    align-items:center;
    gap:8px;
    padding:12px 20px;
    border-radius:12px;
    font-size:13px;
    font-weight:500;
    cursor:pointer;
    transition:all 0.3s;
    flex: 1;
    justify-content: center;
  }
  .modal-action-btn.primary{
    background:var(--accent-gradient);
    color:var(--bg);
    border:none;
  }
  .modal-action-btn.primary:hover,
  .modal-action-btn.primary:active{
    transform:translateY(-3px);
    box-shadow:0 8px 24px rgba(251, 191, 36, 0.4);
  }
  .modal-action-btn.secondary{
    background:transparent;
    border:1px solid var(--brd);
    color:var(--t2);
  }
  .modal-action-btn.secondary:hover,
  .modal-action-btn.secondary:active{
    border-color:var(--accent);
    color:var(--accent);
    transform:translateY(-3px);
  }

  /* ═══ LOADING / EMPTY ═══ */
  .center{
    text-align:center;
    padding:80px 16px;
  }
  .center .ico{
    display:inline-block;
    margin-bottom:16px;
  }
  .center p{
    font-size:14px;
    color:var(--t2);
    margin-top:8px;
    padding: 0 16px;
  }
  @keyframes spin{
    to{transform:rotate(360deg)}
  }
  .spin{
    animation:spin 0.8s linear infinite;
  }

  /* skeleton loading */
  .skeleton{
    background:linear-gradient(90deg, var(--card) 25%, var(--bg) 50%, var(--card) 75%);
    background-size:200% 100%;
    animation:loading 1.5s infinite;
    border-radius:12px;
  }
  @keyframes loading{
    0%{background-position:200% 0}
    100%{background-position:-200% 0}
  }

  /* ═══ WATCHLIST BADGE ═══ */
  .watchlist-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--accent-gradient);
    color: var(--bg);
    font-size: 11px;
    padding: 6px 12px;
    border-radius: 16px;
    font-weight: 600;
    margin-left: 8px;
    cursor: pointer;
    transition: all 0.3s;
    white-space: nowrap;
  }
  
  .watchlist-badge:hover,
  .watchlist-badge:active {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(251, 191, 36, 0.3);
  }

  /* ═══ FOOTER SPACING FOR MOBILE ═══ */
  .footer-spacing {
    height: 40px;
  }

  /* ═══ RESPONSIVE MEDIA QUERIES ═══ */
  @media (min-width: 640px) {
    .app {
      padding: 0 20px 80px;
    }
    .grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .marquee-card {
      width: 140px;
      height: 200px;
    }
    .modal {
      max-width: 600px;
    }
  }

  @media (min-width: 768px) {
    .app {
      padding: 0 24px 100px;
    }
    .header {
      padding: 60px 0 20px;
    }
    .search-wrap {
      max-width: 620px;
    }
    .grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
    }
    .modal {
      max-width: 800px;
      flex-direction: row;
      max-height: 85vh;
    }
    .modal-poster-col {
      height: auto;
      border-radius: 20px 0 0 20px;
      flex: 0 0 300px;
    }
    .modal-details {
      flex: 1;
      padding: 40px 32px;
    }
  }

  @media (min-width: 1024px) {
    .grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
    }
    .logo::after {
      display: block;
    }
  }

  /* Small screen adjustments */
  @media (max-width: 380px) {
    .logo {
      font-size: 32px;
    }
    .logo::after {
      display: none;
    }
    .chip {
      padding: 6px 12px;
      font-size: 11px;
    }
    .cat {
      padding: 8px 12px;
      font-size: 11px;
    }
    .grid {
      grid-template-columns: 1fr;
    }
    .modal-actions {
      flex-direction: column;
    }
  }

  /* Prevent text selection on interactive elements */
  button, .card, .chip, .cat {
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  /* Better touch feedback */
  @media (hover: none) and (pointer: coarse) {
    .card:hover,
    .card-actions,
    .card-det {
      opacity: 1 !important;
      transform: none !important;
    }
    
    .card:hover .card-info {
      opacity: 0 !important;
    }
    
    .card-actions {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

/* ─────────────────────────────────────────────
   MOVIE SEARCH HELPER - FUZZY SEARCH
   ───────────────────────────────────────────── */
const SIMILAR_MOVIES: Record<string, string> = {
  // Inception related
  "incept": "Inception",
  "incpt": "Inception",
  "inceptio": "Inception",
  "cobb": "Inception",
  
  // Titanic related
  "titan": "Titanic",
  "titani": "Titanic",
  "titanic ship": "Titanic",
  
  // Dark Knight related
  "dark": "The Dark Knight",
  "batman": "The Dark Knight",
  "bat": "The Dark Knight",
  "joker": "The Dark Knight",
  
  // Interstellar related
  "inter": "Interstellar",
  "interstel": "Interstellar",
  "space movie": "Interstellar",
  
  // Pulp Fiction
  "pulp": "Pulp Fiction",
  "pulp fic": "Pulp Fiction",
  
  // Godfather
  "god": "The Godfather",
  "godfath": "The Godfather",
  "mafia": "The Godfather",
  
  // Avatar
  "avat": "Avatar",
  "blue people": "Avatar",
  
  // Matrix
  "matri": "The Matrix",
  "neo": "The Matrix",
  
  // Gladiator
  "gladi": "Gladiator",
  "maximus": "Gladiator",
  
  // Fight Club
  "fight": "Fight Club",
  "tyler": "Fight Club",
  
  // Parasite
  "parasi": "Parasite",
  "korean": "Parasite",
  
  // Joker
  "joaquin": "Joker",
  "arthur": "Joker",
  
  // Dune
  "dun": "Dune",
  "spice": "Dune",
  
  // La La Land
  "lala": "La La Land",
  "la land": "La La Land",
  
  // Spider-Man
  "spider": "Spider-Man",
  "spidey": "Spider-Man",
  "peter parker": "Spider-Man",
  
  // Shawshank
  "shawshank": "The Shawshank Redemption",
  "andy dufresne": "The Shawshank Redemption",
  
  // John Wick
  "john w": "John Wick",
  "wick": "John Wick",
  
  // Notebook
  "noteb": "The Notebook",
  "allie": "The Notebook",
  
  // Hangover
  "hang": "The Hangover",
  "wolf pack": "The Hangover",
  
  // Blade Runner
  "blade": "Blade Runner 2049",
  "runner": "Blade Runner 2049",
  
  // Conjuring
  "conjur": "The Conjuring",
  "horror movie": "The Conjuring",
  
  // Gone Girl
  "gone": "Gone Girl",
  "amy": "Gone Girl",
  
  // Indiana Jones
  "indiana": "Indiana Jones",
  "indiana j": "Indiana Jones",
  
  // Lion King
  "lion": "The Lion King",
  "simba": "The Lion King",
  
  // Knives Out
  "knives": "Knives Out",
  "detective": "Knives Out",
};

function findSimilarMovie(query: string): string | null {
  const lowerQuery = query.toLowerCase().trim();
  
  // Exact match first
  for (const [partial, full] of Object.entries(SIMILAR_MOVIES)) {
    if (lowerQuery === partial.toLowerCase()) {
      return full;
    }
  }
  
  // Contains match
  for (const [partial, full] of Object.entries(SIMILAR_MOVIES)) {
    if (lowerQuery.includes(partial.toLowerCase()) || 
        partial.toLowerCase().includes(lowerQuery)) {
      return full;
    }
  }
  
  // Try to find in QUICK_CHIPS
  for (const movie of QUICK_CHIPS) {
    if (movie.toLowerCase().includes(lowerQuery) || 
        lowerQuery.includes(movie.toLowerCase())) {
      return movie;
    }
  }
  
  // Try to find in SEED_MOVIES
  for (const movie of SEED_MOVIES) {
    if (movie.toLowerCase().includes(lowerQuery) || 
        lowerQuery.includes(movie.toLowerCase())) {
      return movie;
    }
  }
  
  return null;
}

/* ─────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────── */
export default function App() {
  const [query, setQuery]                   = useState("");
  const [movies, setMovies]                 = useState<Movie[]>([]);
  const [loading, setLoading]               = useState(true);
  const [activeCat, setActiveCat]           = useState(0);
  const [searchedTitle, setSearchedTitle]   = useState("Popular");
  const [selected, setSelected]             = useState<Movie | null>(null);
  const [marqueeMovies, setMarqueeMovies]   = useState<Movie[]>([]);
  const [catLoading, setCatLoading]         = useState(false);
  const [theme, setTheme]                   = useState<'dark' | 'light'>('dark');
  const [watchlist, setWatchlist]           = useState<Set<string>>(new Set());
  const [showWatchlist, setShowWatchlist]   = useState(false);
  const inputRef                            = useRef<HTMLInputElement>(null);

  // Apply theme
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = theme === 'dark' ? DARK_THEME_CSS : LIGHT_THEME_CSS;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, [theme]);

  /* ── fetch helper ── */
  const fetchOne = async (title: string): Promise<Movie[]> => {
    const res  = await fetch(`${API_BASE}/recommend/${encodeURIComponent(title)}`);
    if (!res.ok) throw new Error("not found");
    const data = await res.json();
    return data.recommendations || [];
  };

  /* ── LANDING ── */
  const loadLanding = useCallback(async () => {
    setLoading(true);
    setSearchedTitle("Popular");
    setShowWatchlist(false);
    try {
      const results = await Promise.allSettled(SEED_MOVIES.map((t) => fetchOne(t)));
      const seen    = new Set<string>();
      const deduped: Movie[] = [];
      for (const r of results) {
        if (r.status !== "fulfilled") continue;
        for (const m of r.value) {
          const key = m.title.toLowerCase();
          if (!seen.has(key)) { 
            seen.add(key); 
            deduped.push({ 
              ...m, 
              is_searched: false,
              release_year: Math.floor(Math.random() * 50) + 1970,
              runtime: Math.floor(Math.random() * 120) + 90
            }); 
          }
        }
      }
      // Limit to 16 movies for 4x4 grid
      setMovies(deduped.slice(0, 16));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  /* ── MARQUEE ── */
  const loadMarquee = useCallback(async () => {
    try {
      const results = await Promise.allSettled(MARQUEE_SEEDS.map((t) => fetchOne(t)));
      const seen    = new Set<string>();
      const all: Movie[] = [];
      for (const r of results) {
        if (r.status !== "fulfilled") continue;
        for (const m of r.value) {
          const key = m.title.toLowerCase();
          if (!seen.has(key) && m.poster_path) { 
            seen.add(key); 
            all.push({...m, release_year: Math.floor(Math.random() * 50) + 1970}); 
          }
        }
      }
      setMarqueeMovies([...all, ...all]);
    } catch (e) { console.error(e); }
  }, []);

  /* ── SEARCH with fuzzy matching ── */
  const searchMovie = useCallback(async (searchQuery: string) => {
    const t = searchQuery.trim();
    if (!t) return;
    
    setLoading(true);
    setActiveCat(0);
    setShowWatchlist(false);
    
    // Try to find similar movie
    const similarMovie = findSimilarMovie(t);
    const searchTerm = similarMovie || t;
    
    setSearchedTitle(searchTerm);
    try {
      const recs = await fetchOne(searchTerm);
      // Mark the searched movie
      const markedRecs = recs.map(movie => ({
        ...movie,
        is_searched: movie.title.toLowerCase() === searchTerm.toLowerCase()
      }));
      setMovies(markedRecs.slice(0, 16));
      
      // Show a message if we used fuzzy matching
      if (similarMovie && similarMovie.toLowerCase() !== t.toLowerCase()) {
        console.log(`Showing results for "${similarMovie}" (similar to "${t}")`);
      }
    } catch {
      alert("Movie not found. Try another title!");
      setMovies([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadLanding(); loadMarquee(); }, [loadLanding, loadMarquee]);

  /* ── GENRE FILTER ── */
  const handleCategoryChange = useCallback(async (idx: number) => {
    setActiveCat(idx);
    setShowWatchlist(false);
    const cat = CATEGORIES[idx];
    
    if (idx === 0) {
      await loadLanding();
      return;
    }

    const hasMatch = movies.some((m) => {
      if (!m.genres) return false;
      const movieGenreWords = m.genres.toLowerCase().split(/\s+/);
      return cat.keywords.some((kw) => movieGenreWords.includes(kw));
    });

    if (!hasMatch && cat.seed) {
      setCatLoading(true);
      try {
        const recs = await fetchOne(cat.seed);
        setMovies(recs.slice(0, 16));
        setSearchedTitle(cat.label);
      } catch { /* ignore */ }
      finally { setCatLoading(false); }
    } else {
      setSearchedTitle(cat.label);
    }
  }, [movies, loadLanding]);

  /* ── Watchlist toggle ── */
  const toggleWatchlist = useCallback((movie: Movie) => {
    setWatchlist(prev => {
      const newSet = new Set(prev);
      if (newSet.has(movie.title)) {
        newSet.delete(movie.title);
      } else {
        newSet.add(movie.title);
      }
      return newSet;
    });
  }, []);

  /* ── Share movie ── */
  const shareMovie = useCallback((movie: Movie) => {
    if (navigator.share) {
      navigator.share({
        title: `Check out ${movie.title} on CineRecSys`,
        text: `I found "${movie.title}" on CineRecSys - ${movie.overview?.substring(0, 100)}...`,
        url: window.location.href,
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(`${movie.title} - ${window.location.href}`);
        alert('Link copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(`${movie.title} - ${window.location.href}`);
      alert('Link copied to clipboard!');
    }
  }, []);

  /* ── compute filtered list ── */
  const filtered = (() => {
    if (showWatchlist) {
      return movies.filter(movie => watchlist.has(movie.title)).slice(0, 16);
    }
    if (activeCat === 0) return movies;
    const cat = CATEGORIES[activeCat];
    return movies.filter((m) => {
      if (!m.genres) return false;
      const movieGenreWords = m.genres.toLowerCase().split(/\s+/);
      return cat.keywords.some((kw) => movieGenreWords.includes(kw));
    }).slice(0, 16);
  })();

  const handleSearch = () => { 
    const t = query.trim(); 
    if (t) {
      searchMovie(t);
      inputRef.current?.blur();
    }
  };

  /* ── Escape to close modal ── */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    if (selected) window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [selected]);

  /* ─── RENDER ─── */
  return (
    <>
      <style>{BASE_CSS}</style>

      <div className="app">

        {/* Theme toggle */}
        <button 
          className="theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* ── HEADER ── */}
        <header className="header">
          <div className="header-glow" />
          <h1 className="logo">CineRecSys</h1>
          <p className="tagline">
            <Popcorn size={16} />
            Discover cinematic masterpieces
            <Film size={16} />
          </p>
        </header>

        {/* ── SEARCH ── */}
        <div className="search-wrap">
          <div className="search-bar">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for a movie..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button className="search-btn" onClick={handleSearch}>
              {(loading || catLoading) ? <Loader2 size={22} className="spin" /> : <Search size={22} />}
            </button>
          </div>
          <div className="chips">
            {QUICK_CHIPS.map((c) => (
              <button key={c} className="chip" onClick={() => { setQuery(c); searchMovie(c); }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ── CATEGORIES ── */}
        <div className="cats">
          {CATEGORIES.map((cat, idx) => (
            <button 
              key={cat.label} 
              className={`cat${activeCat === idx ? " active" : ""}`} 
              onClick={() => handleCategoryChange(idx)}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* ── STATUS ── */}
        <div className="status">
          <span className="status-left">
            <span className="dot" />
            Recommendations for&nbsp;<strong>{searchedTitle}</strong>
            {watchlist.size > 0 && (
              <button 
                className="watchlist-badge"
                onClick={() => {
                  setShowWatchlist(!showWatchlist);
                  setSearchedTitle(showWatchlist ? "Popular" : "Your Watchlist");
                }}
              >
                <Bookmark size={12} />
                {showWatchlist ? 'Show All' : `Watchlist (${watchlist.size})`}
              </button>
            )}
          </span>
          <span className="status-right">
            {filtered.length} {filtered.length === 1 ? 'film' : 'films'}
            <button className="view-toggle" onClick={() => {}}>
              <Eye size={12} style={{ marginRight: 4 }} /> Grid
            </button>
          </span>
        </div>

        {/* ── MARQUEE ── */}
        {marqueeMovies.length > 0 && !showWatchlist && (
          <div className="marquee-wrap">
            <div className="marquee-track">
              {marqueeMovies.map((m, i) => (
                <div key={i} className="marquee-card" onClick={() => setSelected(m)}>
                  {m.poster_path
                    ? <img src={m.poster_path} alt={m.title} loading="lazy" />
                    : <div className="card-fb"><Film size={32} /></div>
                  }
                  <div className="mc-overlay" />
                  <div className="mc-title">{m.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── GRID ── */}
        {(loading || catLoading) ? (
          <div className="center">
            <div className="ico"><Loader2 size={42} className="spin" style={{ color:"var(--accent)" }} /></div>
            <p>Loading cinematic treasures…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="center">
            <div className="ico"><Film size={44} style={{ color:"var(--t3)" }} /></div>
            <p>
              {showWatchlist 
                ? "Your watchlist is empty. Add some movies!"
                : "No movies found. Try another category or search!"
              }
            </p>
          </div>
        ) : (
          <div className="grid">
            {filtered.map((movie, i) => (
              <div key={`${movie.title}-${i}`} className="card" onClick={() => setSelected(movie)}>
                {movie.is_searched && <div className="badge">★ Searched</div>}
                {watchlist.has(movie.title) && <div className="badge" style={{ top: '50px', background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}>⭐ Saved</div>}
                
                {movie.poster_path
                  ? <img src={movie.poster_path} alt={movie.title} loading="lazy" />
                  : <div className="card-fb"><Film size={42} /></div>
                }
                <div className="card-ov" />
                
                {/* Action buttons */}
                <div className="card-actions">
                  <button 
                    className="card-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatchlist(movie);
                    }}
                    aria-label={watchlist.has(movie.title) ? "Remove from watchlist" : "Add to watchlist"}
                  >
                    <Bookmark size={16} fill={watchlist.has(movie.title) ? "currentColor" : "none"} />
                  </button>
                  <button 
                    className="card-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      shareMovie(movie);
                    }}
                    aria-label="Share movie"
                  >
                    <Share2 size={16} />
                  </button>
                </div>

                <div className="card-info">
                  <div className="card-title">{movie.title}</div>
                  <div className="card-meta">
                    {movie.vote_average > 0 && (
                      <span className="card-rating">
                        <Star size={12} fill="currentColor" /> {movie.vote_average.toFixed(1)}
                      </span>
                    )}
                    {movie.genres && <span className="card-genres">{movie.genres.split(' ')[0]}</span>}
                    {movie.release_year && <span className="card-genres">{movie.release_year}</span>}
                  </div>
                </div>
                <div className="card-det">
                  <div className="card-title">{movie.title}</div>
                  <div className="card-meta">
                    {movie.vote_average > 0 && (
                      <span className="card-rating">
                        <Star size={12} fill="currentColor" /> {movie.vote_average.toFixed(1)}
                      </span>
                    )}
                    {movie.genres && <span className="card-genres">{movie.genres.split(' ')[0]}</span>}
                    {movie.release_year && <span className="card-genres">{movie.release_year}</span>}
                  </div>
                  {movie.overview && <p className="det-overview">{movie.overview}</p>}
                  {movie.popularity > 0 && (
                    <div className="det-pop">
                      <TrendingUp size={11} /> Popularity: {movie.popularity.toFixed(0)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ MODAL ═══ */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>
              <X size={20} />
            </button>

            {/* ── LEFT: poster column ── */}
            <div className="modal-poster-col">
              {selected.poster_path
                ? <img src={selected.poster_path} alt={selected.title} />
                : <div style={{ width:"100%",height:"100%",background:"linear-gradient(145deg,#1a1a22,#111118)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <Film size={64} style={{ color:"var(--t3)" }} />
                  </div>
              }
              <div className="poster-overlay" />
              {/* floating rating */}
              <div className="poster-rating">
                <Star size={22} fill="var(--accent)" style={{ color:"var(--accent)" }} />
                <div>
                  <div className="pr-num">{selected.vote_average.toFixed(1)}<span className="pr-max">/10</span></div>
                  <div className="pr-label">Rating</div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: details column ── */}
            <div className="modal-details">
              <h2 className="modal-title">{selected.title}</h2>
              {selected.tagline && <p className="modal-tagline">"{selected.tagline}"</p>}

              {/* meta badges */}
              <div className="modal-meta-row">
                {selected.release_year && (
                  <div className="modal-meta-badge">
                    <Calendar size={14} /> {selected.release_year}
                  </div>
                )}
                <div className="modal-meta-badge pop">
                  <Flame size={14} /> Popularity: <strong style={{ color:"var(--t1)",marginLeft:4 }}>{selected.popularity.toFixed(0)}</strong>
                </div>
                <div className="modal-meta-badge">
                  <Globe size={14} /> {selected.original_language.toUpperCase()}
                </div>
                {selected.runtime && (
                  <div className="modal-meta-badge">
                    <Clock size={14} /> {Math.floor(selected.runtime / 60)}h {selected.runtime % 60}m
                  </div>
                )}
              </div>

              {/* genre pills with staggered delay */}
              {selected.genres && (
                <div className="modal-genres">
                  {selected.genres.split(" ").map((g, i) => (
                    <span 
                      key={g} 
                      className="modal-genre-pill" 
                      style={{ animationDelay:`${0.45 + i * 0.1}s` }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* overview */}
              {selected.overview && (
                <>
                  <div className="modal-overview-label">Overview</div>
                  <p className="modal-overview">{selected.overview}</p>
                </>
              )}

              {/* action buttons */}
              <div className="modal-actions">
                <button 
                  className="modal-action-btn primary"
                  onClick={() => toggleWatchlist(selected)}
                >
                  <Bookmark size={18} />
                  {watchlist.has(selected.title) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                </button>
                <button 
                  className="modal-action-btn secondary"
                  onClick={() => shareMovie(selected)}
                >
                  <Share2 size={18} />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
