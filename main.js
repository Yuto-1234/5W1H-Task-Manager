let tasks = [];
let viewMode = 'list';
let currentDate = new Date();

// Elements
const taskListEl = document.getElementById('task-list');
const calendarViewEl = document.getElementById('calendar-view');
const bottomSheet = document.getElementById('bottom-sheet');
const formOverlay = document.getElementById('form-overlay');
const taskForm = document.getElementById('task-form');

// API Functions
async function fetchTasks() {
    // 1. まずはスマホ本体(localStorage)から即座に読み込んで表示
    const saved = localStorage.getItem('5w1h-tasks');
    if (saved) {
        try {
            tasks = JSON.parse(saved);
            render();
        } catch (e) {
            console.error('Local storage parse error', e);
        }
    }

    // 2. その後、サーバーに最新データを取りに行く
    try {
        const res = await fetch('/api/tasks');
        if (res.ok) {
            const serverTasks = await res.json();
            // サーバーに有効なデータ（配列）がある場合のみ更新
            if (serverTasks && Array.isArray(serverTasks) && serverTasks.length > 0) {
                tasks = serverTasks;
                localStorage.setItem('5w1h-tasks', JSON.stringify(tasks));
                render();
            } else if (serverTasks && Array.isArray(serverTasks) && serverTasks.length === 0 && tasks.length > 0) {
                // サーバーが空でローカルにデータがある場合は、サーバーがリセットされた可能性があるため
                // ローカルのデータをサーバーに再アップロードする
                saveTasks();
            }
        }
    } catch (e) {
        console.warn('Server fetch failed (offline?), keeping local data', e);
        // 通信失敗時はローカルデータをそのまま使うので何もしない
    }
}

async function saveTasks() {
    localStorage.setItem('5w1h-tasks', JSON.stringify(tasks));
    try {
        await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tasks)
        });
    } catch (e) {
        console.error('Failed to save tasks to server', e);
    }
}

// UI Functions
function setView(mode) {
    viewMode = mode;
    render();
}

function openForm() {
    bottomSheet.classList.remove('hidden');
    formOverlay.classList.remove('hidden');
}

function closeForm() {
    bottomSheet.classList.add('hidden');
    formOverlay.classList.add('hidden');
}

function toggleTask(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks();
    render();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newTask = {
        id: crypto.randomUUID(),
        what: document.getElementById('input-what').value,
        when: document.getElementById('input-when').value,
        who: document.getElementById('input-who').value,
        where: document.getElementById('input-where').value,
        why: document.getElementById('input-why').value,
        how: document.getElementById('input-how').value,
        completed: false,
        createdAt: Date.now()
    };
    tasks.unshift(newTask);
    saveTasks();
    taskForm.reset();
    closeForm();
    render();
});

function render() {
    // Update Nav UI
    const btnList = document.getElementById('btn-list');
    const btnCalendar = document.getElementById('btn-calendar');
    const navListIcon = document.getElementById('nav-list-icon');
    const navCalendarIcon = document.getElementById('nav-calendar-icon');

    if (viewMode === 'list') {
        taskListEl.classList.remove('hidden');
        calendarViewEl.classList.add('hidden');
        btnList.className = "px-4 py-1.5 rounded-lg text-sm font-medium bg-white text-indigo-600 shadow-sm";
        btnCalendar.className = "px-4 py-1.5 rounded-lg text-sm font-medium text-slate-500";
        navListIcon.className = "px-5 py-1 rounded-full bg-indigo-50 text-indigo-600";
        navCalendarIcon.className = "px-5 py-1 rounded-full text-slate-400";
        renderList();
    } else {
        taskListEl.classList.add('hidden');
        calendarViewEl.classList.remove('hidden');
        btnList.className = "px-4 py-1.5 rounded-lg text-sm font-medium text-slate-500";
        btnCalendar.className = "px-4 py-1.5 rounded-lg text-sm font-medium bg-white text-indigo-600 shadow-sm";
        navListIcon.className = "px-5 py-1 rounded-full text-slate-400";
        navCalendarIcon.className = "px-5 py-1 rounded-full bg-indigo-50 text-indigo-600";
        renderCalendar();
    }
}

