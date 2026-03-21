"""
seed.py — Populate MongoDB with sample data for fintech.ai
Run: python seed.py
"""
from pymongo import MongoClient
import datetime, random, bcrypt

MONGO_URI = "mongodb://localhost:27017/"
client    = MongoClient(MONGO_URI)
db        = client["fintech_ai"]

print("🌱 Seeding fintech.ai database…")

# ─── Users ────────────────────────────────────────────────────────────────────
db["users"].drop()
users = [
    {"name":"Rahul Sharma","email":"admin@fintech.ai","role":"admin","user_type":"business","credits":50},
    {"name":"Priya Mehta","email":"analyst@fintech.ai","role":"analyst","user_type":"business","credits":20},
    {"name":"Vikram Das","email":"viewer@fintech.ai","role":"viewer","user_type":"employee","credits":5},
    {"name":"Sneha Iyer","email":"analyst2@fintech.ai","role":"analyst","user_type":"business","credits":20},
    {"name":"Karan Bose","email":"employee@fintech.ai","role":"viewer","user_type":"employee","credits":5},
]
for u in users:
    u["password_hash"] = bcrypt.hashpw(b"demo123", bcrypt.gensalt())
    u["created_at"] = datetime.datetime.utcnow()
result_users = db["users"].insert_many(users)
print(f"  ✅ {len(users)} users created (password: demo123)")

# ─── Merchants ────────────────────────────────────────────────────────────────
db["merchants"].drop()
NAMES     = ["Swiggy","Zomato","Razorpay","AWS","Zoho","Flipkart","Meesho","CRED","Groww","Zerodha",
             "PhonePe","Paytm","Dunzo","Nykaa","BigBasket","Urban Ladder","Ola","Rapido","PolicyBazaar",
             "Practo","CureFit","Vedantu","BYJUs","Unacademy","Lenskart","CarDekho","Droom","OYO",
             "MakeMyTrip","Yatra","Cleartrip","GoIbibo","Quikr","OLX","Housing","Magicbricks",
             "JustDial","IndiaMART","TradeIndia","Udaan","Jumbotail","Ninjacart","WayCool","Dehaat",
             "AgroStar","KhataBook","OkCredit","BharatPe","RazorpayX","InstaMojo",
             "Cashfree","PayU","CCAvenue","EaseBuzz","Airtel Money","Jio Pay","Amazon Pay",
             "Google Pay","BHIM","Mobikwik","FreeCharge","Citrus","Udio","mPaisa",
             "FinShell","True Balance","SlicePay","LazyPay","Simpl","ZestMoney",
             "KreditBee","MoneyTap","CASHe","EarlySalary","FlexiLoans","Lendingkart",
             "Capital Float","NeoGrowth","Aye Finance","FaircentSME","Kissht","Stashfin",
             "Avail Finance","Niro","Jupiter","Fi Money","Niyo","Open","RazorpayX","Tide",
             "Happay","Fyle","EnKash","YoloMoney","Walrus","Qube Money",
             "Smallcase","Cube Wealth","Goalwise","Kuvera","Groww PMS","Dezerv",
             "Scripbox","FundsIndia","Paytm Money","ET Money","IIFL Sec","5paisa",
             "Upstox","AngelBroking","Motilal Oswal","HDFC Sec","Kotak Sec","Sharekhan",
             "ICICI Direct","Geojit","Axis Direct","SBI Sec","Edelweiss","Anand Rathi",
             "Aditya Birla Mon","UTI AMC","SBI MF","Nippon India","Mirae","DSP","Canara Rob",
             "Sundaram MF","IDFC MF","Invesco","Franklin","Tata MF","Mahindra MF","Quantum",
             "PPFAS","Axis MF","Kotak MF","HDFC MF","ICICI Pru","Birla SL","Reliance MF",
             "Edelweiss MF","Motilal MF","L&T MF","BOI AXA","Union MF","LIC MF","JM MF",
             "Principal MF","BNP Paribas","Baroda MF","Shriram MF","Sahara MF","Peerless MF",
             "Taurus MF","Escorts MF","JM Financial","Quantum AMC","Essel MF","IIFL AMC",
             "Samco","Trustline","Profitmart","KRChoksey","Nirmal Bang","Mangal Keshav",
             "SMC Global","Karvy","Networth Direct","Acumen Capital","Inventure","Centrum",
             "Hem Securities","Emkay","Religare","Systematix","Batlivala","Choice Int",
             "Destimoney","Achiievers Equities","Ashlar Sec","Almondz","SMIFS","LKP Sec",
             "Kotak PMS","ICICI PMS","SBI PMS","Axis PMS","HDFC PMS","Motilal PMS",
             "Alchemy","Marcellus","Saurabh Mukherjea","DSP PMS","360 ONE","Prabhudas","BNK",
             "IIFL Wealth","Anand Rathi W","Centrum W","JM W","Karvy W","CAMS","KFintech",
             "CDSL","NSDL","BSE","NSE","MCX","NCDEX","RBI","SEBI","IRDAI","PFRDA","NPS Trust",
             "UTI Retirement","SBI Pension","LIC Pension","Kotak Pension","HDFC Pension",
             "Reliance Pension","ICICI Pension","Aditya Birla Pension","Birla Sun Life",
             "Max Life","Bajaj Allianz","Tata AIA","HDFC Life","SBI Life","Axis Max"]
