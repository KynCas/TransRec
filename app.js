const api = {
  list: () => fetch('/api/students').then(r => r.json()),
  create: (body) => fetch('/api/students', {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)}).then(r => r.json()),
  submit: (id, idx) => fetch(`/api/students/${id}/submit`, {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ requirementIndex: idx })}).then(r => r.json())
};

const socket = io();

const alertsEl = document.getElementById('alerts');
const tableBody = document.querySelector('#studentsTable tbody');

let students = [];

function render() {
  tableBody.innerHTML = '';
  
  if (students.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">No students found. Add your first student to get started.</td></tr>';
    return;
  }

  students.forEach(s => {
    const completed = s.requirements.filter(r => r.status === 'Complete' || r.status === 'Verified').length;
    const total = s.requirements.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${s.name}</strong></td>
      <td>${s.studentId || s.student_id || 'N/A'}</td>
      <td>
        <div class="progress" title="${pct}% complete">
          <div class="progress-bar" style="width:${pct}%"></div>
          <small>${pct}%</small>
        </div>
      </td>
      <td>${new Date(s.deadline).toLocaleDateString()}</td>
      <td>
        <button data-id="${s.id}" class="viewBtn" style="padding: 6px 12px; font-size: 0.9rem;">📋 View</button>
      </td>
    `;

    tr.querySelector('.viewBtn').addEventListener('click', ()=> showDetails(s));
    tableBody.appendChild(tr);
  });
}

function showDetails(student) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  const completed = student.requirements.filter(r => r.status === 'Complete' || r.status === 'Verified').length;
  const total = student.requirements.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const requirementsTable = student.requirements.map((r, i) => {
    const isComplete = r.status === 'Complete' || r.status === 'Verified';
    const statusIcon = r.status === 'Complete' ? '✓' : r.status === 'Verified' ? '✓✓' : '⏳';
    const statusClass = isComplete ? 'status-ok' : 'status-pending';
    
    return `
      <tr>
        <td>${r.name}</td>
        <td><span class="${statusClass}">${statusIcon} ${r.status}</span></td>
        <td>${isComplete ? '-' : `<button data-idx="${i}" data-id="${student.id}" class="markBtn" style="padding: 4px 8px; font-size: 0.8rem;">✓ Mark Complete</button>`}</td>
      </tr>
    `;
  }).join('');

  modal.innerHTML = `
    <div class="modal-content">
      <h3>${student.name} — ${student.studentId || student.student_id || 'No ID'}</h3>
      
      <div style="margin-bottom: 16px; padding: 12px; background: var(--bg); border-radius: 6px;">
        <p style="margin: 0; font-weight: 600;">Overall Progress: <span style="color: var(--primary); font-size: 1.1rem;">${pct}%</span></p>
      </div>

      <table class="req-list">
        <thead>
          <tr>
            <th>Requirement</th>
            <th>Status</th>
            <th style="width: 120px;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${requirementsTable}
        </tbody>
      </table>
      <button class="closeBtn" style="width: 100%; margin-top: 16px;">✕ Close</button>
    </div>
  `;
  document.body.appendChild(modal);
  
  modal.querySelector('.closeBtn').addEventListener('click', ()=> modal.remove());
  
  modal.querySelectorAll('.markBtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const sid = Number(e.target.dataset.id);
      const idx = Number(e.target.dataset.idx);
      try {
        await api.submit(sid, idx);
        showAlert(`✓ Requirement marked complete`);
        modal.remove();
      } catch (err) {
        showAlert(`✗ Error marking requirement complete`, 'error');
      }
    });
  });
}

function showAlert(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = type === 'error' ? 'alert error' : 'alert';
  el.textContent = msg;
  alertsEl.appendChild(el);
  setTimeout(()=> el.remove(), 5000);
}

socket.on('connected', d => console.log('Connected:', d.message));
socket.on('studentAdded', s => { 
  students.push(s); 
  render(); 
  showAlert(`✓ Added ${s.name}`);
});
socket.on('studentUpdated', s => { 
  const i = students.findIndex(x => x.id === s.id); 
  if(i >= 0) students[i] = s; 
  else students.push(s); 
  render(); 
  showAlert(`✓ Updated ${s.name}`);
});
socket.on('alert', a => showAlert(a.message, 'info'));

document.getElementById('createForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('newName').value.trim();
  const studentId = document.getElementById('newStudentId').value.trim();
  
  if (!name || !studentId) {
    showAlert('✗ Please fill in all fields', 'error');
    return;
  }
  
  try {
    await api.create({ name, studentId });
    document.getElementById('createForm').reset();
  } catch (err) {
    showAlert('✗ Error adding student', 'error');
  }
});

(async function init() {
  try {
    students = await api.list();
    render();
  } catch (err) {
    console.error('Error initializing:', err);
    showAlert('✗ Error loading students', 'error');
  }
})();

