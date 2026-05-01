'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bebas_Neue, Space_Grotesk, Cutive_Mono } from 'next/font/google';
import {
  ShoppingBag, Palette, Calendar, Lock, Smartphone,
  ArrowRight, Instagram, Youtube, Music,
  Twitter, X, Link2, BarChart3, Rocket,
  MousePointer, Heart, Play, TrendingUp, Star, MessageCircle, Repeat2, Check,
  Dumbbell,
  Brush,
  MapPin,
  Camera,
  Menu
} from 'lucide-react';
// ─────────────────────────────────────────────
// SECTION 1 — WALL OF LOVE
// ─────────────────────────────────────────────

const tweets = [
  {
    id: 1,
    handle: '@fitwithjess',
    name: 'Jess Moore',
    avatar: 'https://images.pexels.com/photos/8038631/pexels-photo-8038631.jpeg?cs=srgb&dl=pexels-roman-odintsov-8038631.jpg&fm=jpg',
    verified: true,
    time: '2h',
    text: 'linkstore just changed everything for me. went from 400 clicks/month to 6.2K in 3 weeks. not joking. this is the one 🔥',
    likes: '2.4K',
    replies: '186',
    retweets: '891',
    platform: 'twitter',
    bg: '#FFFFFF',
    accent: '#000000',
  },
  {
    id: 2,
    handle: '@marcotravels',
    name: 'Marco ✈️',
    avatar: 'https://images.pexels.com/photos/12871449/pexels-photo-12871449.jpeg?cs=srgb&dl=pexels-skildring-12871449.jpg&fm=jpg',
    verified: true,
    time: '5h',
    text: 'bro my merch link has been live for 48hrs and i already made back my entire trip to bali. linkstore is actually insane',
    likes: '4.1K',
    replies: '312',
    retweets: '1.2K',
    platform: 'twitter',
    bg: '#C9BEFF',
    accent: '#000000',
  },
  {
    id: 3,
    handle: '@studiolila_art',
    name: 'Lila Chen 🎨',
    avatar: 'https://images.pexels.com/photos/3785838/pexels-photo-3785838.jpeg?cs=srgb&dl=pexels-olly-3785838.jpg&fm=jpg',
    verified: false,
    time: '1d',
    text: 'ok i was sleeping on link in bio tools. set up my commission booking link in literally 4 minutes. already have 3 new clients this week. bye linktree',
    likes: '987',
    replies: '94',
    retweets: '445',
    platform: 'twitter',
    bg: '#FFDBFD',
    accent: '#000000',
  },
  {
    id: 4,
    handle: '@indiearia',
    name: 'Aria Okafor',
    avatar: 'https://images.pexels.com/photos/7403185/pexels-photo-7403185.jpeg?cs=srgb&dl=pexels-rdne-7403185.jpg&fm=jpg',
    verified: true,
    time: '3d',
    text: "dropped my EP link through linkstore. 14,000 streams in the first day. the analytics dashboard is chef's kiss fr",
    likes: '3.8K',
    replies: '271',
    retweets: '1.6K',
    platform: 'twitter',
    bg: '#FFDBFD',
    accent: '#000000',
  },
  {
    id: 5,
    handle: '@brooke.mua',
    name: 'Brooke MUA',
    avatar: 'https://images.pexels.com/photos/12174416/pexels-photo-12174416.jpeg?cs=srgb&dl=pexels-frank-chamba-82252857-12174416.jpg&fm=jpg',
    verified: true,
    time: '6h',
    text: 'my affiliate links finally make sense. i can see EXACTLY which product is converting. made $1,800 last month just from my bio link. no cap',
    likes: '5.2K',
    replies: '403',
    retweets: '2.1K',
    platform: 'twitter',
    bg: '#FFDBFD',
    accent: '#000000',
  },
  {
    id: 6,
    handle: '@jasonparker',
    name: 'Jason Parker 🎵',
    avatar: 'https://images.pexels.com/photos/7935427/pexels-photo-7935427.jpeg?cs=srgb&dl=pexels-bakr-magrabi-928159-7935427.jpg&fm=jpg',
    verified: false,
    time: '2d',
    text: 'setup took 3 minutes and i literally did it on my phone between sets at the gym. interface is clean, no bloat, just works',
    likes: '1.3K',
    replies: '88',
    retweets: '334',
    platform: 'twitter',
    bg: '#C9BEFF',
    accent: '#000000',
  },
  {
    id: 7,
    handle: '@techwithtara',
    name: 'Tara Singh',
    avatar: 'https://images.pexels.com/photos/8038631/pexels-photo-8038631.jpeg?cs=srgb&dl=pexels-roman-odintsov-8038631.jpg&fm=jpg',
    verified: false,
    time: '4h',
    text: 'asked my followers what they wanted to see on my page. used linkstore to schedule the drops. the FOMO i created was so real 💀💀',
    likes: '678',
    replies: '51',
    retweets: '201',
    platform: 'twitter',
    bg: '#FFDBFD',
    accent: '#000000',
  },
  {
    id: 8,
    handle: '@cookwithkev',
    name: 'Kevin Adeyemi',
    avatar: 'https://images.pexels.com/photos/12871449/pexels-photo-12871449.jpeg?cs=srgb&dl=pexels-skildring-12871449.jpg&fm=jpg',
    verified: true,
    time: '1d',
    text: 'switched from a competitor last week. the difference in click-through rate is actually embarrassing for them lmao',
    likes: '2.9K',
    replies: '228',
    retweets: '987',
    platform: 'twitter',
    bg: '#FFDBFD',
    accent: '#000000',
  },
];

const TweetCard = ({ tweet }: { tweet: typeof tweets[0] }) => (
  <div
    className="border border-[#C9BEFF] p-4 mb-4 break-inside-avoid group hover:-translate-y-0.5 transition-transform duration-150 cursor-pointer bg-white/80 rounded-2xl"
    style={{ background: '#fff', color: tweet.accent }}
  >
    {/* Header */}
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2.5">
        <Image
          src={tweet.avatar}
          alt={tweet.name}
          width={36}
          height={36}
          unoptimized
          sizes="36px"
          className="w-9 h-9 object-cover border flex-shrink-0"
          style={{ borderColor: tweet.accent + '30' }}
        />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold leading-none">{tweet.name}</span>
            {tweet.verified && (
              <div className="w-4 h-4 bg-[#8494FF] flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </div>
            )}
          </div>
          <div className="text-[11px] font-mono mt-0.5" style={{ color: '#8494FF' }}>{tweet.handle} · {tweet.time}</div>
        </div>
      </div>
      <Twitter className="w-4 h-4 flex-shrink-0 opacity-30" />
    </div>

    {/* Text */}
    <p className="text-[13px] leading-relaxed mb-4">{tweet.text}</p>

    {/* Stats */}
    <div className="flex items-center gap-5 pt-3 border-t" style={{ borderColor: '#C9BEFF' }}>
      <div className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: '#8494FF' }}>
        <MessageCircle className="w-3.5 h-3.5" />
        {tweet.replies}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: '#8494FF' }}>
        <Repeat2 className="w-3.5 h-3.5" />
        {tweet.retweets}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: '#8494FF' }}>
        <Heart className="w-3.5 h-3.5" />
        {tweet.likes}
      </div>
    </div>
  </div>
);

