const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'assets');
const font = "'DejaVu Sans Mono',monospace";
const defs = `<defs><linearGradient id="neon"><stop stop-color="#00F5FF"/><stop offset=".5" stop-color="#A770FF"/><stop offset="1" stop-color="#FF3CAC"/></linearGradient><linearGradient id="bar" x2="0" y2="1"><stop stop-color="#00F5FF"/><stop offset="1" stop-color="#7538E8"/></linearGradient></defs>`;
function panel(height, label, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="980" height="${height}" viewBox="0 0 980 ${height}" role="img" aria-label="${label}">${defs}<style>text{font-family:${font}}.muted{fill:#8D9BBC}.bright{fill:#EFF6FF}@media(prefers-reduced-motion:reduce){*{animation:none!important}}</style><rect x="1" y="1" width="978" height="${height-2}" rx="16" fill="#090B17" stroke="#30314E"/><path d="M20 1H420" stroke="url(#neon)" stroke-width="2"/>${content}</svg>`;
}
function wrapSnake() {
  const file=path.join(out,'snake.svg');
  const source=fs.readFileSync(file,'utf8');
  if(source.includes('CONTRIBUTION ARCADE')) return;
  const w=Number(source.match(/<svg[^>]*\bwidth="([\d.]+)"/)[1]);
  const h=Number(source.match(/<svg[^>]*\bheight="([\d.]+)"/)[1]);
  const inner=source.slice(source.indexOf('<svg')).replace(/<svg[^>]*>/, tag=>tag.replace(/\bwidth="[^"]*"/, 'width="920"').replace(/\bheight="[^"]*"/, `height="${h*920/w}"`).replace('<svg ', '<svg x="30" y="64" '));
  const height=Math.ceil(h*920/w)+110;
  // Keep the original viewBox: the snake's generated CSS and timeline stay intact.
  fs.writeFileSync(file,panel(height,'Animated snake eating the real contribution calendar',`<text x="30" y="35" fill="#00F5FF" font-size="14" letter-spacing="3">02 / CONTRIBUTION ARCADE</text><text x="950" y="35" text-anchor="end" fill="#FF3CAC" font-size="11">EAT. COMMIT. REPEAT.</text>${inner}<text x="30" y="${height-18}" fill="#8D9BBC" font-size="10">REAL GITHUB CONTRIBUTIONS / SNAKE ANIMATION</text>`));
}
async function main(){
  if(process.argv.includes('--wrap-snake')) {wrapSnake();return;}
  let data;
  if(process.env.CALENDAR_FILE) data=JSON.parse(fs.readFileSync(process.env.CALENDAR_FILE,'utf8'));
  else {
    const query=`query { user(login:"tt619252615") { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount weekday } } } } repositories(privacy:PUBLIC, ownerAffiliations:OWNER, isFork:false, first:100) { nodes { name stargazerCount primaryLanguage { name } } } followers { totalCount } } }`;
    const res=await fetch('https://api.github.com/graphql',{method:'POST',headers:{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query})});
    data=await res.json();
    if(!res.ok || data.errors) throw new Error(JSON.stringify(data.errors||{status:res.status}));
  }
  const user=data.data.user;
  const cal=user.contributionsCollection.contributionCalendar;
  const repos=user.repositories.nodes;
  const weeks=cal.weeks.slice(-26);
  const sums=weeks.map(w=>w.contributionDays.reduce((a,d)=>a+d.contributionCount,0));
  const max=Math.max(1,...sums);
  let body=`<text x="30" y="36" fill="#00F5FF" font-size="14" letter-spacing="3">01 / GITHUB SIGNAL</text><circle cx="816" cy="30" r="4" fill="#00F5FF"><animate attributeName="opacity" values="1;.2;1" dur="2s" repeatCount="indefinite"/></circle><text x="830" y="34" class="muted" font-size="10">SYNCED DAILY</text>`;
  const stats=[[cal.totalContributions,'CONTRIBUTIONS / YEAR'],[repos.length,'ORIGINAL PUBLIC REPOS'],[repos.reduce((a,r)=>a+r.stargazerCount,0),'STARS / ORIGINAL REPOS'],[user.followers.totalCount,'FOLLOWERS']];
  stats.forEach(([value,label],i)=>{const x=30+i*237;body+=`<rect x="${x}" y="59" width="209" height="96" rx="8" fill="#111528" stroke="#262C45"/><text x="${x+17}" y="105" fill="${i%2?'#FF70C8':'#00F5FF'}" font-size="34" font-weight="700">${value}</text><text x="${x+17}" y="134" class="muted" font-size="9">${label}</text>`;});
  body+=`<text x="30" y="188" class="muted" font-size="11" letter-spacing="2">CONTRIBUTION FREQUENCY / LAST 26 WEEKS</text>`;
  for(let i=0;i<4;i++)body+=`<path d="M30 ${212+i*30}H950" stroke="#222940" stroke-dasharray="3 7"/>`;
  sums.forEach((n,i)=>{let h=n?Math.max(5,n/max*98):3;let x=32+i*35.4;body+=`<rect x="${x}" y="${313-h}" width="23" height="${h}" rx="3" fill="${n?'url(#bar)':'#20283D'}"><title>${weeks[i].contributionDays[0].date}: ${n} contributions</title>${n?`<animate attributeName="opacity" values=".5;1;.5" dur="${3+i%4}s" repeatCount="indefinite"/>`:''}</rect>`;});
  body+=`<path d="M30 317H950" stroke="url(#neon)" stroke-opacity=".6"/><circle r="3" fill="#FF3CAC"><animateMotion path="M30 317H950" dur="8s" repeatCount="indefinite"/></circle><text x="30" y="343" class="muted" font-size="10">${weeks[0].contributionDays[0].date}</text><text x="950" y="343" text-anchor="end" class="muted" font-size="10">${weeks.at(-1).contributionDays.at(-1).date} / UTC</text>`;
  fs.writeFileSync(path.join(out,'activity.svg'),panel(366,'Real GitHub contribution activity and public repository statistics',body));
  fs.writeFileSync(path.join(out,'toolbox.svg'),panel(156,'Developer toolbox',`<text x="30" y="35" fill="#00F5FF" font-size="14" letter-spacing="3">04 / LOADOUT</text><text x="30" y="79" fill="#F2F5FF" font-size="19">JavaScript · TypeScript · Python · Nix</text><text x="30" y="112" class="muted" font-size="14">React / FastAPI / Node.js / Docker / Linux</text><path d="M30 134H950" stroke="#26304C"/><path d="M30 134H210" stroke="url(#neon)" stroke-width="2"><animate attributeName="d" values="M30 134H210;M770 134H950;M30 134H210" dur="6s" repeatCount="indefinite"/></path>`));
  console.log('Generated dashboard from GitHub data.');
}
main().catch(e=>{console.error(e.message);process.exit(1)});