CATS    = ["Fintech","E-commerce","Cloud","SaaS","Food","Transport","Healthcare","EdTech","Investing"]
REGIONS = ["MH","KA","TN","DL","HR","UP","GJ","WB","RJ","AP"]
merchants_seed = []
for i, nm in enumerate(NAMES[:200]):
    merchants_seed.append({
        "name": nm, "category": CATS[i%len(CATS)], "region": REGIONS[i%len(REGIONS)],
        "revenue": round(random.uniform(50000, 5000000)),
        "growth": round(random.uniform(-15,40),1),
        "txns": random.randint(100, 20000),
        "created_at": datetime.datetime.utcnow()
    })
db["merchants"].insert_many(merchants_seed)
print(f"  ✅ {len(merchants_seed)} merchants created")

# ─── Transactions (50k over 24 months) ───────────────────────────────────────
db["transactions"].drop()
CHANNELS = ["online","pos","mobile","atm"]
CARDS    = ["visa","mastercard","rupay","amex"]
uid      = str(result_users.inserted_ids[0])
txn_batch = []
start_date = datetime.datetime(2024, 1, 1)
merch_ids  = [str(m["_id"]) for m in db["merchants"].find({},{"_id":1}).limit(50)]
for i in range(50000):
    days_offset = random.randint(0, 730)
    txn_date    = start_date + datetime.timedelta(days=days_offset)
    txn_batch.append({
        "merchant_id": random.choice(merch_ids),
        "user_id": uid,
        "txn_date": txn_date.strftime("%Y-%m-%d"),
        "amount": round(random.uniform(50, 250000), 2),
        "currency": "INR",
        "card_type": random.choice(CARDS),
        "channel": random.choice(CHANNELS),
        "created_at": txn_date,
        "metadata": {}
    })
    if len(txn_batch) == 5000:
        db["transactions"].insert_many(txn_batch)
        txn_batch = []
if txn_batch:
    db["transactions"].insert_many(txn_batch)
print(f"  ✅ 50,000 transactions created (24 months)")

# ─── Portfolios (20 sample) ───────────────────────────────────────────────────
db["portfolios"].drop()
db["portfolio_positions"].drop()
SYMBOLS = ["RELIANCE","INFY","TCS","HDFC","ICICIBANK","HCLTECH","BAJFINANCE","AXISBANK","LT","SBIN",
           "WIPRO","HINDUNILVR","ADANIENT","TATASTEEL","MARUTI","BAJAJFINSV","TITAN","NESTLEIND",
           "SUNPHARMA","DRREDDY","CIPLA","DIVISLAB","APOLLOHOSP","FORTIS","METROPOLIS",
           "ITC","BRITANNIA","DABUR","GODREJCP","MARICO","COLPAL","GILLETTE","PGHH","EMAMILTD",
           "COALINDIA","NTPC","POWERGRID","TATAPOWER","ADANIGREEN","RPOWER","TORNTPOWER"]
PORT_NAMES = ["Growth Portfolio","Blue Chip Mix","Dividend Kings","Tech Heavy","Balanced Fund",
              "Small Cap Bets","Mid Cap Stars","ESG Leaders","Infrastructure","Consumer Staples",
              "Pharma Focus","Banking Basket","IT Portfolio","FMCG Picks","Energy Play",
              "Auto Sector","Real Estate","Gold & Metals","International","Flexi Cap"]
for pi in range(20):
    port_doc = {"user_id": uid, "name": PORT_NAMES[pi],
                "created_at": datetime.datetime.utcnow()}
    port_id  = str(db["portfolios"].insert_one(port_doc).inserted_id)
    num_pos  = random.randint(3, 8)
    syms     = random.sample(SYMBOLS, num_pos)
    pos_docs = []
    for sym in syms:
        pos_docs.append({
            "portfolio_id": port_id, "symbol": sym,
            "shares": random.randint(5, 500),
            "avg_price": round(random.uniform(100, 5000), 2),
            "currency": "INR",
            "created_at": datetime.datetime.utcnow()
        })
    db["portfolio_positions"].insert_many(pos_docs)
print(f"  ✅ 20 portfolios with positions created")

print("\n🎉 Seed complete! Login: admin@fintech.ai / demo123")
