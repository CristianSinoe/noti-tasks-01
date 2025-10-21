import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RealtimeService } from './services/realtime.service';
import { TasksService, Task } from './services/tasks.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // Crear
  tasks: Task[] = [];
  title = '';
  description = '';
  dueAt = '';
  now = new Date();


  // Toast
  toast: string | null = null;
  private toastTimer: any;

  // Edición
  editId: string | null = null;
  editTitle = '';
  editDescription = '';
  editDueAt = ''; // yyyy-MM-ddTHH:mm para <input type="datetime-local">

  constructor(private rt: RealtimeService, private api: TasksService) { }

  ngOnInit(): void {
    // Cargar las tareas al iniciar
    this.load();

    // Recordatorios del scheduler
    this.rt.onNotification().subscribe(n => {
      this.showToast(`${n.title}: ${n.body}`);
    });

    // Eventos CRUD (incluye el título)
    this.rt.onTaskEvent().subscribe(e => {
      if (!e) return;

      if (e.type === 'TASK_CREATED')
        this.showToast(`Se creó la tarea: “${e.task.title}”.`);
      if (e.type === 'TASK_UPDATED')
        this.showToast(`Se actualizó la tarea: “${e.task.title}”.`);
      if (e.type === 'TASK_DELETED')
        this.showToast(`Se eliminó la tarea: “${e.task.title}”.`);
      if (e.type === 'TASK_SUBMITTED')
        this.showToast(`Se entregó la tarea: “${e.task.title}”.`);

      this.load();
    });

    // Ocultar el preloader cuando se termine la primera carga de tareas
    const originalLoad = this.load.bind(this);
    this.load = () => {
      originalLoad();
      // Esperamos un pequeño retardo para asegurar que el render esté completo
      setTimeout(() => (window as any).hideAppPreloader?.(), 5000000000000000000000000000000);
    };
  }



  // Traducción de estado
  statusEs(status: 'PENDING' | 'SUBMITTED' | 'LATE' | 'DONE') {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'SUBMITTED': return 'Entregada';
      case 'LATE': return 'Atrasada';
      case 'DONE': return 'Completada';
      default: return status;
    }
  }

  // Helpers de estado visual
  isDelivered(t: Task): boolean {
    return t.status === 'SUBMITTED' || t.status === 'DONE';
  }

  isLate(t: Task): boolean {
    // Si el backend ya marca LATE, respétalo.
    // Si no, calcula localmente con dueAt < ahora (y que no esté entregada).
    const due = new Date(t.dueAt).getTime();
    return t.status === 'LATE' || (due < Date.now() && !this.isDelivered(t));
  }


  // CRUD
  load() { this.api.list().subscribe(res => this.tasks = res); }

  create() {
    if (!this.title || !this.dueAt) { this.showToast('title y dueAt son obligatorios'); return; }
    const dto: Partial<Task> = {
      title: this.title,
      description: this.description,
      // datetime-local → ISO (el backend lo guarda como Date/UTC)
      dueAt: new Date(this.dueAt).toISOString()
    };
    this.api.create(dto)
      .subscribe(() => {
        this.title = '';
        this.description = '';
        this.dueAt = '';
        this.load();
      });
  }

  submit(t: Task) {
    if (t.status === 'SUBMITTED') return;
    this.api.submit(t.id).subscribe(() => this.load());
  }

  remove(t: Task) {
    this.api.remove(t.id).subscribe(() => this.load());
  }

  // Edición
  startEdit(t: Task) {
    this.editId = t.id;
    this.editTitle = t.title;
    this.editDescription = t.description ?? '';
    const dt = new Date(t.dueAt);
    const pad = (n: number) => String(n).padStart(2, '0');
    this.editDueAt = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  }

  cancelEdit() {
    this.editId = null;
    this.editTitle = '';
    this.editDescription = '';
    this.editDueAt = '';
  }

  saveEdit() {
    if (!this.editId) return;
    const dto: Partial<Task> = {
      title: this.editTitle,
      description: this.editDescription,
      dueAt: this.editDueAt ? new Date(this.editDueAt).toISOString() : undefined
    };
    this.api.update(this.editId, dto).subscribe(() => {
      this.cancelEdit();
      this.load();
      this.showToast('Tarea actualizada');
    });
  }

  // Toast
  private showToast(msg: string) {
    this.toast = msg;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast = null, 3500);
  }
}
