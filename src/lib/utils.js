export const fmt  = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
export const fmtK = n => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(1)}K` : fmt(n);
export const pct  = (p,t) => t>0 ? ((p/t)*100).toFixed(1) : "0.0";
export const rand  = (min,max) => Math.random()*(max-min)+min;
export const clamp = (v,lo,hi) => Math.min(hi,Math.max(lo,v));
export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
