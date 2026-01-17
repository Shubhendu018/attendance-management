// Data storage
let students = JSON.parse(localStorage.getItem('students')) || [];
let attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || [];

// Set today's date as default
document.getElementById('attendanceDate').valueAsDate = new Date();
document.getElementById('filterDate').valueAsDate = new Date();

// Initialize
updateStudentDropdown();
updateClassFilter();
displayAttendance();
updateStats();

// Add Student Form
document.getElementById('addStudentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('studentName').value.trim();
    const rollNumber = document.getElementById('rollNumber').value.trim();
    const studentClass = document.getElementById('class').value.trim();
    const email = document.getElementById('email').value.trim();

    // Validation
    if (students.some(s => s.rollNumber === rollNumber)) {
        showMessage('Student with this roll number already exists!', 'error');
        return;
    }

    const student = {
        id: Date.now(),
        name,
        rollNumber,
        class: studentClass,
        email
    };

    students.push(student);
    localStorage.setItem('students', JSON.stringify(students));

    showMessage(`Student ${name} added successfully!`, 'success');
    this.reset();
    updateStudentDropdown();
    updateClassFilter();
    updateStats();
});

// Mark Attendance Form
document.getElementById('markAttendanceForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const studentId = parseInt(document.getElementById('selectStudent').value);
    const date = document.getElementById('attendanceDate').value;
    const status = document.getElementById('attendanceStatus').value;
    const remarks = document.getElementById('remarks').value.trim();

    const student = students.find(s => s.id === studentId);

    // Check if attendance already marked for this student on this date
    const existingIndex = attendanceRecords.findIndex(
        r => r.studentId === studentId && r.date === date
    );

    const record = {
        id: existingIndex >= 0 ? attendanceRecords[existingIndex].id : Date.now(),
        studentId,
        studentName: student.name,
        rollNumber: student.rollNumber,
        class: student.class,
        date,
        status,
        remarks
    };

    if (existingIndex >= 0) {
        attendanceRecords[existingIndex] = record;
        showMessage(`Attendance updated for ${student.name}`, 'success');
    } else {
        attendanceRecords.push(record);
        showMessage(`Attendance marked for ${student.name}`, 'success');
    }

    localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));

    this.reset();
    document.getElementById('attendanceDate').valueAsDate = new Date();
    displayAttendance();
    updateStats();
});

// Filter functionality
document.getElementById('filterClass').addEventListener('change', displayAttendance);
document.getElementById('filterDate').addEventListener('change', displayAttendance);
document.getElementById('filterStatus').addEventListener('change', displayAttendance);

function updateStudentDropdown() {
    const select = document.getElementById('selectStudent');
    select.innerHTML = '<option value="">-- Select Student --</option>';
    
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.rollNumber} - ${student.name} (${student.class})`;
        select.appendChild(option);
    });
}

function updateClassFilter() {
    const classes = [...new Set(students.map(s => s.class))];
    const select = document.getElementById('filterClass');
    select.innerHTML = '<option value="">All Classes</option>';
    
    classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls;
        option.textContent = cls;
        select.appendChild(option);
    });
}

function displayAttendance() {
    const filterClass = document.getElementById('filterClass').value;
    const filterDate = document.getElementById('filterDate').value;
    const filterStatus = document.getElementById('filterStatus').value;

    let filtered = attendanceRecords;

    if (filterClass) {
        filtered = filtered.filter(r => r.class === filterClass);
    }
    if (filterDate) {
        filtered = filtered.filter(r => r.date === filterDate);
    }
    if (filterStatus) {
        filtered = filtered.filter(r => r.status === filterStatus);
    }

    const tbody = document.getElementById('attendanceTableBody');
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #999;">
                    No attendance records found for the selected filters.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(record => `
        <tr>
            <td>${record.rollNumber}</td>
            <td>${record.studentName}</td>
            <td>${record.class}</td>
            <td>${formatDate(record.date)}</td>
            <td><span class="status ${record.status.toLowerCase()}">${record.status}</span></td>
            <td>${record.remarks || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning" onclick="editRecord(${record.id})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteRecord(${record.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function editRecord(id) {
    const record = attendanceRecords.find(r => r.id === id);
    if (!record) return;

    document.getElementById('selectStudent').value = record.studentId;
    document.getElementById('attendanceDate').value = record.date;
    document.getElementById('attendanceStatus').value = record.status;
    document.getElementById('remarks').value = record.remarks;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteRecord(id) {
    if (confirm('Are you sure you want to delete this attendance record?')) {
        attendanceRecords = attendanceRecords.filter(r => r.id !== id);
        localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
        showMessage('Attendance record deleted successfully', 'success');
        displayAttendance();
        updateStats();
    }
}

function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendanceRecords.filter(r => r.date === today);
    
    const present = todayRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
    const absent = todayRecords.filter(r => r.status === 'Absent').length;
    const rate = todayRecords.length > 0 ? ((present / todayRecords.length) * 100).toFixed(1) : 0;

    document.getElementById('totalStudents').textContent = students.length;
    document.getElementById('presentToday').textContent = present;
    document.getElementById('absentToday').textContent = absent;
    document.getElementById('attendanceRate').textContent = rate + '%';
}

function showMessage(text, type) {
    const msg = document.getElementById('message');
    msg.textContent = text;
    msg.className = `message ${type}`;
    
    setTimeout(() => {
        msg.className = 'message';
    }, 4000);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}