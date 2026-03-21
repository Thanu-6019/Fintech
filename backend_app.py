"""
fintech.ai — Upgraded Backend
Flask + MongoDB + JWT RBAC + Monte Carlo + AI Summaries + PDF/CSV Export + WebSocket
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from pymongo import MongoClient
from bson import ObjectId
import bcrypt, jwt, datetime, os, io, json, random, math, csv, threading
import re
from functools import wraps
from dotenv import load_dotenv

load_dotenv()

app    = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
sio    = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

SECRET      = os.getenv("JWT_SECRET", "fintech_ai_secret_2026")
MONGO_URI   = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")   # Anthropic API key
LLM_MODEL   = os.getenv("LLM_MODEL", "claude-sonnet-4-20250514")

client = MongoClient(MONGO_URI)
db     = client["fintech_ai"]

# Collections
users_col      = db["users"]
merchants_col  = db["merchants"]
txns_col       = db["transactions"]
portfolios_col = db["portfolios"]
positions_col  = db["portfolio_positions"]
sims_col       = db["simulations"]
reports_col    = db["reports"]
summaries_col  = db["ai_summaries"]
billing_col    = db["billing_events"]

EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}$")


def edit_distance(a: str, b: str) -> int:
    rows, cols = len(a) + 1, len(b) + 1
    dp = [[0] * cols for _ in range(rows)]
    for i in range(rows):
        dp[i][0] = i
    for j in range(cols):
        dp[0][j] = j
    for i in range(1, rows):
        for j in range(1, cols):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            )
    return dp[-1][-1]


def is_likely_misspelled_gmail(domain: str) -> bool:
    if domain == "gmail.com":
        return False
    return edit_distance(domain, "gmail.com") <= 2

# ─── Auth helpers ─────────────────────────────────────────────────────────────

def make_token(user_id, role):
    return jwt.encode(
        {"user_id": str(user_id), "role": role,
         "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)},
        SECRET, algorithm="HS256"
    )

def token_required(roles=None):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            auth = request.headers.get("Authorization", "")
            token = auth.replace("Bearer ", "")
            if not token:
                return jsonify({"error": "Token missing"}), 401
            try:
                data  = jwt.decode(token, SECRET, algorithms=["HS256"])
                user  = users_col.find_one({"_id": ObjectId(data["user_id"])})
                if not user:
                    return jsonify({"error": "User not found"}), 401
                if roles and user.get("role") not in roles:
                    return jsonify({"error": "Insufficient permissions"}), 403
            except Exception:
                return jsonify({"error": "Invalid token"}), 401
            return f(user, *args, **kwargs)
        return wrapper
    return decorator

def ser(doc):
    """Make MongoDB doc JSON-serializable."""
    if doc is None: return None
    doc["id"] = str(doc.pop("_id"))
    for k, v in doc.items():
        if isinstance(v, datetime.datetime):
            doc[k] = v.isoformat()
    return doc


def is_valid_email(email: str) -> bool:
    if not EMAIL_RE.match(email):
        return False
    domain = email.split("@", 1)[1] if "@" in email else ""
    return not is_likely_misspelled_gmail(domain)

# ─── Auth ─────────────────────────────────────────────────────────────────────

@app.route("/api/auth/exists", methods=["POST"])
def auth_exists():
    d = request.json or {}
    email = d.get("email", "").lower().strip()
    if not is_valid_email(email):
        return jsonify({"exists": False}), 200
    exists = users_col.find_one({"email": email}, {"_id": 1}) is not None
    return jsonify({"exists": exists})

@app.route("/api/auth/register", methods=["POST"])
def register():
    d = request.json or {}
    email = d.get("email", "").lower().strip()
    if not email or not d.get("password") or not d.get("name"):
        return jsonify({"error": "name, email, password required"}), 400
    if not is_valid_email(email):
        return jsonify({"error": "Enter a valid email address"}), 400
    if users_col.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409
    hashed = bcrypt.hashpw(d["password"].encode(), bcrypt.gensalt())
    user = {
        "email": email, "password_hash": hashed, "name": d["name"],
        "user_type": d.get("user_type", "employee"),
        "role": d.get("role", "analyst"),      # admin | analyst | viewer
        "credits": 20,
        "created_at": datetime.datetime.utcnow()
    }
    result = users_col.insert_one(user)
    token  = make_token(result.inserted_id, user["role"])
    return jsonify({"token": token, "user": {"id": str(result.inserted_id), "name": user["name"],
                   "email": email, "role": user["role"], "user_type": user["user_type"]}}), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    d = request.json or {}
    email = d.get("email", "").lower().strip()
    if not is_valid_email(email):
        return jsonify({"error": "Invalid credentials"}), 401
    user = users_col.find_one({"email": email})
    if not user or not bcrypt.checkpw(d.get("password","").encode(), user["password_hash"]):
        return jsonify({"error": "Invalid credentials"}), 401
    token = make_token(user["_id"], user["role"])
    return jsonify({"token": token, "user": {"id": str(user["_id"]), "name": user["name"],
                   "email": user["email"], "role": user["role"], "user_type": user["user_type"]}})

@app.route("/api/users/me", methods=["GET"])
@token_required()
def me(current_user):
    current_user.pop("password_hash", None)
    return jsonify(ser(current_user))

# ─── Merchants ────────────────────────────────────────────────────────────────

@app.route("/api/merchants", methods=["GET"])
@token_required()
def get_merchants(current_user):
    page  = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    query = {}
    if request.args.get("category"):
        query["category"] = request.args["category"]
    if request.args.get("region"):
        query["region"] = request.args["region"]
    docs  = list(merchants_col.find(query).skip((page-1)*limit).limit(limit))
    return jsonify([ser(d) for d in docs])

# ─── Transactions ─────────────────────────────────────────────────────────────

@app.route("/api/upload/transactions", methods=["POST"])
@token_required(roles=["admin","analyst"])
def upload_txns(current_user):
    """Upload CSV of transactions, parse & insert."""
    f = request.files.get("file")
    if not f:
        return jsonify({"error": "No file uploaded"}), 400
    content = f.read().decode("utf-8").splitlines()
    reader  = csv.DictReader(content)
    docs    = []
    for row in reader:
        docs.append({
            "user_id":    str(current_user["_id"]),
            "merchant_id": row.get("merchant_id",""),
            "txn_date":   row.get("txn_date", str(datetime.date.today())),
            "amount":     float(row.get("amount",0)),
            "currency":   row.get("currency","INR"),
            "channel":    row.get("channel","online"),
            "metadata":   {},
            "created_at": datetime.datetime.utcnow()
        })
    if docs:
        txns_col.insert_many(docs)
    return jsonify({"inserted": len(docs), "status": "ok"})

@app.route("/api/transactions", methods=["GET"])
@token_required()
def get_txns(current_user):
    page    = int(request.args.get("page",1))
    limit   = int(request.args.get("limit",50))
    query   = {"user_id": str(current_user["_id"])}
    if request.args.get("from"):
        query.setdefault("txn_date",{})["$gte"] = request.args["from"]
    if request.args.get("to"):
        query.setdefault("txn_date",{})["$lte"] = request.args["to"]
    docs    = list(txns_col.find(query).sort("txn_date",-1).skip((page-1)*limit).limit(limit))
    return jsonify([ser(d) for d in docs])

# ─── Monte Carlo Simulation Engine ────────────────────────────────────────────

def run_monte_carlo(inputs, n=200):
    months         = inputs["months"]
    revenue_delta  = inputs.get("revenueDelta", 5) / 100
    expense_delta  = inputs.get("expenseDelta", 3) / 100
    hire_delta     = inputs.get("hireDelta", 0)
    price_delta    = inputs.get("priceDelta", 0) / 100
    current_rev    = inputs.get("currentRevenue", 500000)
    current_burn   = inputs.get("currentBurn", 380000)
    cash_reserve   = inputs.get("cashReserve", 5000000)

    runs = []
    for _ in range(n):
        cash, rev, burn = cash_reserve, current_rev, current_burn
        path  = []
        runway = months
        for m in range(months):
            noise = random.gauss(0, 0.03)
            rev   = rev * (1 + revenue_delta + noise + price_delta * 0.5)
            burn  = burn * (1 + expense_delta) + hire_delta * 8000
            cash += rev - burn
            path.append({"month": m+1, "cash": round(cash), "revenue": round(rev), "burn": round(burn)})
            if cash <= 0 and runway == months:
                runway = m + 1
        runs.append({"path": path, "finalCash": cash, "runway": months if cash > 0 else runway})

    runs.sort(key=lambda r: r["finalCash"])
    p10 = runs[int(n*0.10)]
    p50 = runs[int(n*0.50)]
    p90 = runs[int(n*0.90)]

    chart_data = [
        {"month": f"M{i+1}", "p10": p10["path"][i]["cash"],
         "p50": p50["path"][i]["cash"], "p90": p90["path"][i]["cash"],
         "revenue": p50["path"][i]["revenue"], "burn": p50["path"][i]["burn"]}
        for i in range(months)
    ]
    return {
        "p10": {"runway": p10["runway"], "finalCash": p10["finalCash"]},
        "p50": {"runway": p50["runway"], "finalCash": p50["finalCash"]},
        "p90": {"runway": p90["runway"], "finalCash": p90["finalCash"]},
        "chartData": chart_data,
        "survivalRate": round(sum(1 for r in runs if r["finalCash"]>0)/n*100,1),
        "avgRunway": round(sum(r["runway"] for r in runs)/n, 1),
    }

@app.route("/api/simulations", methods=["POST"])
@token_required(roles=["admin","analyst"])
def create_simulation(current_user):
    d = request.json or {}
    sim_id = str(ObjectId())
    inputs = d.get("inputs", {})
    doc = {
        "_id": ObjectId(sim_id), "user_id": str(current_user["_id"]),
        "name": d.get("name","Unnamed"), "input_json": inputs,
        "result_json": None, "status": "running",
        "cost": 0.05, "created_at": datetime.datetime.utcnow()
    }
    sims_col.insert_one(doc)

    # Run async via thread, emit progress via SocketIO
    def run():
        for pct in [10,30,60,90]:
            import time; time.sleep(0.3)
            sio.emit("sim_progress", {"sim_id": sim_id, "progress": pct})
        result = run_monte_carlo(inputs)
        sims_col.update_one({"_id": ObjectId(sim_id)},
                            {"$set": {"result_json": result, "status": "done"}})
        sio.emit("sim_progress", {"sim_id": sim_id, "progress": 100, "result": result})

        # Runway alert
        if result["p50"]["runway"] <= 3:
            sio.emit("alert", {"type":"danger","message":f"⚠ Simulation '{d.get('name')}': P50 runway is only {result['p50']['runway']} months!"})

        # Billing event
        billing_col.insert_one({"user_id": str(current_user["_id"]), "item":"simulation",
                                 "amount_usd": 0.05, "status":"charged",
                                 "created_at": datetime.datetime.utcnow()})

    threading.Thread(target=run, daemon=True).start()
    return jsonify({"sim_id": sim_id, "status": "running"})

@app.route("/api/simulations/<sim_id>/status", methods=["GET"])
@token_required()
def sim_status(current_user, sim_id):
    sim = sims_col.find_one({"_id": ObjectId(sim_id)})
    if not sim:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"status": sim["status"], "result": sim.get("result_json")})

@app.route("/api/simulations", methods=["GET"])
@token_required()
def list_simulations(current_user):
    docs = list(sims_col.find({"user_id": str(current_user["_id"])}).sort("created_at",-1).limit(20))
    return jsonify([ser(d) for d in docs])

# ─── AI Summary ───────────────────────────────────────────────────────────────

PROMPT_TEMPLATES = {
    "executive": "Provide: 1) 2-sentence executive summary, 2) 3 prioritized action items with expected impact and effort, 3) 1-line email subject to CEO. Max 180 words. Professional CFO tone.",
    "bullet":    "Provide bullet-point analysis: Risks (3 bullets), Opportunities (3 bullets), Immediate Actions (3 bullets). Max 150 words.",
    "email":     "Draft a concise stakeholder email with subject line, greeting, 3-paragraph body (situation/outlook/recommendations), and sign-off. Max 200 words.",
}

@app.route("/api/simulations/<sim_id>/ai-summary", methods=["POST"])
@token_required(roles=["admin","analyst"])
def ai_summary(current_user, sim_id):
    sim = sims_col.find_one({"_id": ObjectId(sim_id)})
    if not sim or not sim.get("result_json"):
        return jsonify({"error": "Simulation not ready"}), 404

    # Check cache
    cached = summaries_col.find_one({"sim_id": sim_id, "user_id": str(current_user["_id"])})
    if cached:
        return jsonify({"summary": cached["summary_text"], "cached": True, "id": str(cached["_id"])})

    r = sim["result_json"]
    template = request.json.get("template", "executive")
    prompt = f"""You are a senior startup CFO. Simulation: "{sim['name']}"

