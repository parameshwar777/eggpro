import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const url = new URL(req.url);
  const p = url.searchParams;

  const key = p.get("key") || "";
  const orderId = p.get("orderId") || "";
  const amount = p.get("amount") || "0";
  const dbOrderId = p.get("dbOrderId") || "";
  const email = p.get("email") || "";
  const phone = p.get("phone") || "";
  const desc = p.get("desc") || "Order";
  const extraB64 = p.get("extra") || "";

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const verifyUrl = `${SUPABASE_URL}/functions/v1/verify-payment`;

  // Safely encode config as JSON for embedding in HTML
  const config = JSON.stringify({
    key, orderId, amount: parseInt(amount), dbOrderId, email, phone, desc, verifyUrl, anonKey: ANON_KEY, extraB64
  }).replace(/<\//g, "<\\/").replace(/<!--/g, "");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>EggPro Payment</title>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#FFF8E7}
.c{text-align:center;padding:2rem;max-width:400px}
.sp{width:48px;height:48px;border:4px solid #fde68a;border-top:4px solid #F59E0B;border-radius:50%;animation:s 0.8s linear infinite;margin:0 auto 20px}
@keyframes s{to{transform:rotate(360deg)}}
.m{font-size:20px;font-weight:600;color:#1a1a1a;margin-bottom:8px}
.sub{font-size:14px;color:#666;line-height:1.5}
.ok{color:#16a34a}.er{color:#dc2626}
.b{background:#F59E0B;color:#fff;border:none;padding:16px 48px;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;margin-top:24px;display:inline-block;text-decoration:none}
.b:active{transform:scale(0.97);opacity:0.9}
.logo{font-size:28px;margin-bottom:24px}
</style>
</head>
<body>
<div class="c" id="ct">
<div class="logo">🥚</div>
<div class="sp"></div>
<p class="m">Opening payment...</p>
<p class="sub">Please complete the payment in the popup</p>
</div>
<script>
(function(){
var cfg=${config};
var extra={};
try{if(cfg.extraB64)extra=JSON.parse(atob(cfg.extraB64))}catch(e){}
var rzp=new Razorpay({
key:cfg.key,amount:cfg.amount,currency:"INR",name:"EggPro",
description:cfg.desc,order_id:cfg.orderId,
handler:function(r){
document.getElementById('ct').innerHTML='<div class="logo">🥚</div><div class="sp"></div><p class="m">Verifying payment...</p><p class="sub">Please wait, do not close this page</p>';
var body=Object.assign({razorpay_order_id:r.razorpay_order_id,razorpay_payment_id:r.razorpay_payment_id,razorpay_signature:r.razorpay_signature,orderId:cfg.dbOrderId},extra);
fetch(cfg.verifyUrl,{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.anonKey,'Authorization':'Bearer '+cfg.anonKey},body:JSON.stringify(body)})
.then(function(res){if(!res.ok)throw new Error();return res.json()})
.then(function(){document.getElementById('ct').innerHTML='<div class="logo">🥚</div><p class="m ok">\\u2705 Payment Successful!</p><p class="sub">Your order has been confirmed.<br>You can now return to the app.</p><button class="b" onclick="window.close()">Return to App</button><p class="sub" style="margin-top:12px;font-size:12px">If the button doesn\\'t work, simply close this tab.</p>'})
.catch(function(){document.getElementById('ct').innerHTML='<div class="logo">🥚</div><p class="m er">\\u274C Verification failed</p><p class="sub">If money was deducted, it will be refunded.<br>Please contact support.</p><button class="b" onclick="window.close()">Close</button>'});
},
prefill:{email:cfg.email,contact:cfg.phone},
modal:{escape:false,ondismiss:function(){document.getElementById('ct').innerHTML='<div class="logo">🥚</div><p class="m">Payment cancelled</p><p class="sub">You can close this page and try again from the app.</p><button class="b" onclick="window.close()">Close</button>'}},
theme:{color:"#F59E0B"}
});
rzp.open();
})();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});
