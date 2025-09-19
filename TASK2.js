// Advanced Task Progress Tracker JavaScript
class AdvancedTaskTracker {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.currentPriorityFilter = 'all';
        this.currentCategoryFilter = 'all';
        this.currentSort = 'created';
        this.searchQuery = '';
        this.isDarkTheme = this.loadTheme();
        this.init();
    }

    init() {
        this.bindEvents();
        this.applyTheme();
        this.renderTasks();
        this.updateStats();
        this.setupNotifications();
    }

    bindEvents() {
        // Form submission
        const form = document.getElementById('task-form');
        form.addEventListener('submit', (e) => this.addTask(e));

        // Search functionality
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // Priority filter buttons
        document.querySelectorAll('.priority-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setPriorityFilter(e.target.dataset.priority));
        });

        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        categoryFilter.addEventListener('change', (e) => this.setCategoryFilter(e.target.value));

        // Sort select
        const sortSelect = document.getElementById('sort-select');
        sortSelect.addEventListener('change', (e) => this.setSort(e.target.value));

        // Action buttons
        document.getElementById('export-btn').addEventListener('click', () => this.exportTasks());
        document.getElementById('import-btn').addEventListener('click', () => this.importTasks());
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('clear-all-btn').addEventListener('click', () => this.clearAllTasks());

        // Import file input
        document.getElementById('import-file').addEventListener('change', (e) => this.handleFileImport(e));
    }

    addTask(e) {
        e.preventDefault();
        const input = document.getElementById('task-input');
        const priority = document.getElementById('priority-select').value;
        const category = document.getElementById('category-select').value;
        const dueDate = document.getElementById('due-date').value;
        const notes = document.getElementById('task-notes').value.trim();
        const taskText = input.value.trim();

        if (taskText) {
            const task = {
                id: Date.now(),
                text: taskText,
                completed: false,
                priority: priority,
                category: category,
                dueDate: dueDate || null,
                notes: notes,
                createdAt: new Date().toISOString(),
                subtasks: [],
                tags: []
            };

            this.tasks.push(task);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.resetForm();
            this.showNotification('Task added successfully!', 'success');
        }
    }

    resetForm() {
        document.getElementById('task-input').value = '';
        document.getElementById('priority-select').value = 'medium';
        document.getElementById('category-select').value = 'general';
        document.getElementById('due-date').value = '';
        document.getElementById('task-notes').value = '';
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification(
                task.completed ? 'Task completed!' : 'Task marked as pending',
                task.completed ? 'success' : 'info'
            );
        }
    }

    deleteTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification('Task deleted!', 'warning');
        }
    }

    editTask(id, newText, newPriority, newCategory, newDueDate, newNotes) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            if (newText !== undefined) task.text = newText.trim();
            if (newPriority !== undefined) task.priority = newPriority;
            if (newCategory !== undefined) task.category = newCategory;
            if (newDueDate !== undefined) task.dueDate = newDueDate;
            if (newNotes !== undefined) task.notes = newNotes;
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.renderTasks();
            this.showNotification('Task updated!', 'success');
        }
    }

    addSubtask(taskId, subtaskText) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && subtaskText.trim()) {
            const subtask = {
                id: Date.now(),
                text: subtaskText.trim(),
                completed: false
            };
            task.subtasks.push(subtask);
            this.saveTasks();
            this.renderTasks();
        }
    }

    toggleSubtask(taskId, subtaskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const subtask = task.subtasks.find(s => s.id === subtaskId);
            if (subtask) {
                subtask.completed = !subtask.completed;
                this.saveTasks();
                this.renderTasks();
            }
        }
    }

    deleteSubtask(taskId, subtaskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
            this.saveTasks();
            this.renderTasks();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.updateFilterButtons();
        this.renderTasks();
    }

    setPriorityFilter(priority) {
        this.currentPriorityFilter = priority;
        this.updatePriorityFilterButtons();
        this.renderTasks();
    }

    setCategoryFilter(category) {
        this.currentCategoryFilter = category;
        this.renderTasks();
    }

    setSort(sort) {
        this.currentSort = sort;
        this.renderTasks();
    }

    handleSearch(query) {
        this.searchQuery = query.toLowerCase();
        this.renderTasks();
    }

    getFilteredTasks() {
        let filtered = this.tasks;

        // Filter by status
        switch (this.currentFilter) {
            case 'completed':
                filtered = filtered.filter(task => task.completed);
                break;
            case 'pending':
                filtered = filtered.filter(task => !task.completed);
                break;
            case 'overdue':
                filtered = filtered.filter(task => {
                    if (task.completed || !task.dueDate) return false;
                    return new Date(task.dueDate) < new Date();
                });
                break;
        }

        // Filter by priority
        if (this.currentPriorityFilter !== 'all') {
            filtered = filtered.filter(task => task.priority === this.currentPriorityFilter);
        }

        // Filter by category
        if (this.currentCategoryFilter !== 'all') {
            filtered = filtered.filter(task => task.category === this.currentCategoryFilter);
        }

        // Search filter
        if (this.searchQuery) {
            filtered = filtered.filter(task => 
                task.text.toLowerCase().includes(this.searchQuery) ||
                task.notes.toLowerCase().includes(this.searchQuery) ||
                task.category.toLowerCase().includes(this.searchQuery)
            );
        }

        // Sort tasks
        filtered.sort((a, b) => {
            switch (this.currentSort) {
                case 'due':
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case 'name':
                    return a.text.localeCompare(b.text);
                case 'category':
                    return a.category.localeCompare(b.category);
                default: // created
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        return filtered;
    }

    renderTasks() {
        const taskList = document.getElementById('task-list');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            taskList.innerHTML = `
                <div class="no-tasks">
                    <p>No tasks found</p>
                    <small>${this.searchQuery ? 'Try adjusting your search or filters' : 'Add a new task to get started!'}</small>
                </div>
            `;
            return;
        }

        taskList.innerHTML = filteredTasks.map(task => this.renderTask(task)).join('');
    }

    renderTask(task) {
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
        const priorityClass = `priority-${task.priority}`;
        const categoryClass = `category-${task.category}`;
        const overdueClass = isOverdue ? 'overdue' : '';
        
        const subtasksHtml = task.subtasks.length > 0 ? `
            <div class="subtasks">
                <h4>Subtasks (${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length})</h4>
                ${task.subtasks.map(subtask => `
                    <div class="subtask ${subtask.completed ? 'completed' : ''}">
                        <button class="complete-btn small" onclick="taskTracker.toggleSubtask(${task.id}, ${subtask.id})">
                            ${subtask.completed ? '✓' : ''}
                        </button>
                        <span class="subtask-text">${this.escapeHtml(subtask.text)}</span>
                        <button class="delete-btn small" onclick="taskTracker.deleteSubtask(${task.id}, ${subtask.id})" title="Delete subtask">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                            </svg>
                        </button>
                    </div>
                `).join('')}
                <div class="add-subtask">
                    <input type="text" placeholder="Add subtask..." class="subtask-input" 
                           onkeypress="if(event.key==='Enter') { this.value && taskTracker.addSubtask(${task.id}, this.value); this.value=''; }">
                </div>
            </div>
        ` : '';

        return `
            <div class="task-item ${task.completed ? 'completed' : ''} ${priorityClass} ${categoryClass} ${overdueClass}" data-id="${task.id}">
                <div class="task-header">
                    <div class="task-main">
                        <button class="complete-btn ${task.completed ? 'completed' : ''}" onclick="taskTracker.toggleTask(${task.id})">
                            ${task.completed ? '✓' : ''}
                        </button>
                        <div class="task-info">
                            <span class="task-text ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.text)}</span>
                            <div class="task-meta">
                                <span class="priority-badge ${task.priority}">${task.priority.toUpperCase()}</span>
                                <span class="category-badge ${task.category}">${task.category}</span>
                                ${task.dueDate ? `<span class="due-date ${isOverdue ? 'overdue' : ''}">Due: ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="edit-btn" onclick="taskTracker.editTaskPrompt(${task.id})" title="Edit task">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="delete-btn" onclick="taskTracker.deleteTask(${task.id})" title="Delete task">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                ${task.notes ? `<div class="task-notes">${this.escapeHtml(task.notes)}</div>` : ''}
                ${subtasksHtml}
                <div class="task-footer">
                    <small>Created: ${new Date(task.createdAt).toLocaleDateString()}</small>
                    ${task.updatedAt ? `<small>Updated: ${new Date(task.updatedAt).toLocaleDateString()}</small>` : ''}
                </div>
            </div>
        `;
    }

    editTaskPrompt(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            const newText = prompt('Edit task:', task.text);
            if (newText !== null && newText.trim()) {
                this.editTask(id, newText.trim());
            }
        }
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const overdueTasks = this.tasks.filter(t => {
            return t.dueDate && new Date(t.dueDate) < new Date() && !t.completed;
        }).length;
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        document.getElementById('total-tasks').textContent = totalTasks;
        document.getElementById('completed-tasks').textContent = completedTasks;
        document.getElementById('pending-tasks').textContent = pendingTasks;
        document.getElementById('progress-percentage').textContent = `${progressPercentage}%`;

        // Update progress bar
        const progressFill = document.getElementById('progress-fill');
        progressFill.style.width = `${progressPercentage}%`;

        // Update progress bar color based on completion
        if (progressPercentage === 100) {
            progressFill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
        } else if (progressPercentage >= 75) {
            progressFill.style.background = 'linear-gradient(90deg, #06b6d4, #0891b2)';
        } else if (progressPercentage >= 50) {
            progressFill.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
        } else {
            progressFill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
        }
    }

    updateFilterButtons() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${this.currentFilter}"]`).classList.add('active');
    }

    updatePriorityFilterButtons() {
        document.querySelectorAll('.priority-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-priority="${this.currentPriorityFilter}"]`).classList.add('active');
    }

    clearAllTasks() {
        if (this.tasks.length > 0) {
            const confirmed = confirm('Are you sure you want to delete all tasks? This action cannot be undone.');
            if (confirmed) {
                this.tasks = [];
                this.saveTasks();
                this.renderTasks();
                this.updateStats();
                this.showNotification('All tasks cleared!', 'warning');
            }
        }
    }

    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        this.showNotification('Tasks exported successfully!', 'success');
    }

    importTasks() {
        document.getElementById('import-file').click();
    }

    handleFileImport(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedTasks = JSON.parse(event.target.result);
                    if (Array.isArray(importedTasks)) {
                        this.tasks = [...this.tasks, ...importedTasks];
                        this.saveTasks();
                        this.renderTasks();
                        this.updateStats();
                        this.showNotification('Tasks imported successfully!', 'success');
                    } else {
                        throw new Error('Invalid file format');
                    }
                } catch (error) {
                    this.showNotification('Error importing tasks. Please check the file format.', 'error');
                }
            };
            reader.readAsText(file);
        }
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        this.applyTheme();
        this.saveTheme();
        this.showNotification(`Switched to ${this.isDarkTheme ? 'dark' : 'light'} theme!`, 'info');
    }

    applyTheme() {
        const body = document.body;
        const themeBtn = document.getElementById('theme-toggle');
        
        if (this.isDarkTheme) {
            body.classList.add('dark-theme');
            body.classList.remove('light-theme');
            themeBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                Light Theme
            `;
        } else {
            body.classList.add('light-theme');
            body.classList.remove('dark-theme');
            themeBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
                Dark Theme
            `;
        }
    }

    setupNotifications() {
        // Check for overdue tasks every minute
        setInterval(() => {
            const overdueTasks = this.tasks.filter(task => {
                return task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
            });
            
            if (overdueTasks.length > 0) {
                this.showNotification(`You have ${overdueTasks.length} overdue task(s)!`, 'warning');
            }
        }, 60000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    saveTasks() {
        localStorage.setItem('advancedTaskTracker_tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('advancedTaskTracker_tasks');
        return saved ? JSON.parse(saved) : [];
    }

    saveTheme() {
        localStorage.setItem('advancedTaskTracker_theme', this.isDarkTheme);
    }

    loadTheme() {
        const saved = localStorage.getItem('advancedTaskTracker_theme');
        return saved !== null ? JSON.parse(saved) : true;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the task tracker when the page loads
let taskTracker;
document.addEventListener('DOMContentLoaded', () => {
    taskTracker = new AdvancedTaskTracker();
});

// Add sample tasks if none exist
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (taskTracker.tasks.length === 0) {
            const sampleTasks = [
                {
                    id: Date.now() + 1,
                    text: 'Welcome to your advanced task tracker!',
                    completed: false,
                    priority: 'high',
                    category: 'general',
                    dueDate: null,
                    notes: 'This is a sample task to help you get started.',
                    createdAt: new Date().toISOString(),
                    subtasks: [],
                    tags: []
                },
                {
                    id: Date.now() + 2,
                    text: 'Explore all the new features',
                    completed: false,
                    priority: 'medium',
                    category: 'personal',
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    notes: 'Try adding subtasks, setting priorities, and using filters.',
                    createdAt: new Date().toISOString(),
                    subtasks: [
                        { id: Date.now() + 21, text: 'Try the priority system', completed: false },
                        { id: Date.now() + 22, text: 'Test the search functionality', completed: false },
                        { id: Date.now() + 23, text: 'Export your tasks', completed: false }
                    ],
                    tags: []
                },
                {
                    id: Date.now() + 3,
                    text: 'Customize your experience',
                    completed: false,
                    priority: 'low',
                    category: 'work',
                    dueDate: null,
                    notes: 'Switch themes, organize by categories, and set due dates.',
                    createdAt: new Date().toISOString(),
                    subtasks: [],
                    tags: []
                }
            ];
            taskTracker.tasks = sampleTasks;
            taskTracker.saveTasks();
            taskTracker.renderTasks();
            taskTracker.updateStats();
        }
    }, 1000);
});