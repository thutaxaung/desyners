HEART = '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 5 6.4 5c2 0 3.6 1.2 4.4 2.6l1.2 1.8 1.2-1.8C14 6.2 15.6 5 17.6 5 21 5 23.1 8.4 21.6 11.8 19.5 16.4 12 21 12 21z"/></svg>'
CURSOR = '<svg viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7z" fill="#0b1b46" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>'

def icons(name):
    return {
        'msg': '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
        'ai': '<path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
        'sheet': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/>',
        'bell': '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    }[name]

def node(ic, b, s):
    return f'<div class="node"><div class="ic"><svg viewBox="0 0 24 24">{icons(ic)}</svg></div><b>{b}</b><span>{s}</span></div>'

def mocks(dark=False):
    d = ' dark' if dark else ''
    return {
'content': f'''<div class="mock m-content{d}" aria-hidden="true">
  <div class="card reel"><i></i></div>
  <div class="card phone"><div class="screen"><div class="who"><span class="av"></span><div style="flex:1"><div class="sk" style="width:60%;margin-bottom:.8cqw"></div><div class="sk" style="width:35%;height:1cqw"></div></div></div><div class="post">New arrivals ✨</div><div class="acts"><span class="heart">{HEART}</span>248 <span style="color:#8a97b5;font-weight:600">· 36 shares</span></div><div class="sk" style="width:90%;margin-bottom:.8cqw"></div><div class="sk" style="width:70%"></div></div></div>
  <div class="bub b1">+1.2K reach</div><div class="bub b2">♥ 248</div>
</div>''',
'chatbot': f'''<div class="mock m-chat{d}" aria-hidden="true">
  <div class="card win"><div class="top"><span class="av"></span><div>Desyners Bot<small>● Online · replies instantly</small></div></div>
  <div class="msgs"><div class="msg u">Do you deliver to Mandalay?</div><div class="msg b typing"><i></i><i></i><i></i></div><div class="msg b">Yes! 2–3 days. Shall I take your order?</div><div class="msg u">2 boxes please 🙏</div><div class="msg b typing"><i></i><i></i><i></i></div><div class="msg b"><span class="ok">✓ Order #1042 confirmed.</span> We'll message you when it ships.</div></div></div>
</div>''',
'automation': f'''<div class="mock m-flow{d}" aria-hidden="true">
  <div class="wire"></div><div class="fpulse"></div>
  <div class="frow">{node('msg','New message','Messenger')}{node('ai','AI replies','in Burmese')}{node('sheet','Order saved','Google Sheets')}{node('bell','Team notified','Viber')}</div>
  <div class="card count">Tasks automated this month: <b data-to="1284" data-tick="1">0</b></div>
</div>''',
'website': f'''<div class="mock m-web{d}" aria-hidden="true">
  <div class="card br"><div class="wbar"><i></i><i></i><i></i><span class="url">yourshop.com</span><span class="cart"><svg viewBox="0 0 24 24"><path d="M3 4h2l2.4 11h11L21 7H6.2"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/></svg><em>2</em></span></div>
  <div class="whero"><b>Shop the new collection</b><span>Free delivery in Yangon</span></div>
  <div class="wgrid"><div class="prod"><div class="img"></div><div class="sk"></div><div class="buy">Buy</div></div><div class="prod"><div class="img"></div><div class="sk"></div><div class="buy">Buy</div></div><div class="prod"><div class="img"></div><div class="sk"></div><div class="buy">Buy</div></div></div></div>
  <div class="wcursor">{CURSOR}</div>
</div>''',
'branding': f'''<div class="mock m-brand{d}" aria-hidden="true">
  <div class="card bc"><div class="flip"><div class="face front"><span class="mk"></span></div><div class="face back"><b>Your Brand</b><span>hello@yourbrand.com</span><span>09 000 000 000</span></div></div></div>
  <div class="sw"><i></i><i></i><i></i><i></i></div>
  <div class="card type"><b>Aa</b><div><div class="sk" style="margin-bottom:1cqw"></div><span>Primary typeface · Bold</span></div></div>
</div>''',
'training': f'''<div class="mock m-train{d}" aria-hidden="true">
  <div class="card slide"><small>LESSON 3 OF 8</small><b>AI for your business</b><div class="sk"></div><div class="sk"></div><div class="sk"></div><div class="prog"><i></i></div></div>
  <div class="people"><span class="p"></span><span class="p"></span><span class="p"></span><span class="p"></span></div>
  <div class="card cert"><span class="medal">★</span><b>AI Diploma</b><span>Certificate of completion</span></div>
</div>''',
'software': f'''<div class="mock m-dash{d}" aria-hidden="true">
  <div class="card app"><div class="side"><i></i><i></i><i></i><i></i></div><div class="main">
    <div class="kpis"><div class="kpi"><span>Sales (MMK)</span><b data-to="18400000">0</b></div><div class="kpi"><span>Orders</span><b data-to="642">0</b><em>+18%</em></div><div class="kpi"><span>Stock items</span><b data-to="1290">0</b></div></div>
    <div class="charts"><div class="bars"><i style="height:45%"></i><i style="height:62%"></i><i style="height:38%"></i><i style="height:74%"></i><i style="height:58%"></i><i style="height:86%"></i><i style="height:95%"></i></div>
    <div class="lchart"><svg viewBox="0 0 120 70" preserveAspectRatio="none"><defs><linearGradient id="m-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#0a5cf0" stop-opacity=".25"/><stop offset="1" stop-color="#0a5cf0" stop-opacity="0"/></linearGradient></defs><path class="area" d="M0,58 C15,52 22,40 36,44 S58,22 72,28 S98,10 120,6 L120,70 L0,70Z"/><path d="M0,58 C15,52 22,40 36,44 S58,22 72,28 S98,10 120,6"/></svg></div></div>
  </div></div>
</div>''',
    }
