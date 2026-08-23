const KEY="formFitnessTrackerV1";
const today=()=>new Date().toISOString().slice(0,10);
const uid=()=>crypto.randomUUID ? crypto.randomUUID() : Date.now()+"-"+Math.random();
const defaults={profile:{name:"",height:180,weight:null,goalWeight:null,calorieTarget:null,proteinTarget:null},workouts:[],meals:[],weighins:[],strength:[]};
let data=load(), activeFilter="all";

function load(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return {...defaults}}}
function save(){localStorage.setItem(KEY,JSON.stringify(data));renderAll()}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function fmtDate(d){return new Date(d+"T00:00:00").toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})}
function shortDay(d){return new Date(d+"T00:00:00").toLocaleDateString(undefined,{weekday:"short"}).slice(0,2)}
function bmi(weight,height){if(!weight||!height)return null;return weight/Math.pow(height/100,2)}
function bmiLabel(v){if(v===null)return "Enter height + weight";if(v<18.5)return "Underweight";if(v<25)return "Healthy range";if(v<30)return "Overweight";return "High range"}

document.getElementById("todayLabel").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"});
document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>showSection(btn.dataset.section)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showSection(b.dataset.go)));
document.getElementById("quickLogBtn").onclick=()=>openDialog("workoutModal");
document.getElementById("addWorkoutBtn").onclick=()=>openDialog("workoutModal");
document.getElementById("addMealBtn").onclick=()=>openDialog("mealModal");
document.getElementById("addProgressBtn").onclick=()=>openDialog("progressModal");
document.getElementById("addStrengthBtn").onclick=()=>openDialog("strengthModal");
document.getElementById("resetDataBtn").onclick=()=>{if(confirm("Delete all tracker data?")){localStorage.removeItem(KEY);data=load();fillProfile();renderAll()}};
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>b.closest("dialog").close());
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{activeFilter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderWorkouts()});
document.getElementById("progressRange").onchange=renderProgress;

function showSection(id){
  document.querySelectorAll(".page-section").forEach(s=>s.classList.toggle("active",s.id===id));
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.section===id));
  const titles={dashboard:"Dashboard",workouts:"Workouts",nutrition:"Nutrition",progress:"Progress",profile:"Profile"};
  document.getElementById("pageTitle").textContent=titles[id]||"Dashboard";
  window.scrollTo({top:0,behavior:"smooth"});
}

function openDialog(id){
  const d=document.getElementById(id); d.showModal();
  const map={workoutModal:["workoutDate"],mealModal:["mealDate"],progressModal:["progressDate"],strengthModal:["strengthDate"]};
  (map[id]||[]).forEach(x=>document.getElementById(x).value=today());
}

document.getElementById("workoutForm").onsubmit=e=>{
 e.preventDefault();
 data.workouts.unshift({id:uid(),date:workoutDate.value,type:workoutType.value,duration:+workoutDuration.value,location:workoutLocation.value.trim(),exercises:workoutExercises.value.trim(),notes:workoutNotes.value.trim()});
 e.target.closest("dialog").close();e.target.reset();save();
};
document.getElementById("mealForm").onsubmit=e=>{
 e.preventDefault();
 data.meals.unshift({id:uid(),date:mealDate.value,type:mealType.value,calories:+mealCalories.value||0,protein:+mealProtein.value||0,water:+mealWater.value||0,food:mealFood.value.trim()});
 e.target.closest("dialog").close();e.target.reset();save();
};
document.getElementById("progressForm").onsubmit=e=>{
 e.preventDefault();
 data.weighins.push({id:uid(),date:progressDate.value,weight:+progressWeight.value,note:progressNote.value.trim()});
 data.weighins.sort((a,b)=>a.date.localeCompare(b.date));data.profile.weight=+progressWeight.value;
 e.target.closest("dialog").close();e.target.reset();save();fillProfile();
};
document.getElementById("strengthForm").onsubmit=e=>{
 e.preventDefault();
 data.strength.unshift({id:uid(),exercise:strengthExercise.value.trim(),result:strengthResult.value.trim(),date:strengthDate.value});
 e.target.closest("dialog").close();e.target.reset();save();
};

document.getElementById("profileForm").onsubmit=e=>{
 e.preventDefault();
 data.profile={...data.profile,name:profileName.value.trim(),height:+profileHeight.value||null,weight:+profileWeight.value||null,goalWeight:+profileGoalWeight.value||null,calorieTarget:+profileCalories.value||null,proteinTarget:+profileProtein.value||null};
 if(data.profile.weight&&!data.weighins.some(x=>x.date===today()))data.weighins.push({id:uid(),date:today(),weight:data.profile.weight,note:"Profile update"});
 save();
};

