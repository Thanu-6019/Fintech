import { rand } from "./utils";

export const SEED_MERCHANTS = Array.from({length:12},(_,i)=>({
  id:i+1,
  name:["Swiggy","Zomato","Razorpay","AWS","Zoho","Flipkart","Meesho","CRED","Groww","Zerodha","PhonePe","Paytm"][i],
  category:["Food","Food","Fintech","Cloud","SaaS","E-commerce","E-commerce","Fintech","Investing","Trading","Payments","Payments"][i],
  region:["MH","KA","MH","Global","TN","KA","HR","MH","MH","KA","HR","UP"][i],
  revenue: Math.round(rand(2,18)*100000),
  growth: parseFloat(rand(-8,35).toFixed(1)),
  txns: Math.round(rand(800,9000)),
}));

export const SEED_PORTFOLIOS = [
  {id:1,name:"Growth Portfolio",value:850000,gain:12.4,positions:[
    {symbol:"RELIANCE",shares:50,price:2890,sector:"Energy"},
    {symbol:"INFY",shares:120,price:1680,sector:"IT"},
    {symbol:"HDFC",shares:30,price:3200,sector:"Banking"},
    {symbol:"TCS",shares:25,price:4100,sector:"IT"},
  ]},
  {id:2,name:"Dividend Picks",value:320000,gain:6.8,positions:[
    {symbol:"ITC",shares:500,price:480,sector:"FMCG"},
    {symbol:"COALINDIA",shares:200,price:520,sector:"Mining"},
  ]},
];