function renderList() {
    if (tasks.length === 0) {
        taskListEl.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 text-center">
                <div class="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-300 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
                <p class="text-slate-400 font-medium">タスクを追加して始めましょう</p>
            </div>
        `;
        return;
    }

    taskListEl.innerHTML = tasks.map(task => `
        <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm ${task.completed ? 'opacity-75' : ''}">
            <div class="flex items-start gap-3">
                <button onclick="toggleTask('${task.id}')" class="mt-1 flex-shrink-0 ${task.completed ? 'text-emerald-500' : 'text-slate-300'}">
                    ${task.completed ? 
                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' : 
                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>'
                    }
                </button>
                <div class="flex-1 min-w-0">
                    <h3 class="text-base font-bold leading-tight mb-2 ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}">${task.what}</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                        ${task.when ? `<div class="flex items-start gap-1.5 text-[11px] text-slate-500"><span class="font-bold text-slate-400 min-w-[32px]">いつ:</span><span class="break-all">${task.when}</span></div>` : ''}
                        ${task.who ? `<div class="flex items-start gap-1.5 text-[11px] text-slate-500"><span class="font-bold text-slate-400 min-w-[32px]">だれ:</span><span class="break-all">${task.who}</span></div>` : ''}
                        ${task.where ? `<div class="flex items-start gap-1.5 text-[11px] text-slate-500"><span class="font-bold text-slate-400 min-w-[32px]">どこ:</span><span class="break-all">${task.where}</span></div>` : ''}
                        ${task.why ? `<div class="flex items-start gap-1.5 text-[11px] text-slate-500"><span class="font-bold text-slate-400 min-w-[32px]">なぜ:</span><span class="break-all">${task.why}</span></div>` : ''}
                        ${task.how ? `<div class="flex items-start gap-1.5 text-[11px] text-slate-500 col-span-full"><span class="font-bold text-slate-400 min-w-[32px]">どう:</span><span class="break-all">${task.how}</span></div>` : ''}
                    </div>
                </div>
                <button onclick="deleteTask('${task.id}')" class="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        </div>
    `).join('');
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    let html = `
        <div class="p-4 flex items-center justify-between border-b border-slate-100">
            <h2 class="text-lg font-bold">${year}年 ${month + 1}月</h2>
            <div class="flex gap-1">
                <button onclick="changeMonth(-1)" class="p-2 hover:bg-slate-100 rounded-full">←</button>
                <button onclick="changeMonth(1)" class="p-2 hover:bg-slate-100 rounded-full">→</button>
            </div>
        </div>
        <div class="grid grid-cols-7 text-center border-b border-slate-50">
            ${['日', '月', '火', '水', '木', '金', '土'].map(d => `<div class="py-2 text-[10px] font-bold text-slate-400 uppercase">${d}</div>`).join('')}
        </div>
        <div class="grid grid-cols-7">
    `;

    for (let i = 0; i < firstDay; i++) html += `<div class="min-h-[80px] border-b border-r border-slate-50 bg-slate-50/30"></div>`;
    
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTasks = tasks.filter(t => t.when === dateStr);
        const isToday = dateStr === new Date().toISOString().split('T')[0];

        html += `
            <div class="min-h-[80px] border-b border-r border-slate-50 p-1">
                <div class="flex justify-center mb-1">
                    <span class="text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-400'}">${day}</span>
                </div>
                <div class="space-y-0.5">
                    ${dayTasks.slice(0, 3).map(t => `<div class="h-1.5 rounded-full ${t.completed ? 'bg-emerald-200' : 'bg-indigo-400'}"></div>`).join('')}
                </div>
            </div>
        `;
    }
    html += `</div>`;
    calendarViewEl.innerHTML = html;
}

window.changeMonth = (offset) => {
    currentDate.setMonth(currentDate.getMonth() + offset);
    renderCalendar();
};

// Initial Load
fetchTasks();
