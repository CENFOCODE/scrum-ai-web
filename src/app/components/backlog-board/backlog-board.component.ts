import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BacklogService,
  IBacklogItem,
  IBacklogSprint,
  BacklogStatus,
  IBacklogSubtask
} from '../../services/backlog.service';

@Component({
  selector: 'app-backlog-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './backlog-board.component.html',
  styleUrl: './backlog-board.component.scss'
})
export class BacklogBoardComponent {

  constructor(private backlogService: BacklogService) {}

  sprints = this.backlogService.sprints$;
  searchTerm = this.backlogService.searchTerm$;

  collapsed: Record<string, boolean> = {};
  editingNameId: string | null = null;
  editingNameValue = '';

  editingDatesId: string | null = null;
  editingDatesValue = '';

  // menú de sprint
  menuSprintId: string | null = null;

  // modal de edición de sprint
  editingSprint: IBacklogSprint | null = null;
  editForm = {
    name: '',
    goal: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: ''
  };

  // menú de item
  itemMenuId: string | null = null;

  // modal de edición de historia
  editingItem: { sprintId: string; item: IBacklogItem } | null = null;
  editItemForm = {
    title: '',
    description: '',
    module: ''
  };
  // subtareas en el modal
  editSubtasks: IBacklogSubtask[] = [];

  // modal "mover historia a otro sprint"
  movingItem: { sprintId: string; item: IBacklogItem } | null = null;
  targetSprintId: string = '';

  isCollapsed(sprint: IBacklogSprint): boolean {
    return !!this.collapsed[sprint.id];
  }