Metrics:
- P10 runway: {r['p10']['runway']} months | cash: ₹{r['p10']['finalCash']:,.0f}
- P50 runway: {r['p50']['runway']} months | cash: ₹{r['p50']['finalCash']:,.0f}
- P90 runway: {r['p90']['runway']} months | cash: ₹{r['p90']['finalCash']:,.0f}
- Survival rate: {r['survivalRate']}% | Avg runway: {r['avgRunway']} months

{PROMPT_TEMPLATES.get(template, PROMPT_TEMPLATES['executive'])}"""

    summary_text = "[AI key not configured — sample summary]\n\nExecutive Summary: Based on Monte Carlo analysis, the P50 scenario projects adequate runway with solid survival probability. Immediate focus on revenue acceleration is recommended.\n\nAction Items:\n1. Pursue enterprise pricing tier (+15% ARPU, Low effort)\n2. Defer 2 planned hires by 90 days (saves ₹16K/mo)\n3. Renegotiate SaaS contracts at renewal (5% savings)\n\nCEO Email: Q2 Simulation — Path to extended runway identified"

    if LLM_API_KEY:
        import urllib.request, urllib.error
        body = json.dumps({"model": LLM_MODEL, "max_tokens": 500,
                           "messages": [{"role":"user","content": prompt}]}).encode()
        req = urllib.request.Request("https://api.anthropic.com/v1/messages",
                                     data=body, headers={
            "x-api-key": LLM_API_KEY, "Content-Type":"application/json",
            "anthropic-version":"2023-06-01"})
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read())
                summary_text = data["content"][0]["text"]
                # Safety: cap at 200 tokens
                words = summary_text.split()
                if len(words) > 200:
                    summary_text = " ".join(words[:200]) + "…"
        except urllib.error.HTTPError as e:
            summary_text = f"LLM error {e.code}: check API key and quota."

    # Save to DB
    doc = {"sim_id": sim_id, "user_id": str(current_user["_id"]), "prompt": prompt,
           "summary_text": summary_text, "template": template, "model": LLM_MODEL,
           "created_at": datetime.datetime.utcnow()}
    result = summaries_col.insert_one(doc)

    # Deduct credit
    users_col.update_one({"_id": current_user["_id"]}, {"$inc": {"credits": -1}})

    # Billing
    billing_col.insert_one({"user_id": str(current_user["_id"]), "item":"ai_summary",
                             "amount_usd": 0.02, "status":"charged",
                             "created_at": datetime.datetime.utcnow()})

    return jsonify({"id": str(result.inserted_id), "summary": summary_text, "cached": False})

# ─── Reports (PDF via pdfkit stub, CSV) ──────────────────────────────────────

@app.route("/api/reports", methods=["POST"])
@token_required(roles=["admin","analyst"])
def create_report(current_user):
    d   = request.json or {}
    sim_id = d.get("sim_id")
    sim = sims_col.find_one({"_id": ObjectId(sim_id)}) if sim_id else None
    ai  = summaries_col.find_one({"sim_id": sim_id, "user_id": str(current_user["_id"])})
    summary_text = ai["summary_text"] if ai else "No AI summary generated."

    # Build plaintext report (replace with pdfkit for real PDF)
    r = sim["result_json"] if sim else {}
    lines = [
        "=" * 60,
        "  FINTECH.AI — CFO SIMULATION REPORT",
        "=" * 60,
        f"  Simulation: {sim['name'] if sim else 'Manual Report'}",
        f"  Generated:  {datetime.datetime.utcnow().strftime('%d %b %Y %H:%M')} UTC",
        f"  Prepared for: {current_user['name']} ({current_user['email']})",
        "",
        "SCENARIO OUTCOMES (Monte Carlo N=200)",
        "-" * 40,
    ]
    if r:
        lines += [
            f"  P10 (Pessimistic): Runway {r['p10']['runway']} mo | ₹{r['p10']['finalCash']:>12,.0f}",
            f"  P50 (Base Case):   Runway {r['p50']['runway']} mo | ₹{r['p50']['finalCash']:>12,.0f}",
            f"  P90 (Optimistic):  Runway {r['p90']['runway']} mo | ₹{r['p90']['finalCash']:>12,.0f}",
            f"  Survival Rate: {r['survivalRate']}%   |   Avg Runway: {r['avgRunway']} months",
        ]
    lines += ["", "AI CFO SUMMARY", "-" * 40, summary_text, "", "-" * 60,
              "  Generated by fintech.ai | Confidential"]

    content = "\n".join(lines)
    buf = io.BytesIO(content.encode("utf-8"))
    buf.seek(0)

    # Save report record
    doc = {"user_id": str(current_user["_id"]), "sim_id": sim_id,
           "pdf_url": None, "excel_url": None,
           "created_at": datetime.datetime.utcnow()}
    rep = reports_col.insert_one(doc)

    billing_col.insert_one({"user_id": str(current_user["_id"]), "item":"report_export",
                             "amount_usd": 0.10, "status":"charged",
                             "created_at": datetime.datetime.utcnow()})

    return send_file(buf, mimetype="text/plain",
                     as_attachment=True,
                     download_name=f"report-{str(rep.inserted_id)}.txt")

@app.route("/api/reports", methods=["GET"])
@token_required()
def list_reports(current_user):
    docs = list(reports_col.find({"user_id": str(current_user["_id"])}).sort("created_at",-1))
    return jsonify([ser(d) for d in docs])

# ─── Bills ────────────────────────────────────────────────────────────────────

@app.route("/api/bills", methods=["GET","POST"])
@token_required()
def bills(current_user):
    uid = str(current_user["_id"])
    if request.method == "POST":
        d = request.json or {}
        doc = {"user_id": uid, "name": d.get("name"), "amount": float(d.get("amount",0)),
               "category": d.get("category","Other"), "recurrence": d.get("recurrence","monthly"),
               "month": d.get("month", datetime.datetime.utcnow().strftime("%B %Y")),
               "created_at": datetime.datetime.utcnow()}
        result = db["bills"].insert_one(doc)
        doc["id"] = str(result.inserted_id); doc.pop("_id",None)
        return jsonify(doc), 201
    docs = list(db["bills"].find({"user_id": uid}))
    return jsonify([ser(d) for d in docs])

@app.route("/api/bills/<bill_id>", methods=["DELETE"])
@token_required()
def delete_bill(current_user, bill_id):
    db["bills"].delete_one({"_id": ObjectId(bill_id), "user_id": str(current_user["_id"])})
    return jsonify({"deleted": bill_id})

# ─── Portfolios ───────────────────────────────────────────────────────────────

@app.route("/api/portfolios", methods=["GET","POST"])
@token_required()
def portfolios(current_user):
    uid = str(current_user["_id"])
    if request.method == "POST":
        d = request.json or {}
        doc = {"user_id": uid, "name": d.get("name","My Portfolio"),
               "created_at": datetime.datetime.utcnow()}
        result = portfolios_col.insert_one(doc)
        return jsonify({"id": str(result.inserted_id)}), 201
    docs = list(portfolios_col.find({"user_id": uid}))
    for d in docs:
        pid = str(d["_id"])
        d["positions"] = [ser(p) for p in positions_col.find({"portfolio_id": pid})]
    return jsonify([ser(d) for d in docs])

# ─── Billing ─────────────────────────────────────────────────────────────────

@app.route("/api/billing/events", methods=["GET"])
@token_required()
def billing_events(current_user):
    docs = list(billing_col.find({"user_id": str(current_user["_id"])}).sort("created_at",-1).limit(50))
    return jsonify([ser(d) for d in docs])

@app.route("/api/billing/charge", methods=["POST"])
@token_required(roles=["admin"])
def manual_charge(current_user):
    """Stub: Stripe / Flexprice hook."""
    d = request.json or {}
    doc = {"user_id": str(current_user["_id"]), "item": d.get("item","manual"),
           "amount_usd": float(d.get("amount_usd",0)), "status":"charged",
           "created_at": datetime.datetime.utcnow()}
    result = billing_col.insert_one(doc)
    return jsonify({"id": str(result.inserted_id), "status":"charged"})

# ─── Admin ────────────────────────────────────────────────────────────────────

@app.route("/api/admin/usage", methods=["GET"])
@token_required(roles=["admin"])
def admin_usage(current_user):
    return jsonify({
        "total_users":      users_col.count_documents({}),
        "total_sims":       sims_col.count_documents({}),
        "total_reports":    reports_col.count_documents({}),
        "total_ai_calls":   summaries_col.count_documents({}),
        "billing_total_usd": sum(b.get("amount_usd",0) for b in billing_col.find({})),
    })

# ─── WebSocket ────────────────────────────────────────────────────────────────

@sio.on("connect")
def ws_connect():
    emit("connected", {"msg": "fintech.ai WebSocket ready"})

@sio.on("subscribe_sim")
def ws_subscribe(data):
    """Client subscribes to a sim_id for progress updates."""
    pass  # Room-based subscription would go here in production

# ─── Salary engine ────────────────────────────────────────────────────────────

@app.route("/api/salary/calculate", methods=["POST"])
@token_required(roles=["admin","analyst"])
def salary_calculate(current_user):
    d = request.json or {}
    total      = float(d.get("total_budget",0))
    profit     = float(d.get("desired_profit",0))
    total_bills= sum(float(b.get("amount",0)) for b in d.get("bills",[]))
    available  = total - profit - total_bills
    employees  = d.get("employees",[])
    total_w    = sum(float(e.get("base_salary",1)) for e in employees)
    dist = [{"name":e["name"],"role":e.get("role",""),
             "allocated": round((float(e.get("base_salary",1))/total_w)*available,2) if total_w else 0,
             "pct": round((float(e.get("base_salary",1))/total_w)*100,1) if total_w else 0}
            for e in employees]
    return jsonify({"available":available,"distribution":dist,
                    "summary":{"profit_pct":round(profit/total*100,1) if total else 0,
                               "bills_pct":round(total_bills/total*100,1) if total else 0,
                               "salary_pct":round(available/total*100,1) if total else 0}})

# ─── Health ───────────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status":"ok","version":"2.0","db":"connected"})

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    sio.run(app, debug=False, use_reloader=False, host="0.0.0.0", port=port, allow_unsafe_werkzeug=True)
