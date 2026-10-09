import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight,BookOpen,Users } from 'lucide-react';
import { PageTitle } from './components';
const articles=[
 {category:'雙貓相處',title:'先聞聞味道，再說聲你好',text:'讓新貓先住在安靜、設備齊全的獨立空間。用各自的毯子交換氣味，等牠們放鬆後，再透過安全阻隔短暫見面；有緊張就退回前一步，不急著一起生活。',source:'Cats Protection',url:'https://www.cats.org.uk/help-and-advice/cat-behaviour/introducing-cats'},
 {category:'雙狗相處',title:'我們可以，慢慢變朋友',text:'初次見面由兩位成人各自照顧一隻狗，在安全且有空間的地點保持距離。觀察牠們是否放鬆，避免強迫靠近。出現恐懼或攻擊行為時，先分開並尋求專業評估。',source:'RSPCA',url:'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/company'},
 {category:'貓狗同住',title:'一個家，也要有各自的小天地',text:'先交換氣味，再做短時間、有監督的介紹。提供貓咪能安全撤退的空間，避免追逐。沒有大人在場時先分開；並非每一對貓狗都適合近距離相處。',source:'RSPCA',url:'https://www.rspca.org.uk/adviceandwelfare/pets/cats/company'},
 {category:'新朋友加入',title:'把安全感，放在見面之前',text:'新家人的第一天可以很安靜。先準備躲藏處、食水與休息區，讓牠按自己的步調探索。家庭成員一次一位、逐步認識牠，不勉強抱起或互動。',source:'Cats Protection',url:'https://www.cats.org.uk/help-and-advice/getting-a-cat/bringing-a-cat-home'},
 {category:'資源與衝突',title:'多一個選擇，少一點爭執',text:'多貓家庭可準備「每隻一份，再多一份」的主要資源，並放在不同位置，降低互相阻擋與競爭。食水、貓砂盆、休息與躲藏空間都值得留意。',source:'Cats Protection',url:'https://www.cats.org.uk/help-and-advice/cat-behaviour/introducing-cats'},
 {category:'資源與衝突',title:'追逐之後，誰還願意留下？',text:'持續追逐、躲避或衝突值得留意。不要強迫動物接觸，也不要徒手伸進打架中的動物之間。先確保能安全分開，再向獸醫或合格行為專業人員求助。',source:'Cats Protection',url:'https://www.cats.org.uk/help-and-advice/cat-behaviour/cats-and-fighting'},
 {category:'日常問號',title:'突然變得不一樣，先關心身體',text:'當行為持續改變，先向獸醫諮詢，而不是認定牠故意搗蛋。恐懼或攻擊問題需要個別評估；建立可預期的日常與溫和互動，避免處罰。',source:'RSPCA',url:'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/behaviour'}
];
export default function Learn(){const [category,setCategory]=useState('全部');const categories=['全部',...new Set(articles.map(a=>a.category))];return <><PageTitle eyebrow="A LITTLE TOGETHERNESS" title="把日子，過成喜歡的樣子。">相處沒有標準答案，但可以從理解開始。</PageTitle><Link className="learn-banner" to="/analyze/coexist"><span className="feature-icon"><Users size={28}/></span><div><span className="eyebrow">LET'S FIGURE IT OUT, TOGETHER</span><h2>家裡的小夥伴，最近還好嗎？</h2><p>選擇兩隻以上毛孩，讓小嚕陪你想想相處方式。</p></div><ArrowUpRight size={24}/></Link><div className="filter-row" aria-label="百科分類">{categories.map(c=><button key={c} aria-pressed={c===category} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="article-grid">{articles.filter(a=>category==='全部'||a.category===category).map(a=><article className="card article" key={a.title}><span className="pill"><BookOpen size={13}/>{a.category}</span><h2>{a.title}</h2><p>{a.text}</p><a href={a.url} target="_blank" rel="noreferrer" className="text-link">參考：{a.source}<ArrowUpRight size={15}/></a></article>)}</div><p className="fine">內容依動物福利機構的一般行為建議整理，查核日期：2026 年 10 月 9 日。不能取代個別獸醫評估。</p></>;}