  filteredItems(sprint: IBacklogSprint): IBacklogItem[] {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return sprint.items;
    }
    return sprint.items.filter(item =>
      item.title.toLowerCase().includes(term) ||
      item.key.toLowerCase().includes(term)
    );
  }

  getStatusClass(status: BacklogStatus): string {
    switch (status) {
      case 'DONE':
        return 'csd-backlog-status-select--done';
      case 'IN PROGRESS':
        return 'csd-backlog-status-select--inprogress';
      case 'TO DO':
      default:
        return 'csd-backlog-status-select--todo';
    }
  }

  private recomputeSprintStoryPoints(sprint: IBacklogSprint) {
    const totals = { todo: 0, inProgress: 0, done: 0 };

    for (const item of sprint.items) {
      const points = Number(item.storyPoints) || 0;
      switch (item.status) {
        case 'DONE':
          totals.done += points;
          break;
        case 'IN PROGRESS':
          totals.inProgress += points;
          break;
        case 'TO DO':
        default:
          totals.todo += points;
          break;
      }
    }

    sprint.storyPoints = totals;
  }

  handleSearch(term: string) {
    this.backlogService.setSearchTerm(term);
  }

  toggleSprint(sprint: IBacklogSprint) {
    this.collapsed[sprint.id] = !this.isCollapsed(sprint);
  }

  startEditSprintName(sprint: IBacklogSprint) {
    this.editingNameId = sprint.id;
    this.editingNameValue = sprint.name;
  }

  saveSprintName(sprint: IBacklogSprint) {
    this.backlogService.updateSprintName(sprint.id, this.editingNameValue);
    this.editingNameId = null;
  }

  startEditDates(sprint: IBacklogSprint) {
    this.editingDatesId = sprint.id;
    this.editingDatesValue = sprint.dates ?? '';
  }

  saveSprintDates(sprint: IBacklogSprint) {
    this.backlogService.updateSprintDates(sprint.id, this.editingDatesValue);
    this.editingDatesId = null;
  }

  handleAddSprint() {
    this.backlogService.addSprint();
  }

  handleStartSprint(sprint: IBacklogSprint) {
    console.log('Start Sprint clicado', sprint);
    alert(`Iniciando ${sprint.name} (comportamiento demo).`);
  }

  openSprintMenu(sprint: IBacklogSprint) {
    this.menuSprintId = this.menuSprintId === sprint.id ? null : sprint.id;
  }

  handleEditSprintFromMenu(sprint: IBacklogSprint) {
    this.menuSprintId = null;
    this.openEditSprintDialog(sprint);
  }

  handleDeleteSprintFromMenu(sprint: IBacklogSprint) {
    this.menuSprintId = null;
    const confirmDelete = confirm(`¿Eliminar el sprint "${sprint.name}"?`);
    if (confirmDelete) {
      this.backlogService.deleteSprint(sprint.id);
    }
  }

  openEditSprintDialog(sprint: IBacklogSprint) {
    this.editingSprint = sprint;
    this.editForm = {
      name: sprint.name,
      goal: sprint.goal || '',
      startDate: sprint.startDate || '',
      startTime: sprint.startTime || '',
      endDate: sprint.endDate || '',
      endTime: sprint.endTime || ''
    };
  }

  closeEditSprintDialog() {
    this.editingSprint = null;
  }

  saveEditSprint() {
    if (!this.editingSprint) return;

    this.backlogService.updateSprintFromDialog(this.editingSprint.id, {
      name: this.editForm.name,
      goal: this.editForm.goal,
      startDate: this.editForm.startDate,
      startTime: this.editForm.startTime,
      endDate: this.editForm.endDate,
      endTime: this.editForm.endTime
    });

    this.editingSprint = null;
  }

  handleAddItem(sprint: IBacklogSprint) {
    this.backlogService.addItem(sprint.id);
    this.recomputeSprintStoryPoints(sprint);
  }

  handleStatusChange(
    sprint: IBacklogSprint,
    item: IBacklogItem,
    status: BacklogStatus | string
  ) {
    this.backlogService.updateStatus(
      sprint.id,
      item.id,
      status as BacklogStatus
    );
    this.recomputeSprintStoryPoints(sprint);
  }

  handleModuleChange(
    sprint: IBacklogSprint,
    item: IBacklogItem,
    module: string
  ) {
    this.backlogService.updateModule(sprint.id, item.id, module);
  }

  handleTitleBlur(
    sprint: IBacklogSprint,
    item: IBacklogItem,
    raw: string
  ) {
    this.backlogService.updateItemTitle(sprint.id, item.id, raw);
  }

  handleStoryPointsChange(
    sprint: IBacklogSprint,
    item: IBacklogItem,
    value: number | string
  ) {
    const parsed = Number(value);
    const points = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    item.storyPoints = points;
    this.backlogService.updateItemStoryPoints(sprint.id, item.id, points);
    this.recomputeSprintStoryPoints(sprint);
  }


  openItemMenu(sprint: IBacklogSprint, item: IBacklogItem) {
    this.itemMenuId = this.itemMenuId === item.id ? null : item.id;
  }

  handleEditItemFromMenu(sprint: IBacklogSprint, item: IBacklogItem) {
    this.itemMenuId = null;
    this.openEditItemDialog(sprint, item);
  }

  handleDeleteItemFromMenu(sprint: IBacklogSprint, item: IBacklogItem) {
    this.itemMenuId = null;
    const confirmDelete = confirm(`¿Eliminar la historia "${item.title}"?`);
    if (confirmDelete) {
      this.backlogService.deleteItem(sprint.id, item.id);
      this.recomputeSprintStoryPoints(sprint);
    }
  }

  handleMoveItemFromMenu(sprint: IBacklogSprint, item: IBacklogItem) {
    this.itemMenuId = null;
    this.movingItem = { sprintId: sprint.id, item };
    const available = this.sprints().filter(s => s.id !== sprint.id);
    this.targetSprintId = available.length ? available[0].id : '';
  }

  cancelMoveItem() {
    this.movingItem = null;
    this.targetSprintId = '';
  }

  confirmMoveItem() {
    if (!this.movingItem || !this.targetSprintId) return;

    this.backlogService.moveItemToSprint(
      this.movingItem.sprintId,
      this.targetSprintId,
      this.movingItem.item.id
    );

    this.movingItem = null;
    this.targetSprintId = '';
  }

  openEditItemDialog(sprint: IBacklogSprint, item: IBacklogItem) {
    this.editingItem = { sprintId: sprint.id, item };
    this.editItemForm = {
      title: item.title,
      description: item.description || '',
      module: item.module
    };
    this.editSubtasks = (item.subtasks || []).map(st => ({ ...st }));
  }

  closeEditItemDialog() {
    this.editingItem = null;
    this.editSubtasks = [];
  }

  addSubtask() {
    const newSubtask: IBacklogSubtask = {
      id: '',
      title: '',
      description: '',
      status: 'TO DO'
    };
    this.editSubtasks = [...this.editSubtasks, newSubtask];
  }

  removeSubtask(index: number) {
    const copy = [...this.editSubtasks];
    copy.splice(index, 1);
    this.editSubtasks = copy;
  }

  saveEditItem() {
    if (!this.editingItem) return;

    const cleanedSubtasks = this.editSubtasks
      .map(st => ({
        ...st,
        id: st.id.trim(),
        title: st.title.trim(),
        description: st.description.trim()
      }))
      .filter(st => st.id || st.title || st.description);

    this.backlogService.updateItemDetails(
      this.editingItem.sprintId,
      this.editingItem.item.id,
      {
        title: this.editItemForm.title,
        module: this.editItemForm.module,
        description: this.editItemForm.description,
        subtasks: cleanedSubtasks
      }
    );

    this.editingItem = null;
    this.editSubtasks = [];
  }
}
