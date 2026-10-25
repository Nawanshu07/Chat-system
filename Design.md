<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Chatly – Web Messenger</title>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#EEF1F4; --panel:#FFFFFF; --line:#E3E8ED; --text:#18222D; --muted:#6B7A8A;
  --accent:#2A6F6B; --accent-soft:#DDEFED; --on-accent:#FFFFFF;
  --in:#FFFFFF; --out:#2A6F6B; --out-text:#FFFFFF; --hover:#F4F7F9; --online:#3CB878;
  box-sizing:border-box; padding-top:env(safe-area-inset-top,0px); padding-bottom:env(safe-area-inset-bottom,0px);
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#0E151B; --panel:#151E26; --line:#24313C; --text:#E6EDF3; --muted:#8A9AA8;
  --accent:#4FB3AB; --accent-soft:#1C3534; --on-accent:#06201E;
  --in:#1D2933; --out:#2A6F6B; --out-text:#FFFFFF; --hover:#1A252E;}}
:root[data-theme="dark"]{
  --bg:#0E151B; --panel:#151E26; --line:#24313C; --text:#E6EDF3; --muted:#8A9AA8;
  --accent:#4FB3AB; --accent-soft:#1C3534; --on-accent:#06201E;
  --in:#1D2933; --out:#2A6F6B; --out-text:#FFFFFF; --hover:#1A252E;}
*{box-sizing:border-box;margin:0}
html,body{height:100%}
body{background:var(--bg);color:var(--text);font-family:Figtree,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:15px;overflow:hidden}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
button:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.app{display:grid;grid-template-columns:340px 1fr;height:100%;max-width:1400px;margin:0 auto;background:var(--panel)}
.side{border-right:1px solid var(--line);display:flex;flex-direction:column;min-height:0}
.side-h{display:flex;align-items:center;justify-content:space-between;padding:16px 16px 8px}
.side-h h1{font-size:22px;font-weight:700;letter-spacing:-.01em}
.icon{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;color:var(--muted)}
.icon:hover{background:var(--hover);color:var(--text)}
.icon svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.search{margin:6px 16px 10px;position:relative}
.search input{width:100%;height:40px;border-radius:20px;border:0;background:var(--bg);color:var(--text);padding:0 16px 0 40px;font:inherit}
.search svg{position:absolute;left:13px;top:10px;width:19px;height:19px;stroke:var(--muted);fill:none;stroke-width:1.8;stroke-linecap:round}
.tabs{display:flex;gap:6px;padding:0 16px 8px}
.tab{padding:6px 14px;border-radius:16px;font-weight:500;color:var(--muted)}
.tab.on{background:var(--accent-soft);color:var(--accent)}
.list{overflow-y:auto;flex:1;padding:0 8px 8px}
.chat{display:flex;gap:12px;align-items:center;width:100%;padding:10px 10px;border-radius:12px;text-align:left}
.chat:hover{background:var(--hover)}
.chat.on{background:var(--accent-soft)}
.av{width:48px;height:48px;border-radius:50%;flex:none;display:grid;place-items:center;font-weight:700;color:#fff;position:relative}
.av.on::after{content:"";position:absolute;right:0;bottom:1px;width:12px;height:12px;border-radius:50%;background:var(--online);border:2px solid var(--panel)}
.meta{flex:1;min-width:0}
.row{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.name{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.time{font-size:12px;color:var(--muted);flex:none}
.prev{color:var(--muted);font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.badge{background:var(--accent);color:var(--on-accent);font-size:12px;font-weight:600;min-width:20px;height:20px;border-radius:10px;display:grid;place-items:center;padding:0 6px;flex:none}
.main{display:flex;flex-direction:column;min-height:0;min-width:0;background:var(--bg)}
.main-h{display:flex;align-items:center;gap:12px;padding:10px 16px;background:var(--panel);border-bottom:1px solid var(--line)}
.back{display:none}
.main-h .av{width:42px;height:42px}
.main-h .t{flex:1;min-width:0}
.main-h .n{font-weight:600}
.main-h .s{font-size:13px;color:var(--muted)}
.msgs{flex:1;overflow-y:auto;padding:20px 16px;display:flex;flex-direction:column;gap:4px}
.day{align-self:center;background:var(--panel);color:var(--muted);font-size:12px;font-weight:500;padding:4px 12px;border-radius:12px;margin:8px 0}
.m{max-width:min(520px,78%);padding:8px 12px 6px;border-radius:16px;line-height:1.4;word-wrap:break-word}
.m.in{align-self:flex-start;background:var(--in);border-bottom-left-radius:4px}
.m.out{align-self:flex-end;background:var(--out);color:var(--out-text);border-bottom-right-radius:4px}
.m small{display:block;text-align:right;font-size:11px;opacity:.65;margin-top:2px}
.m.in+.m.out,.m.out+.m.in{margin-top:8px}
.typing{align-self:flex-start;background:var(--in);padding:12px 14px;border-radius:16px;display:flex;gap:4px}
.typing i{width:6px;height:6px;border-radius:50%;background:var(--muted);animation:b 1s infinite}
.typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}
@keyframes b{0%,60%,100%{opacity:.3}30%{opacity:1}}
@media (prefers-reduced-motion:reduce){.typing i{animation:none}}
.comp{display:flex;gap:8px;align-items:center;padding:10px 16px;background:var(--panel);border-top:1px solid var(--line)}
.comp input{flex:1;height:44px;border-radius:22px;border:0;background:var(--bg);color:var(--text);padding:0 18px;font:inherit}
.send{width:44px;height:44px;border-radius:50%;background:var(--accent);color:var(--on-accent);display:grid;place-items:center}
.send svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.empty{margin:auto;color:var(--muted);text-align:center;padding:24px}
@media (max-width:760px){
  .app{grid-template-columns:1fr;position:relative}
  .main{position:absolute;inset:0;transform:translateX(100%);transition:transform .2s}
  .app.open .main{transform:none}
  .back{display:grid}
}
</style>
</head>
<body>
<div class="app" id="app">
  <aside class="side">
    <div class="side-h">
      <h1>Chats</h1>
      <div>
        <button class="icon" id="theme" aria-label="Switch theme"><svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></button>
        <button class="icon" aria-label="New chat"><svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button>
      </div>
    </div>
    <label class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="q" placeholder="Search chats" aria-label="Search chats"></label>
    <div class="tabs"><button class="tab on" data-f="all">All</button><button class="tab" data-f="unread">Unread</button></div>
    <div class="list" id="list"></div>
  </aside>
  <section class="main" id="main"></section>
</div>
<script>
var COL=["#2A6F6B","#B5543A","#5B5FC7","#C08A1E","#8A4F9E","#3B7DB5"];
var chats=[
 {id:1,n:"Maya Cohen",c:0,on:1,u:2,m:[["in","Hey! Are we still on for tomorrow?","09:12"],["out","Yes, 10 am at the café.","09:14"],["in","Perfect. I'll bring the sketches.","09:15"],["in","Also, did you see the new brief?","09:15"]]},
 {id:2,n:"Design Team",c:2,on:0,u:5,m:[["in","Updated the color tokens in Figma.","08:02"],["in","Please review before standup.","08:03"]]},
 {id:3,n:"Omar Haddad",c:1,on:1,u:0,m:[["out","Sent you the invoice.","Yesterday"],["in","Got it, thank you!","Yesterday"]]},
 {id:4,n:"Lena Fischer",c:3,on:0,u:0,m:[["in","Happy birthday! 🎉","Mon"],["out","Thank you so much!","Mon"]]},
 {id:5,n:"Family",c:4,on:0,u:1,m:[["in","Dinner on Sunday at 7?","Sun"]]},
 {id:6,n:"Daniel Park",c:5,on:1,u:0,m:[["out","The build is green again.","Sat"],["in","Great work. Shipping it.","Sat"]]}
];
var cur=null,filter="all",term="";
var $=function(s){return document.querySelector(s)};
function ini(n){return n.split(" ").map(function(w){return w[0]}).slice(0,2).join("")}
function esc(s){return s.replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function now(){var d=new Date();return ("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2)}
function renderList(){
  var h="";
  chats.filter(function(c){return c.n.toLowerCase().indexOf(term)>-1&&(filter=="all"||c.u>0)}).forEach(function(c){
    var l=c.m[c.m.length-1];
    h+='<button class="chat'+(cur&&cur.id==c.id?' on':'')+'" data-id="'+c.id+'"><span class="av'+(c.on?' on':'')+'" style="background:'+COL[c.c]+'">'+ini(c.n)+'</span><span class="meta"><span class="row"><span class="name">'+esc(c.n)+'</span><span class="time">'+l[2]+'</span></span><span class="row"><span class="prev">'+(l[0]=="out"?"You: ":"")+esc(l[1])+'</span>'+(c.u?'<span class="badge">'+c.u+'</span>':'')+'</span></span></button>';
  });
  $("#list").innerHTML=h||'<p class="empty">No chats found.</p>';
}
function renderMain(){
  var m=$("#main");
  if(!cur){m.innerHTML='<div class="empty">Select a chat to start messaging.</div>';return}
  m.innerHTML='<header class="main-h"><button class="icon back" id="back" aria-label="Back to chats"><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></button><span class="av" style="background:'+COL[cur.c]+'">'+ini(cur.n)+'</span><div class="t"><div class="n">'+esc(cur.n)+'</div><div class="s" id="st">'+(cur.on?"online":"last seen recently")+'</div></div><button class="icon" aria-label="Search in chat"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button><button class="icon" aria-label="More"><svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg></button></header><div class="msgs" id="msgs"></div><div class="comp"><input id="in" placeholder="Write a message" aria-label="Message" autocomplete="off"><button class="send" id="send" aria-label="Send message"><svg viewBox="0 0 24 24"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg></button></div>';
  var h='<div class="day">Today</div>';
  cur.m.forEach(function(x){h+='<div class="m '+x[0]+'">'+esc(x[1])+'<small>'+x[2]+(x[0]=="out"?" ✓✓":"")+'</small></div>'});
  $("#msgs").innerHTML=h;scroll();
  $("#send").onclick=send;
  $("#in").onkeydown=function(e){if(e.key=="Enter")send()};
  $("#back").onclick=function(){$("#app").classList.remove("open")};
}
function scroll(){var e=$("#msgs");if(e)e.scrollTop=e.scrollHeight}
var replies=["Sounds good!","Got it 👍","Let me check and get back to you.","Haha, nice.","Can we talk about it later today?"];
function send(){
  var i=$("#in"),v=i.value.trim();if(!v)return;
  var c=cur;c.m.push(["out",v,now()]);i.value="";renderMain();renderList();
  var st=$("#st");if(st)st.textContent="typing…";
  var t=document.createElement("div");t.className="typing";t.innerHTML="<i></i><i></i><i></i>";$("#msgs").appendChild(t);scroll();
  setTimeout(function(){
    c.m.push(["in",replies[Math.floor(Math.random()*replies.length)],now()]);
    if(cur===c){renderMain()}else{c.u++}
    renderList();
  },1400);
}
$("#list").onclick=function(e){
  var b=e.target.closest(".chat");if(!b)return;
  cur=chats.filter(function(c){return c.id==b.dataset.id})[0];cur.u=0;
  $("#app").classList.add("open");renderMain();renderList();
};
$("#q").oninput=function(e){term=e.target.value.toLowerCase();renderList()};
document.querySelectorAll(".tab").forEach(function(t){t.onclick=function(){
  document.querySelectorAll(".tab").forEach(function(x){x.classList.remove("on")});t.classList.add("on");filter=t.dataset.f;renderList()}});
$("#theme").onclick=function(){
  var r=document.documentElement,dark=r.dataset.theme?r.dataset.theme=="dark":matchMedia("(prefers-color-scheme:dark)").matches;
  r.dataset.theme=dark?"light":"dark";
};
renderList();renderMain();
</script>
</body>
</html>