export const WallOfLove = () => {
  const col1 = tweets.filter((_, i) => i % 3 === 0);
  const col2 = tweets.filter((_, i) => i % 3 === 1);
  const col3 = tweets.filter((_, i) => i % 3 === 2);

  return (
    <section id="reviews" className="bg-[#FFDBFD] border-b border-[#C9BEFF] py-24 relative overflow-hidden scroll-mt-24">
      <div className="absolute right-0 bottom-0 font-display text-[25vw] leading-none text-[#000000]/[0.03] select-none pointer-events-none">✦</div>

      <div className="max-w-6xl mx-auto px-5 md:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#8494FF] mb-3">/ wall of love</p>
            <h2 className="leading-none uppercase text-[#000000] font-display" style={{ fontSize: 'clamp(54px, 7vw, 92px)' }}>
              they said it,<br />not us.
            </h2>
          </div>
          <div className="flex items-center gap-2 border border-[#C9BEFF] px-4 py-2 self-start md:self-end bg-white/70">
            <span className="w-2 h-2 bg-[#6367FF] rounded-full" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#8494FF]">real creators, real results</span>
          </div>
        </div>

        {/* Masonry — 3 cols on desktop, 2 on tablet, 1 on mobile */}
        <div className="hidden lg:grid grid-cols-3 gap-4 items-start">
          <div>{col1.map(t => <TweetCard key={t.id} tweet={t} />)}</div>
          <div className="mt-8">{col2.map(t => <TweetCard key={t.id} tweet={t} />)}</div>
          <div>{col3.map(t => <TweetCard key={t.id} tweet={t} />)}</div>
        </div>
        <div className="hidden md:grid lg:hidden grid-cols-2 gap-4 items-start">
          <div>{tweets.filter((_, i) => i % 2 === 0).map(t => <TweetCard key={t.id} tweet={t} />)}</div>
          <div className="mt-8">{tweets.filter((_, i) => i % 2 === 1).map(t => <TweetCard key={t.id} tweet={t} />)}</div>
        </div>
        <div className="md:hidden columns-1 gap-4">
          {tweets.slice(0, 4).map(t => <TweetCard key={t.id} tweet={t} />)}
        </div>

        {/* Load more nudge */}
        <div className="mt-10 text-center">
          <button className="bg-[#fff] border border-[#C9BEFF] px-8 py-3 font-mono text-xs uppercase tracking-widest hover:bg-[#000000] hover:text-[#FFFFFF] transition-colors rounded-full">
            + 2,000 more creators
          </button>
        </div>
      </div>
    </section>
  );
};


// ─────────────────────────────────────────────
// SECTION 2 — LIVE PREVIEW BUILDER
// ─────────────────────────────────────────────

const ACCENT_COLORS = [
  { hex: '#6367FF', label: 'Primary' },
  { hex: '#8494FF', label: 'Electric' },
  { hex: '#C9BEFF', label: 'Lavender' },
  { hex: '#FFDBFD', label: 'Blush' },
  { hex: '#FFFFFF', label: 'White' },
];

const BG_THEMES = [
  { bg: '#FFFFFF', label: 'White', textColor: '#000000' },
  { bg: '#C9BEFF', label: 'Lavender', textColor: '#000000' },
  { bg: '#FFDBFD', label: 'Blush', textColor: '#000000' },
  { bg: '#8494FF', label: 'Electric', textColor: '#000000' },
  { bg: '#6367FF', label: 'Primary', textColor: '#000000' },
];

const NICHES = [
  { label: 'Music', icon: Music, emoji: '🎵' },
  { label: 'Fitness', icon: Dumbbell, emoji: '💪' },
  { label: 'Art', icon: Brush, emoji: '🎨' },
  { label: 'Travel', icon: MapPin, emoji: '✈️' },
  { label: 'Photo', icon: Camera, emoji: '📸' },
  { label: 'Fashion', icon: ShoppingBag, emoji: '👗' },
];

