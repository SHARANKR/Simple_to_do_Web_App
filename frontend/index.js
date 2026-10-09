const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const taskList = document.getElementById('task-list');

async function getTasks() {
  const res = await fetch('http://localhost:3000/tasks');
  const tasks = await res.json();
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.textContent = task.task;
    li.style.textDecoration = task.completed ? 'line-through' : 'none';
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = task.completed ? 'Undo' : 'Done';
    toggleBtn.onclick = async () => {
      await fetch(`http://localhost:3000/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed })
      });
      getTasks();
    };
    li.appendChild(toggleBtn);
    taskList.appendChild(li);
  });
}

form.onsubmit = async (e) => {
  e.preventDefault();

  const task = input.value.trim();

  if (!task) {
    alert('Please enter a task');
    return;
  }

  try {
    // Send task to backend
    const response = await fetch('http://localhost:3000/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ task: task })
    });

    // Read backend response
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save task');
    }

    console.log('Task saved successfully:', data);

    // Clear input only after successful insertion
    input.value = '';

    // Reload tasks from MySQL through the backend
    await getTasks();

  } catch (error) {
    console.error('Error adding task:', error);
    alert('Failed to save task. Check the browser console.');
  }
};

getTasks();