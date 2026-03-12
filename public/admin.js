let clicks=0;

document.getElementById("group").onclick=()=>{

clicks++;

if(clicks>=5){

const pass=prompt("Пароль");

if(pass==="suai"){
openAdmin();
}

clicks=0;

}

};

function openAdmin(){

document.getElementById("admin").classList.remove("hidden");

const editor=document.getElementById("editor");
editor.innerHTML="";

for(let week in schedule){

for(let day in schedule[week]){

schedule[week][day].forEach((lesson,i)=>{

const div=document.createElement("div");

div.innerHTML=`

<h3>${week} ${day}</h3>

<input value="${lesson.time}" id="${week}_${day}_time_${i}">
<input value="${lesson.type}" id="${week}_${day}_type_${i}">
<input value="${lesson.title}" id="${week}_${day}_title_${i}">
<input value="${lesson.room}" id="${week}_${day}_room_${i}">
<input value="${lesson.teacher}" id="${week}_${day}_teacher_${i}">

<hr>
`;

editor.appendChild(div);

});

}

}

}

function save(){

for(let week in schedule){

for(let day in schedule[week]){

schedule[week][day].forEach((lesson,i)=>{

lesson.time=document.getElementById(`${week}_${day}_time_${i}`).value;
lesson.type=document.getElementById(`${week}_${day}_type_${i}`).value;
lesson.title=document.getElementById(`${week}_${day}_title_${i}`).value;
lesson.room=document.getElementById(`${week}_${day}_room_${i}`).value;
lesson.teacher=document.getElementById(`${week}_${day}_teacher_${i}`).value;

});

}

}

fetch("/api/schedule",{
method:"POST",
headers:{'Content-Type':'application/json'},
body:JSON.stringify(schedule)
});

alert("Сохранено");

}