export const LivePreviewBuilder = ({ inModal = false }: { inModal?: boolean }) => {
  const [name, setName] = useState('Your Name');
  const [handle, setHandle] = useState('@yourhandle');
  const [accentColor, setAccentColor] = useState('#6367FF');
  const [bgTheme, setBgTheme] = useState(BG_THEMES[0]);
  const [niche, setNiche] = useState(NICHES[0]);
  const [bio, setBio] = useState('✨ Creator · Making things people love');
  const [copied, setCopied] = useState(false);

  const textColor = bgTheme.textColor;

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id={inModal ? undefined : 'builder'}
      className={`bg-[#FFDBFD] relative overflow-hidden ${inModal ? 'py-10' : 'py-24 scroll-mt-24'}`}
    >
      <div className="absolute left-0 top-0 font-mono text-[11vw] leading-none text-[#000000]/[0.03] select-none pointer-events-none whitespace-nowrap pt-4 pl-4" style={{ fontFamily: 'monospace' }}>
        {'<LinkPage />'}
      </div>

      <div className="max-w-6xl mx-auto px-5 md:px-10 relative z-10">
        {/* Header */}
        <div className="mb-14">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#8494FF] mb-3">/ live builder</p>
          <h2 className="leading-none uppercase text-[#000000] font-display" style={{ fontSize: 'clamp(56px, 7vw, 96px)' }}>
            See your page<br /><span style={{ color: accentColor }}>in 60 seconds.</span>
          </h2>
          <p className="text-[#8494FF] text-sm mt-4 max-w-md">
            Mess around below. Your page updates live. No signup needed to preview.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-8 lg:gap-14 items-start">
          {/* Controls */}
          <div className="space-y-8">
            {/* Name */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#8494FF] block mb-2">Your name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={28}
                placeholder="Your Name"
                className="w-full bg-white border border-[#C9BEFF] text-[#000000] px-4 py-3 font-bold text-[15px] placeholder:text-[#8494FF] focus:border-[#C9BEFF] focus:outline-none transition-colors rounded-lg"
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            {/* Handle */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#8494FF] block mb-2">Handle</label>
              <input
                type="text"
                value={handle}
                onChange={e => setHandle(e.target.value.startsWith('@') ? e.target.value : '@' + e.target.value)}
                maxLength={20}
                placeholder="@yourhandle"
                className="w-full bg-white border border-[#C9BEFF] text-[#000000] px-4 py-3 font-mono text-[13px] placeholder:text-[#8494FF] focus:border-[#C9BEFF] focus:outline-none transition-colors rounded-lg"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#8494FF] block mb-2">Bio line</label>
              <input
                type="text"
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={50}
                placeholder="✨ short bio here"
                className="w-full bg-white border border-[#C9BEFF] text-[#000000] px-4 py-3 text-[13px] placeholder:text-[#8494FF] focus:border-[#C9BEFF] focus:outline-none transition-colors rounded-lg"
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            {/* Niche */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#8494FF] block mb-2">Your niche</label>
              <div className="grid grid-cols-3 gap-0 border border-[#C9BEFF] bg-white/70">
                {NICHES.map((n, i) => (
                  <button
                    key={n.label}
                    onClick={() => setNiche(n)}
                    className={`flex items-center gap-2 px-3 py-2.5 text-[12px] font-semibold transition-colors ${i % 3 !== 0 ? 'border-l border-[#C9BEFF]' : ''} ${Math.floor(i / 3) > 0 ? 'border-t border-[#C9BEFF]' : ''} ${niche.label === n.label ? 'bg-white text-[#000000]' : 'text-[#8494FF] hover:text-[#000000] hover:bg-[#FFFFFF]'} rounded-lg`}
                  >
                    <span>{n.emoji}</span>
                    <span>{n.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Background */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#8494FF] block mb-2">Background</label>
              <div className="flex gap-2 flex-wrap">
                {BG_THEMES.map(theme => (
                  <button
                    key={theme.bg}
                    onClick={() => setBgTheme(theme)}
                    className={`flex items-center gap-2 px-3 py-2 border text-[11px] font-mono uppercase tracking-wider transition-all ${bgTheme.bg === theme.bg ? 'border-[#000000] text-[#000000]' : 'border-[#C9BEFF] text-[#8494FF] hover:border-[#C9BEFF]'} rounded-full`}
                  >
                    <span className="w-3 h-3 border border-[#C9BEFF] flex-shrink-0" style={{ background: theme.bg }} />
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent color */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#8494FF] block mb-2">Accent color</label>
              <div className="flex gap-2 flex-wrap">
                {ACCENT_COLORS.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => setAccentColor(c.hex)}
                    title={c.label}
                    className={`w-8 h-8 border transition-all hover:scale-110 ${accentColor === c.hex ? 'border-[#000000] scale-110' : 'border-transparent'} rounded-full`}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="pt-2">
              <button
                onClick={handleCopy}
                className="w-full py-4 font-bold uppercase tracking-wider text-sm border transition-all rounded-lg"
                style={{
                  background: copied ? accentColor : 'transparent',
                  color: copied ? '#000000' : accentColor,
                  borderColor: accentColor,
                }}
              >
                {copied ? '✓ Link copied!' : `→ Claim ${handle}`}
              </button>
            </div>
          </div>

          {/* Phone Preview */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative">
              {/* Shadow */}
              <div className="absolute top-3 left-3 w-full h-full border border-[#C9BEFF]" style={{ background: accentColor + '15' }} />

              {/* Phone */}
              <div className="relative w-[240px] border border-[#C9BEFF] overflow-hidden transition-all duration-300" style={{ background: bgTheme.bg }}>
                {/* Status bar */}
                <div className="flex items-center justify-between px-4 pt-3 pb-1.5" style={{ background: bgTheme.bg }}>
                  <span className="text-[9px] font-mono" style={{ color: textColor + '70' }}>9:41</span>
                  <div className="w-12 h-3 rounded-full" style={{ background: textColor + '10' }} />
                  <div className="w-2.5 h-1.5 rounded-sm" style={{ background: textColor + '15' }} />
                </div>

                {/* Content */}
                <div className="px-4 pt-3 pb-6">
                  {/* Avatar */}
                  <div className="flex flex-col items-center mb-5">
                    <div className="w-16 h-16 border mb-2.5 flex items-center justify-center text-2xl overflow-hidden" style={{ borderColor: accentColor, background: accentColor + '20' }}>
                      <span>{niche.emoji}</span>
                    </div>
                    <div className="text-[14px] font-bold truncate max-w-full px-2 text-center" style={{ color: textColor, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em', fontSize: '18px' }}>
                      {name || 'Your Name'}
                    </div>
                    <div className="text-[9px] font-mono mt-0.5" style={{ color: textColor + '60' }}>
                      {handle || '@yourhandle'}
                    </div>
                    <div className="text-[9px] mt-1.5 text-center px-2 leading-relaxed" style={{ color: textColor + '70' }}>
                      {bio.slice(0, 40)}{bio.length > 40 ? '...' : ''}
                    </div>

                    {/* Niche tag */}
                    <div className="mt-2 px-2 py-0.5 text-[8px] font-mono uppercase tracking-widest font-bold border" style={{ color: textColor, borderColor: accentColor, background: accentColor }}>
                      <span style={{ color: '#000000' }}>{niche.label}</span>
                    </div>
                  </div>

                  {/* Link pills */}
                  <div className="space-y-1.5">
                    {[
                      `${niche.emoji} My ${niche.label.toLowerCase()} store`,
                      `📱 Follow on IG`,
                      `🔗 Latest content`,
                    ].map((pill, i) => (
                      <div
                        key={i}
                        className="px-3 py-2.5 text-[10px] font-semibold border cursor-pointer transition-all"
                        style={{
                          background: i === 0 ? accentColor : 'transparent',
                          borderColor: i === 0 ? accentColor : textColor + '20',
                          color: i === 0 ? '#000000' : textColor + '75',
                        }}
                      >
                        {pill}
                      </div>
                    ))}
                  </div>

                  {/* Analytics chip */}
                  <div className="mt-3 p-2 flex items-center gap-2" style={{ background: textColor + '08', border: `1px solid ${textColor}15` }}>
                    <TrendingUp className="w-3 h-3 flex-shrink-0" style={{ color: accentColor }} />
                    <div>
                      <div className="text-[9px] font-bold" style={{ color: textColor }}>+247 clicks today</div>
                      <div className="text-[8px] font-mono" style={{ color: textColor + '70' }}>↑ 18% vs yesterday</div>
                    </div>
                  </div>

                  {/* Branding */}
                  <div className="mt-3 text-center">
                    <span className="font-mono text-[8px] uppercase tracking-widest" style={{ color: textColor + '25' }}>
                      powered by linkstore
                    </span>
                  </div>
                </div>
              </div>

              {/* Live badge */}
              <div className="absolute -top-3 -right-3 px-2.5 py-1 bg-[#000000] border border-[#000000]">
                <span className="font-mono text-[8px] uppercase tracking-widest text-[#FFFFFF] font-bold flex items-center gap-1">
                  <span className="w-1 h-1 bg-[#FFFFFF] rounded-full" />
                  live preview
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


// ─────────────────────────────────────────────
// SECTION 3 — FOMO SIGNUP FEED (fixed bottom corner)
// ─────────────────────────────────────────────

const FOMO_EVENTS = [
  { handle: '@miabeauty__', niche: 'Beauty', action: 'just created their store', time: '2s ago', emoji: '💄', color: '#6367FF' },
  { handle: '@lukeskates99', niche: 'Sports', action: 'got their first 100 clicks', time: '8s ago', emoji: '🛹', color: '#8494FF' },
  { handle: '@chefmarco_', niche: 'Food', action: 'just went live', time: '14s ago', emoji: '🍳', color: '#C9BEFF' },
  { handle: '@sunsetphotos', niche: 'Photo', action: 'just created their store', time: '21s ago', emoji: '📸', color: '#6367FF' },
  { handle: '@fitnessbyjay', niche: 'Fitness', action: 'made their first sale', time: '35s ago', emoji: '💪', color: '#8494FF' },
  { handle: '@ravewithrosa', niche: 'Music', action: 'just created their store', time: '47s ago', emoji: '🎧', color: '#6367FF' },
  { handle: '@travelwithkai', niche: 'Travel', action: 'got 500 clicks today', time: '1m ago', emoji: '✈️', color: '#8494FF' },
  { handle: '@artbypriya', niche: 'Art', action: 'just created their store', time: '1m ago', emoji: '🎨', color: '#6367FF' },
  { handle: '@glambyzoey', niche: 'Beauty', action: 'just went live', time: '2m ago', emoji: '💅', color: '#8494FF' },
  { handle: '@djnightowl', niche: 'Music', action: 'dropped a new link', time: '2m ago', emoji: '🎵', color: '#6367FF' },
];

export const FomoFeed = () => {
  const [notifications, setNotifications] = useState<typeof FOMO_EVENTS>([]);
  const [visible, setVisible] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showNext = useCallback(() => {
    const event = FOMO_EVENTS[indexRef.current % FOMO_EVENTS.length];
    indexRef.current += 1;

    setNotifications([event]);
    setVisible(true);

    setTimeout(() => {
      setVisible(false);
    }, 3800);
  }, []);

  useEffect(() => {
    // First one after 3s
    const initial = setTimeout(() => {
      showNext();
      timerRef.current = setInterval(showNext, 6000);
    }, 3000);

    return () => {
      clearTimeout(initial);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showNext]);

  return (
    <div className="fixed bottom-5 left-5 z-[200] pointer-events-none hidden md:block" style={{ maxWidth: '280px' }}>
      {notifications.map((notif) => (
        <div
          key={`${notif.handle}-${notif.time}`}
          className="pointer-events-auto border border-[#C9BEFF] bg-white p-3 flex items-center gap-3 rounded-2xl"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}
        >
          {/* Emoji badge */}
          <div className="w-9 h-9 flex items-center justify-center text-lg border border-[#C9BEFF] flex-shrink-0" style={{ background: '#FFDBFD' }}>
            {notif.emoji}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[12px] font-bold text-[#000000] truncate">{notif.handle}</span>
              <span className="text-[10px] px-1.5 py-0.5 font-mono uppercase tracking-wide border border-[#C9BEFF] text-[#8494FF] shrink-0" style={{ fontSize: '8px' }}>{notif.niche}</span>
            </div>
            <div className="text-[11px] text-[#8494FF] leading-tight mt-0.5">
              {notif.action}
            </div>
          </div>

          {/* Time */}
          <div className="font-mono text-[9px] text-[#8494FF] uppercase tracking-wider shrink-0">{notif.time}</div>
        </div>
      ))}
    </div>
  );
};


// ─────────────────────────────────────────────
// LANDING PAGE
// ─────────────────────────────────────────────

const displayFont = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
});

const bodyFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
});

const monoFont = Cutive_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
});

const LinkstoreLanding = () => {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);

  const howSectionRef = useRef<HTMLElement>(null);
  const featuresSectionRef = useRef<HTMLElement>(null);
  const proofSectionRef = useRef<HTMLElement>(null);
  const ctaSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    [
      { key: 'how', node: howSectionRef.current },
      { key: 'features', node: featuresSectionRef.current },
      { key: 'proof', node: proofSectionRef.current },
      { key: 'cta', node: ctaSectionRef.current },
    ].forEach(({ key, node }) => {
      if (!node) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(key));
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0.05 }
      );
      observer.observe(node);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const creators = [
    { name: 'Jason Parker', handle: '@jasonparker', niche: 'MUSIC', followers: '892K', bg: '#FFFFFF', text: '#000000', imageUrl: 'https://images.pexels.com/photos/7935427/pexels-photo-7935427.jpeg?cs=srgb&dl=pexels-bakr-magrabi-928159-7935427.jpg&fm=jpg', pills: ['Latest single 🎵', 'YouTube vids', 'Merch store', 'IG follow'] },
    { name: 'FitWithJess', handle: '@fitwithjess', niche: 'FITNESS', followers: '1.2M', bg: '#FFFFFF', text: '#000000', imageUrl: 'https://images.pexels.com/photos/8038631/pexels-photo-8038631.jpeg?cs=srgb&dl=pexels-roman-odintsov-8038631.jpg&fm=jpg', pills: ['Fitness programs 💪', 'My workouts', 'E-book', 'IG follow'] },
    { name: 'Brooke MUA', handle: '@brooke.mua', niche: 'BEAUTY', followers: '567K', bg: '#FFFFFF', text: '#000000', imageUrl: 'https://images.pexels.com/photos/12174416/pexels-photo-12174416.jpeg?cs=srgb&dl=pexels-frank-chamba-82252857-12174416.jpg&fm=jpg', pills: ['Tutorials 💄', 'Shop my picks', 'IG follow', 'Newsletter'] },
    { name: 'Marco Travels', handle: '@marcotravels', niche: 'TRAVEL', followers: '2.1M', bg: '#FFFFFF', text: '#000000', imageUrl: 'https://images.pexels.com/photos/12871449/pexels-photo-12871449.jpeg?cs=srgb&dl=pexels-skildring-12871449.jpg&fm=jpg', pills: ['Travel guides 🌍', 'Watch vlog', 'Latest blog', 'IG follow'] },
    { name: 'Studio Lila', handle: '@studiolila', niche: 'ART', followers: '340K', bg: '#FFFFFF', text: '#000000', imageUrl: 'https://images.pexels.com/photos/3785838/pexels-photo-3785838.jpeg?cs=srgb&dl=pexels-olly-3785838.jpg&fm=jpg', pills: ['New drop 🎨', 'BTS content', 'Book consult', 'Newsletter'] },
    { name: 'Indie Aria', handle: '@indiearia', niche: 'MUSIC', followers: '445K', bg: '#FFFFFF', text: '#000000', imageUrl: 'https://images.pexels.com/photos/7403185/pexels-photo-7403185.jpeg?cs=srgb&dl=pexels-rdne-7403185.jpg&fm=jpg', pills: ['Listen to EP 🎶', 'Tour dates', 'Live set', 'Fan club'] },
  ];

  const tickerItems = ['link in bio ↗', 'no cap', 'clicks = cash ', 'free forever', 'setup in 3 min', 'your brand. your rules.', 'going live rn ⚡', 'built different'];

  return (
    <div className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} font-body bg-[#6367FF] text-[#000000] overflow-x-hidden`}>

      {/* ── TICKER ── */}
      <div className="bg-[#6367FF] text-[#fff] py-2 overflow-hidden border-b border-[#C9BEFF]">
        <div className="flex gap-0 whitespace-nowrap animate-ticker w-max">
          {[...Array(2)].fill(tickerItems).flat().map((item: string, i: number) => (
            <span key={i} className="font-mono text-[11px] tracking-widest px-6 shrink-0">
              {item} <span className="text-[#8494FF]/30 mx-2">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav
        className={`sticky mx-4 rounded-xl top-0 z-[100] px-5 md:px-10 py-3 transition-all ${scrolled ? 'bg-[#FFDBFD] backdrop-blur' : 'bg-[#FFDBFD]'
          }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-[#000000] flex items-center justify-center">
              <Link2 className="w-3.5 h-3.5 text-[#FFFFFF]" />
            </div>
            <span className="text-xl font-display tracking-widest text-[#000000]">linkstore</span>
          </a>

          <ul className="hidden md:flex items-center gap-0 rounded-full overflow-hidden">
            {['How it works', 'Features', 'Builder', 'Reviews', 'Creators'].map((item, i) => (
              <li key={item} className={i > 0 ? '' : ''}>
                <a href={`#${item.toLowerCase().replace(/\s/g, '')}`} className="block px-5 py-2 text-[11px] font-mono tracking-wider font-semibold text-[#6367FF] hover:text-[#000000] hover:bg-[#FFDBFD] transition-colors">
                  {item}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/dashboard" className="px-5 py-2.5 border border-[#C9BEFF] text-sm font-semibold text-[#8494FF] hover:text-[#000000] hover:bg-[#FFDBFD] transition-colors rounded-full">Log in</Link>
            <Link href="/dashboard" className="px-5 py-2.5 bg-[#6367FF] text-[#FFFFFF] text-sm font-bold tracking-wider hover:bg-[#8494FF] transition-colors rounded-full">
              Get started →
            </Link>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#FFFFFF] border-b border-[#C9BEFF] py-4 px-5">
            <ul className="flex flex-col gap-0 border border-[#C9BEFF] mb-4 bg-white/70 rounded-xl overflow-hidden">
              {['How it works', 'Features', 'Builder', 'Reviews', 'Creators'].map((item, i) => (
                <li key={item} className={i > 0 ? 'border-t border-[#C9BEFF]' : ''}>
                  <a onClick={() => setMobileMenuOpen(false)} href={`#${item.toLowerCase().replace(/\s/g, '')}`} className="block px-4 py-3 font-mono text-sm tracking-wide text-[#000000]">{item}</a>
                </li>
              ))}
            </ul>
            <Link href="/dashboard" className="block bg-[#6367FF] text-[#FFFFFF] px-5 py-3 font-bold tracking-wider text-center rounded-full">
              Get started →
            </Link>
          </div>
        )}
      </nav>

      <main>
        {/* ── HERO — off-white cream ── */}
        <section id="top" className="bg-[#6367FF] min-h-[90vh] flex items-center px-5 md:px-10 py-16 relative overflow-hidden">
          <div className="absolute right-[-2%] top-1/2 -translate-y-1/2 font-display text-[26vw] leading-none text-[#000000]/[0.03] select-none pointer-events-none">01</div>

          <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-[1fr_320px] gap-10 lg:gap-16 items-center relative z-10">
            <div>
              {/* <div className="inline-flex items-center gap-2 border border-[#C9BEFF] bg-[#fff] px-3 py-1 mb-8 rounded-full">
                <span className="w-1.5 h-1.5 bg-[#6367FF] rounded-full" />
                <span className="font-mono text-[11px] tracking-widest text-[#6367FF]">12,000+ creators live</span>
              </div> */}

              <h1 className="font-display text-[14vw] md:text-[9.5vw] lg:text-[8vw] leading-none tracking-tight text-[#fff] mb-1">Your</h1>
              <h1 className="font-display text-[14vw] md:text-[9.5vw] lg:text-[8vw] leading-none tracking-tight mb-6">
                <span className="bg-[#FFDBFD] px-2 text-[#6367FF]">link-in</span><span className="outlined-text">-bio</span>{' '}
              </h1>

              <p className="text-base text-[#fff] max-w-[420px] mb-8 leading-relaxed font-body">
                One link. A bold storefront that turns followers into customers. Setup in 3 minutes, for real.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <Link href="/dashboard" className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#fff] text-[#6367FF] font-bold tracking-wider text-sm hover:bg-[#8494FF] transition-colors border border-[#6367FF] rounded-full">
                  <Rocket className="w-4 h-4" />
                  Start free
                </Link>
                <button
                  onClick={() => setBuilderOpen(true)}
                  className="inline-flex items-center gap-2.5 px-8 py-4 bg-transparent text-[#fff] font-bold tracking-wider text-sm border border-[#C9BEFF] hover:bg-[#FFDBFD] transition-colors rounded-full"
                >
                  <Play className="w-3.5 h-3.5" />
                  See live preview
                </button>
              </div>

              <div className="flex items-center gap-4 pt-6">
                <div className="flex -space-x-2">
                  {[
                    'https://images.pexels.com/photos/7935427/pexels-photo-7935427.jpeg?cs=srgb&dl=pexels-bakr-magrabi-928159-7935427.jpg&fm=jpg',
                    'https://images.pexels.com/photos/8038631/pexels-photo-8038631.jpeg?cs=srgb&dl=pexels-roman-odintsov-8038631.jpg&fm=jpg',
                    'https://images.pexels.com/photos/12174416/pexels-photo-12174416.jpeg?cs=srgb&dl=pexels-frank-chamba-82252857-12174416.jpg&fm=jpg',
                    'https://images.pexels.com/photos/12871449/pexels-photo-12871449.jpeg?cs=srgb&dl=pexels-skildring-12871449.jpg&fm=jpg',
                  ].map((src, i) => (
                    <Image
                      key={i}
                      src={src}
                      alt="creator"
                      width={36}
                      height={36}
                      unoptimized
                      sizes="36px"
                      className="w-9 h-9 rounded-full object-cover border-2 border-[#FFFFFF]"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-[#fff] text-[#fff]" />)}
                  </div>
                  <p className="text-[11px] text-[#fff] font-mono mt-0.5">loved by creators everywhere</p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute top-3 left-3 w-full h-full bg-[#FFDBFD] opacity-80" />
                <div className="relative w-[255px] bg-white border border-[#C9BEFF] overflow-hidden">
                  <div className="flex items-center justify-between px-5 pt-3.5 pb-1 bg-[#FFDBFD]">
                    <span className="text-[10px] text-[#8494FF] font-mono">9:41</span>
                    <div className="w-14 h-3.5 bg-[#FFDBFD] rounded-full" />
                    <div className="w-3 h-1.5 bg-[#C9BEFF] rounded-sm" />
                  </div>

                  <div className="bg-white px-5 pt-4 pb-6">
                    <div className="flex flex-col items-center mb-4">
                      <div className="border border-[#C9BEFF] mb-3">
                        <Image
                          src="https://images.pexels.com/photos/12871449/pexels-photo-12871449.jpeg?cs=srgb&dl=pexels-skildring-12871449.jpg&fm=jpg"
                          alt="creator"
                          width={56}
                          height={56}
                          unoptimized
                          sizes="56px"
                          className="w-14 h-14 object-cover"
                        />
                      </div>
                      <h3 className="text-sm font-bold text-[#000000]">Marco Travels</h3>
                      <p className="text-[9px] text-[#8494FF] mt-0.5 font-mono tracking-wider">✈️ 2.1M followers</p>
                      <div className="flex items-center gap-3 mt-2.5 text-[#8494FF]">
                        <Instagram className="w-3.5 h-3.5" /><Youtube className="w-3.5 h-3.5" /><Music className="w-3.5 h-3.5" /><Twitter className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {[
                        { label: '🗺️ Top travel guides', hot: true },
                        { label: '🎬 Watch my vlog', hot: false },
                        { label: '📖 Latest blog post', hot: false },
                        { label: '📸 Follow on Instagram', hot: false },
                      ].map((pill, i) => (
                        <div key={i} className={`flex items-center justify-between px-3 py-2.5 text-[11px] font-semibold border cursor-pointer transition-all ${i === 0 ? 'bg-[#FFDBFD] border-[#C9BEFF] text-[#000000]' : 'bg-white border-[#C9BEFF] text-[#8494FF] hover:border-[#C9BEFF]'}`}>
                          <span>{pill.label}</span>
                          {pill.hot && <span className="text-[8px] bg-[#6367FF] text-[#FFFFFF] px-1.5 py-0.5 font-bold tracking-wide">hot</span>}
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 bg-[#FFDBFD] p-2.5 flex items-center gap-2.5 border border-[#C9BEFF]">
                      <TrendingUp className="w-3.5 h-3.5 text-[#6367FF] flex-shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold text-[#000000]">+247 clicks today</div>
                        <div className="text-[9px] text-[#8494FF] font-mono">↑ 18% from yesterday</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-10 bg-[#FFDBFD] border border-[#C9BEFF] px-4 py-2.5">
                  <div className="text-[9px] font-mono tracking-widest text-[#8494FF]">Conversion</div>
                  <div className="text-2xl font-display text-[#000000] leading-none">2.7×</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Curve divider: Hero -> Stats */}
        {/* <div className="relative h-6 bg-[#FFFFFF] overflow-hidden">
          <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,64 C240,120 480,120 720,64 C960,8 1200,8 1440,64 L1440,120 L0,120 Z" fill="#FFDBFD" />
          </svg>
        </div> */}

        {/* ── STATS — deep contrast ── */}
        <div className="bg-[#fff] mx-8 rounded-xl">
          <div className="max-w-6xl mx-auto px-5 grid grid-cols-3 divide-x divide-[#6367FF]">
            {[
              { value: '2.7×', label: 'conversion lift', accent: '#6367FF' },
              { value: '12K+', label: 'storefronts live', accent: '#C9BEFF' },
              { value: '3 min', label: 'to set up', accent: '#8494FF' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center py-8 gap-1 text-center">
                <div className="font-display text-[42px] leading-none" style={{ color: '#6367FF' }}>{stat.value}</div>
                <div className="text-[11px] font-mono tracking-widest text-[#6367FF]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Curve divider: Stats -> How */}
        <div className="relative h-6 bg-[#6367FF] overflow-hidden">
          <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,70 C260,10 520,10 780,70 C1040,130 1250,130 1440,70 L1440,120 L0,120 Z" fill="#FFDBFD" />
          </svg>
        </div>

        {/* ── HOW IT WORKS — soft neutral ── */}
        <section
          id="howitworks"
          ref={howSectionRef}
          className={`bg-[#FFDBFD] relative overflow-hidden transition-all duration-700 scroll-mt-24 ${visibleSections.has('how') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="absolute right-0 top-0 font-display text-[22vw] leading-none text-[#000000]/[0.03] select-none pointer-events-none">02</div>
          <div className="max-w-6xl mx-auto px-5 md:px-10 py-24 relative z-10">
            <div className="mb-16">
              <p className="font-mono text-[11px] tracking-[0.3em] text-[#8494FF] mb-3">/ how it works</p>
              <h2 className="font-display text-[72px] md:text-[90px] leading-none text-[#000000]">3 steps. that's it.</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-0 border border-[#C9BEFF] bg-white">
              {[
                { step: '01', title: 'Sign up', desc: "One tap with Google. No forms, no CC. You're in.", icon: Rocket },
                { step: '02', title: 'Add links', desc: 'Drop in anything — merch, vids, affiliate picks. Drag to reorder.', icon: Link2 },
                { step: '03', title: 'Share it', desc: 'One URL in every bio. Watch the clicks roll in.', icon: Smartphone },
              ].map((step, i) => (
                <div key={i} className={`p-8 ${i > 0 ? 'border-l border-[#C9BEFF]' : ''} group hover:bg-white transition-colors duration-200`}>
                  <div className="font-display text-[58px] leading-none text-[#000000]/15 mb-4 transition-colors">{step.step}</div>
                  <h3 className="font-display text-[30px] leading-none text-[#000000] mb-3 transition-colors">{step.title}</h3>
                  <p className="text-sm text-[#8494FF] leading-relaxed transition-colors">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES — light ── */}
        <section
          id="features"
          ref={featuresSectionRef}
          className={`bg-[#6367FF] relative overflow-hidden transition-all duration-700 scroll-mt-24 ${visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="absolute left-0 bottom-0 font-display text-[22vw] leading-none text-[#000000]/[0.03] select-none pointer-events-none">03</div>
          <div className="max-w-6xl mx-auto px-5 md:px-10 py-24 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
              <div>
                <p className="font-mono text-[11px] tracking-[0.3em] text-[#8494FF] mb-3">/ features</p>
                <h2 className="font-display text-[72px] md:text-[90px] leading-none text-[#fff]">Built different.</h2>
              </div>
              <p className="text-[#fff] max-w-xs text-sm leading-relaxed md:text-right font-body">Every tool you need. None that just pad the pricing page.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border border-[#C9BEFF] bg-white/85">
              {[
                { icon: BarChart3, title: 'Real-time analytics', desc: 'See which links are popping and where your crowd comes from. Live.', tag: 'DATA', accent: '#8494FF' },
                { icon: ShoppingBag, title: 'Shoppable links', desc: 'Add images, prices, descriptions. Turn followers into buyers.', tag: 'SELL', accent: '#C9BEFF' },
                { icon: Palette, title: 'Custom branding', desc: 'Your colors, your fonts, your vibe. Unmistakably you.', tag: 'STYLE', accent: '#6367FF' },
                { icon: Calendar, title: 'Link scheduling', desc: 'Schedule drops to go live at exactly the right moment.', tag: 'TIMING', accent: '#6367FF' },
                { icon: Lock, title: 'Link protection', desc: 'Password-protect exclusive content for your real ones.', tag: 'GATE', accent: '#6367FF' },
                { icon: MousePointer, title: 'Click tracking', desc: 'Know exactly who clicked what. No guessing, no cap.', tag: 'TRACK', accent: '#8494FF' },
              ].map((feat, i) => (
                <div key={i} className={`p-6 bg-white border-[#C9BEFF] group hover:bg-white transition-all duration-200 cursor-pointer rounded-xl ${i % 3 !== 0 ? 'border-l' : ''} ${i >= 3 ? 'border-t' : ''}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="border border-[#C9BEFF] p-2 group-hover:border-[#C9BEFF] transition-colors bg-white">
                      <feat.icon className="w-4 h-4 text-[#8494FF] group-hover:text-[#000000] transition-colors" />
                    </div>
                    <span className="font-mono text-[9px] tracking-widest px-2 py-1 border" style={{ color: feat.accent, borderColor: feat.accent + '55' }}>{feat.tag}</span>
                  </div>
                  <h3 className="text-[15px] font-bold text-[#000000] mb-2">{feat.title}</h3>
                  <p className="text-[13px] text-[#8494FF] leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Curve divider: Features -> Reviews */}
        <div className="relative h-6 bg-[#6367FF] overflow-hidden">
          <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,70 C260,10 520,10 780,70 C1040,130 1250,130 1440,70 L1440,120 L0,120 Z" fill="#FFDBFD" />
          </svg>
        </div>

        <WallOfLove />

        {/* ── PREVIEW — popup trigger ── */}
        <section id="builder" className="bg-[#6367FF] py-20 relative overflow-hidden border-b border-[#C9BEFF] scroll-mt-24">
          <div className="max-w-6xl mx-auto px-5 md:px-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#8494FF] mb-3">/ live preview</p>
                <h2 className="leading-none uppercase text-white font-display" style={{ fontSize: 'clamp(52px, 7vw, 90px)' }}>
                  Try it live<br /><span className="text-[#FFDBFD]">in a popup.</span>
                </h2>
                <p className="text-white text-sm mt-4 max-w-md">
                  Open a focused preview so the page stays clean while you play with colors, copy, and layout.
                </p>
              </div>
              <button
                onClick={() => setBuilderOpen(true)}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#FFDBFD] text-[#000000] font-bold tracking-wider text-sm hover:bg-[#8494FF] transition-colors border border-[#6367FF] rounded-full"
              >
                Open live preview
              </button>
            </div>
          </div>
        </section>

        {/* Curve divider: Preview -> Creators */}
        <div className="relative h-6 bg-[#FFDBFD] overflow-hidden">
          <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,64 C240,120 480,120 720,64 C960,8 1200,8 1440,64 L1440,120 L0,120 Z" fill="#FFDBFD" />
          </svg>
        </div>

        {/* ── CREATORS — soft neutral ── */}
        <section
          id="creators"
          ref={proofSectionRef}
          className={`bg-[#FFDBFD] py-20 overflow-hidden relative transition-all duration-700 scroll-mt-24 ${visibleSections.has('proof') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="absolute right-0 top-0 font-display text-[22vw] leading-none text-[#000000]/[0.03] select-none pointer-events-none">04</div>
          <div className="max-w-6xl mx-auto px-5 md:px-10 mb-12 relative z-10">
            <p className="font-mono text-[11px] tracking-[0.3em] text-[#8494FF] mb-3">/ creator gallery</p>
            <h2 className="font-display text-[72px] md:text-[90px] leading-none text-[#000000]">see who's on it.</h2>
          </div>

          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
              {[...creators, ...creators].map((creator, idx) => (
                <div key={idx} className="flex-shrink-0 w-[220px] snap-start">
                  <div className="border border-[#C9BEFF] overflow-hidden group hover:-translate-y-1 transition-transform duration-200 rounded-xl" style={{ background: '#FFFFFF' }}>
                    <div className="h-24 relative overflow-hidden border-b border-[#C9BEFF]">
                      <Image
                        src={creator.imageUrl}
                        alt={creator.name}
                        fill
                        unoptimized
                        sizes="220px"
                        className="object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <span className="font-mono text-[8px] tracking-widest px-2 py-1 bg-[#6367FF] text-[#FFFFFF]">{creator.niche}</span>
                      </div>
                    </div>

                    <div className="px-3.5 py-3.5" style={{ color: creator.text, background: creator.bg }}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Image
                          src={creator.imageUrl}
                          alt={creator.name}
                          width={28}
                          height={28}
                          unoptimized
                          sizes="28px"
                          className="w-7 h-7 object-cover border border-current/20"
                        />
                        <div>
                          <h3 className="text-[12px] font-bold leading-tight">{creator.name}</h3>
                          <p className="text-[9px] font-mono opacity-60 tracking-wider">{creator.followers}</p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        {creator.pills.map((pill, pi) => (
                          <div key={pi} className="text-[10px] font-medium px-2.5 py-1.5 border cursor-pointer transition-all bg-white/70" style={{ borderColor: creator.text + '25', color: creator.text }}>
                            {pill}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Curve divider: Creators -> CTA */}
        <div className="relative h-6 bg-[#FFDBFD] overflow-hidden">
          <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,64 C240,120 480,120 720,64 C960,8 1200,8 1440,64 L1440,120 L0,120 Z" fill="#6367FF" />
          </svg>
        </div>

        {/* ── CTA — soft contrast ── */}
        <section
          id="cta"
          ref={ctaSectionRef}
          className={`bg-[#6367FF] relative overflow-hidden transition-all duration-700 scroll-mt-24 ${visibleSections.has('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="absolute right-0 bottom-0 font-display text-[22vw] leading-none text-[#000000]/[0.03] select-none pointer-events-none">05</div>

          <div className="max-w-6xl mx-auto px-5 md:px-10 py-28 relative z-10">
            <h2 className="font-display leading-none mb-10">
              <span className="text-white block" style={{ fontSize: 'clamp(46px, 9vw, 110px)' }}>Your bio should</span>
              <span className="text-[#FFDBFD] block" style={{ fontSize: 'clamp(46px, 9vw, 110px)' }}>feel effortless.</span>
            </h2>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10 border-t border-[#C9BEFF] pt-10">
              <div>
                <p className="text-white max-w-md text-base leading-relaxed">
                  Join 12,000+ creators who leveled up their bio link. Takes 3 minutes. No design skills needed.
                </p>
              </div>

              <div className="flex flex-col gap-3 shrink-0">
                <Link href="/dashboard" className="inline-flex items-center justify-center gap-2.5 px-10 py-4 bg-[#FFDBFD] text-[#6367FF] font-bold tracking-wider text-sm hover:bg-[#8494FF] transition-colors border border-[#6367FF] rounded-full">
                  <Rocket className="w-4 h-4" />
                  Create your linkstore
                </Link>
                <a href="#creators" className="inline-flex items-center justify-center gap-2.5 px-10 py-4 bg-transparent text-[#FFDBFD] font-bold tracking-wider text-sm border border-[#C9BEFF] hover:bg-[#FFDBFD] transition-colors rounded-full">
                  See live examples <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {builderOpen && (
        <div className="fixed inset-0 z-[300] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl bg-[#FFDBFD] border border-[#C9BEFF] rounded-2xl overflow-hidden">
            <button
              onClick={() => setBuilderOpen(false)}
              className="absolute right-3 top-3 w-9 h-9 border border-[#C9BEFF] text-[#6367FF] hover:text-[#6367FF] hover:border-[#C9BEFF] transition-colors rounded-full"
              aria-label="Close live preview"
            >
              <X className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={() => setBuilderOpen(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-[#6367FF] text-[#FFFFFF] hover:bg-[#8494FF] transition-colors rounded-full bg-[#6367FF]"
              aria-label="Close live preview"
            >
              <X className="w-4 h-4 mx-auto" />
            </button>
            <div className="max-h-[85vh] overflow-y-auto">
              <LivePreviewBuilder inModal />
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      {/* Curve divider: CTA -> Footer */}
      <div className="relative h-6 bg-[#6367FF] overflow-hidden">
        <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,70 C260,10 520,10 780,70 C1040,130 1250,130 1440,70 L1440,120 L0,120 Z" fill="#333" />
        </svg>
      </div>

      <footer className="bg-[#333] py-8 px-5 md:px-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#fff] flex items-center justify-center">
              <Link2 className="w-3 h-3 text-[#333]" />
            </div>
            <span className="font-display text-xl text-[#fff] tracking-widest">linkstore</span>
          </div>

          <ul className="flex gap-0 border border-[#333] bg-[#333]">
            {[
              { label: 'privacy', href: '/privacy' },
              { label: 'terms', href: '/terms' },
              { label: 'refunds', href: '/refunds' },
              { label: 'contact', href: '/contact' },
            ].map((item, i) => (
              <li key={item.label} className={i > 0 ? 'border-l border-[#333]' : ''}>
                <Link href={item.href} className="block text-[11px] text-[#fff] hover:text-[#000000] px-4 py-2.5 font-mono tracking-wider transition-colors">{item.label}</Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5 text-[11px] text-[#fff] font-mono">
            made with <Heart className="w-3 h-3 text-[#6367FF] fill-[#6367FF]" /> by linkstore
          </div>
        </div>
      </footer>

      <style jsx global>{`
        html { scroll-behavior: smooth; }
        * { -webkit-font-smoothing: antialiased; }
        .font-display { font-family: var(--font-display); }
        .font-body { font-family: var(--font-body); }
        .font-mono { font-family: var(--font-mono); }

        .outlined-text {
          -webkit-text-stroke: 1px #fff;
          color: #FFDBFD;
        }
        .outlined-text-light {
          -webkit-text-stroke: 1px #C9BEFF;
          color: transparent;
        }

        .animate-marquee {
          animation: marquee 45s linear infinite;
          will-change: transform;
        }
        .animate-marquee:hover { animation-play-state: paused; }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .animate-ticker {
          animation: ticker 40s linear infinite;
          will-change: transform;
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-marquee,
          .animate-ticker {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default LinkstoreLanding;