function removeItem(collection,id){data[collection]=data[collection].filter(x=>x.id!==id);save()}

function renderDashboard(){
 const month=today().slice(0,7);
 const visits=data.workouts.filter(w=>w.date.startsWith(month)).length;
 const mins=data.workouts.filter(w=>w.date.startsWith(month)).reduce((a,w)=>a+w.duration,0);
 document.getElementById("gymVisits").textContent=visits;
 document.getElementById("gymVisitsSub").textContent=`${visits===1?"visit":"visits"} this month`;
 document.getElementById("gymTime").textContent=`${Math.floor(mins/60)}h ${mins%60}m`;
 const weight=data.profile.weight ?? data.weighins.at(-1)?.weight;
 document.getElementById("currentWeight").textContent=weight?`${weight} kg`:"—";
 if(data.weighins.length>=2){const diff=(data.weighins.at(-1).weight-data.weighins[0].weight).toFixed(1);document.getElementById("weightChange").textContent=`${diff>0?"+":""}${diff} kg since first weigh-in`;}else document.getElementById("weightChange").textContent=weight?"Current":"Set your weight";
 const b=bmi(weight,data.profile.height);document.getElementById("bmiValue").textContent=b?b.toFixed(1):"—";document.getElementById("bmiLabel").textContent=bmiLabel(b);
 const recentW=data.workouts.slice(0,5);document.getElementById("recentWorkouts").innerHTML=recentW.length?recentW.map(w=>`<div class="list-item"><div class="list-main"><div class="list-title">${esc(w.exercises||w.type+" workout")}</div><div class="list-sub">${fmtDate(w.date)} · ${esc(w.location||w.type)}</div></div><div class="list-value">${w.duration} min</div></div>`).join(""):`<div class="empty">No workouts logged yet.</div>`;
 const recentM=data.meals.slice(0,5);document.getElementById("recentMeals").innerHTML=recentM.length?recentM.map(m=>`<div class="list-item"><div class="list-main"><div class="list-title">${esc(m.type)} · ${esc(m.food||"Meal")}</div><div class="list-sub">${fmtDate(m.date)}</div></div><div class="list-value">${m.calories?m.calories+" kcal":"—"}</div></div>`).join(""):`<div class="empty">No meals logged yet.</div>`;
 const last7=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d.toISOString().slice(0,10)});
 const done=last7.filter(d=>data.workouts.some(w=>w.date===d)).length;
 document.getElementById("weekGrid").innerHTML=last7.map(d=>`<div class="day-cell ${data.workouts.some(w=>w.date===d)?"done":""}"><span>${shortDay(d)}</span><div class="day-dot"></div></div>`).join("");
 document.getElementById("weekScore").textContent=Math.round(done/7*100)+"%";document.querySelector(".hero-ring").style.setProperty("--progress",done/7*100);
 document.getElementById("streakText").textContent=done?`${done}/7 active days`:"No activity logged";
}
function renderWorkouts(){
 const rows=data.workouts.filter(w=>activeFilter==="all"||w.type===activeFilter).sort((a,b)=>b.date.localeCompare(a.date));
 document.getElementById("workoutList").innerHTML=rows.length?rows.map(w=>`<article class="record"><div class="record-top"><div><h3>${esc(w.exercises||w.type+" workout")}</h3><p>${fmtDate(w.date)} · ${esc(w.location||"No location")}</p></div><button class="delete-btn" onclick="removeItem('workouts','${w.id}')">×</button></div><div class="record-meta"><span class="meta">${w.type}</span><span class="meta">${w.duration} min</span>${w.exercises?`<span class="meta">Machines/exercises logged</span>`:""}</div>${w.notes?`<div class="record-note">${esc(w.notes)}</div>`:""}</article>`).join(""):`<div class="card empty" style="grid-column:1/-1">Nothing here yet. Log your first workout.</div>`;
}
function renderNutrition(){
 const td=today(), meals=data.meals.filter(m=>m.date===td);
 document.getElementById("dayCalories").textContent=meals.reduce((a,m)=>a+m.calories,0);
 document.getElementById("dayProtein").textContent=meals.reduce((a,m)=>a+m.protein,0)+"g";
 document.getElementById("dayWater").textContent=meals.reduce((a,m)=>a+m.water,0);
 document.getElementById("dayMeals").textContent=meals.length;
 document.getElementById("mealList").innerHTML=data.meals.length?data.meals.sort((a,b)=>b.date.localeCompare(a.date)).map(m=>`<article class="record"><div class="record-top"><div><h3>${esc(m.type)}</h3><p>${fmtDate(m.date)}</p></div><button class="delete-btn" onclick="removeItem('meals','${m.id}')">×</button></div><div class="record-meta"><span class="meta">${m.calories||0} kcal</span><span class="meta">${m.protein||0}g protein</span><span class="meta">${m.water||0} glass${m.water===1?"":"es"}</span></div><div class="record-note">${esc(m.food||"No food description added.")}</div></article>`).join(""):`<div class="card empty" style="grid-column:1/-1">No meals logged yet.</div>`;
}
function renderProgress(){
 const range=document.getElementById("progressRange").value;
 let points=[...data.weighins]; if(range!=="all"){const cutoff=new Date();cutoff.setDate(cutoff.getDate()-Number(range));points=points.filter(x=>new Date(x.date)>=cutoff)}
 const c=document.getElementById("weightChart"),ctx=c.getContext("2d"),rect=c.getBoundingClientRect(),dpr=window.devicePixelRatio||1;c.width=rect.width*dpr;c.height=290*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,rect.width,290);
 if(points.length<2){ctx.fillStyle="#9ca3af";ctx.font="14px system-ui";ctx.textAlign="center";ctx.fillText("Add at least 2 weigh-ins to see your trend.",rect.width/2,145)}
 else{
   const min=Math.min(...points.map(x=>x.weight))-2,max=Math.max(...points.map(x=>x.weight))+2,pad=35,w=rect.width-pad*2,h=225;
   ctx.strokeStyle="#e5e7eb";ctx.lineWidth=1;for(let i=0;i<5;i++){let y=20+i*52;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(rect.width-pad,y);ctx.stroke()}
   ctx.strokeStyle="#111827";ctx.lineWidth=3;ctx.lineJoin="round";ctx.lineCap="round";ctx.beginPath();
   points.forEach((p,i)=>{const x=pad+(i/(points.length-1))*w,y=20+(max-p.weight)/(max-min)*h;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();
   ctx.fillStyle="#111827";points.forEach((p,i)=>{const x=pad+(i/(points.length-1))*w,y=20+(max-p.weight)/(max-min)*h;ctx.beginPath();ctx.arc(x,y,4.5,0,Math.PI*2);ctx.fill()});
   ctx.fillStyle="#6b7280";ctx.font="11px system-ui";ctx.textAlign="center";ctx.fillText(points[0].weight+" kg",pad,275);ctx.fillText(points.at(-1).weight+" kg",rect.width-pad,275);
 }
 const latest=data.weighins.at(-1),first=data.weighins[0];document.getElementById("progressSummary").textContent=latest?`${latest.weight} kg · ${first&&latest!==first?((latest.weight-first.weight>0?"+":"")+(latest.weight-first.weight).toFixed(1)+" kg total"):"first weigh-in"}`:"No weigh-ins yet";
 document.getElementById("strengthList").innerHTML=data.strength.length?data.strength.map(s=>`<div class="list-item"><div class="list-main"><div class="list-title">${esc(s.exercise)}</div><div class="list-sub">${fmtDate(s.date)}</div></div><div class="list-value">${esc(s.result)}</div></div>`).join(""):`<div class="empty">No personal bests logged.</div>`;
 const b=data.profile;document.getElementById("measurementSummary").innerHTML=`<div class="measurement"><span>Height</span><strong>${b.height?b.height+" cm":"—"}</strong></div><div class="measurement"><span>Weight</span><strong>${b.weight?b.weight+" kg":"—"}</strong></div><div class="measurement"><span>Goal</span><strong>${b.goalWeight?b.goalWeight+" kg":"—"}</strong></div><div class="measurement"><span>Calorie target</span><strong>${b.calorieTarget?b.calorieTarget+" kcal":"—"}</strong></div>`;
}
function fillProfile(){
 const p=data.profile;profileName.value=p.name||"";profileHeight.value=p.height||"";profileWeight.value=p.weight||"";profileGoalWeight.value=p.goalWeight||"";profileCalories.value=p.calorieTarget||"";profileProtein.value=p.proteinTarget||"";
 const b=bmi(p.weight,p.height);profileBmi.textContent=b?b.toFixed(1):"—";profileBmiLabel.textContent=bmiLabel(b);goalDisplay.textContent=p.goalWeight?p.goalWeight+" kg":"—";
 goalMessage.textContent=p.weight&&p.goalWeight?(p.weight>p.goalWeight?`${(p.weight-p.goalWeight).toFixed(1)} kg to your goal`:`${(p.goalWeight-p.weight).toFixed(1)} kg to your goal`):"Set a goal weight in your profile.";
}
function renderAll(){renderDashboard();renderWorkouts();renderNutrition();renderProgress();fillProfile()}
window.addEventListener("resize",()=>{if(document.getElementById("progress").classList.contains("active"))renderProgress()});
renderAll();
