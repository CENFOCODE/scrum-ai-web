import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IResponse } from '../interfaces';

export type BacklogStatus = 'TO DO' | 'IN PROGRESS' | 'DONE';

export interface IBacklogSubtask {
  id: string;
  title: string;
  description: string;
  status: BacklogStatus;
}

export interface IBacklogItem {
  id: string;
  key: string;
  title: string;
  module: string;
  status: BacklogStatus;
  storyPoints: number;
  description?: string;
  subtasks?: IBacklogSubtask[];
}

export interface IBacklogSprint {
  id: string;
  name: string;
  goal: string;
  dates?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  storyPoints: {
    todo: number;
    inProgress: number;
    done: number;
  };
  items: IBacklogItem[];
}

interface IBacklogSubtaskApi {
  id: number;
  code: string;
  title: string;
  description: string;
  status: BacklogStatus;
}

interface IBacklogItemApi {
  id: number;
  key: string;
  title: string;
  moduleName: string;
  status: BacklogStatus;
  storyPoints: number;
  description: string;
  planningTicketId: number | null;
  subtasks: IBacklogSubtaskApi[];
}

interface IBacklogSprintApi {
  id: number;
  name: string;
  goal: string;
  dates?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  items: IBacklogItemApi[];
}

@Injectable({ providedIn: 'root' })
export class BacklogService {
  private readonly baseUrl = 'backlog';

  private sprintsSignal = signal<IBacklogSprint[]>([]);
  private searchTermSignal = signal<string>('');

  constructor(private http: HttpClient) {
    this.loadFromApi();
  }

  get sprints$() {
    return this.sprintsSignal;
  }

  get searchTerm$() {
    return this.searchTermSignal;
  }

  setSearchTerm(term: string) {
    this.searchTermSignal.set(term);
  }

  private mapSubtask(api: IBacklogSubtaskApi): IBacklogSubtask {
    return {
      id: api.code ?? '',
      title: api.title ?? '',
      description: api.description ?? '',
      status: api.status ?? 'TO DO'
    };
  }

  private mapItem(api: IBacklogItemApi): IBacklogItem {
    return {
      id: String(api.id),
      key: api.key,
      title: api.title,
      module: api.moduleName ?? 'Módulo',
      status: api.status ?? 'TO DO',
      storyPoints: api.storyPoints ?? 0,
      description: api.description ?? '',
      subtasks: (api.subtasks || []).map(st => this.mapSubtask(st))
    };
  }

  private mapSprint(api: IBacklogSprintApi): IBacklogSprint {
    const apiDates = (api.dates || '').trim();
    const hasRange = !!(api.startDate && api.endDate);
    const computedDates = hasRange
      ? `${api.startDate} ${api.startTime || ''} - ${api.endDate} ${api.endTime || ''}`.trim()
      : '';

    const sprint: IBacklogSprint = {
      id: String(api.id),
      name: api.name,
      goal: api.goal ?? '',
      dates: apiDates || computedDates,
      startDate: api.startDate,
      startTime: api.startTime,
      endDate: api.endDate,
      endTime: api.endTime,
      storyPoints: { todo: 0, inProgress: 0, done: 0 },
      items: (api.items || []).map(it => this.mapItem(it))
    };

    return this.recalcStoryPoints(sprint);
  }

  private loadFromApi() {
    this.http.get<IResponse<IBacklogSprintApi[]>>(this.baseUrl).subscribe({
      next: (res) => {
        const data = res.data || [];
        const mapped = data.map(s => this.mapSprint(s));
        this.sprintsSignal.set(mapped);
      },
      error: (err) => {
        console.error('Error cargando backlog', err);
      }
    });
  }

  private recalcStoryPoints(sprint: IBacklogSprint): IBacklogSprint {
    const totals = {
      todo: 0,
      inProgress: 0,
      done: 0
    };

    sprint.items.forEach(item => {
      const sp = item.storyPoints ?? 0;
      switch (item.status) {
        case 'TO DO':
          totals.todo += sp;
          break;
        case 'IN PROGRESS':
          totals.inProgress += sp;
          break;
        case 'DONE':
          totals.done += sp;
          break;
      }
    });

    return {
      ...sprint,
      storyPoints: totals
    };
  }

  /* CRUD de sprints e items */

  addSprint() {
    this.http.post<IResponse<IBacklogSprintApi>>(
      `${this.baseUrl}/sprints`,
      {}
    ).subscribe({
      next: () => this.loadFromApi(),
      error: (err) => console.error('Error creando sprint', err)
    });
  }

  deleteSprint(sprintId: string) {
    const idNum = Number(sprintId);
    if (!idNum) return;

    this.http.delete<IResponse<null>>(
      `${this.baseUrl}/sprints/${idNum}`
    ).subscribe({
      next: () => this.loadFromApi(),
      error: (err) => console.error('Error eliminando sprint', err)
    });
  }

  addItem(sprintId: string) {
    const sprintNum = Number(sprintId);
    if (!sprintNum) return;

    this.http.post<IResponse<IBacklogSprintApi>>(
      `${this.baseUrl}/items`,
      { sprintId: sprintNum }
    ).subscribe({
      next: () => this.loadFromApi(),
      error: (err) => console.error('Error agregando historia', err)
    });
  }

  deleteItem(sprintId: string, itemId: string) {
    const itemNum = Number(itemId);
    if (!itemNum) return;

    this.http.delete<IResponse<null>>(
      `${this.baseUrl}/items/${itemNum}`
    ).subscribe({
      next: () => this.loadFromApi(),
      error: (err) => console.error('Error eliminando historia', err)
    });
  }

  /* Actualizaciones de historias */

  updateStatus(sprintId: string, itemId: string, status: BacklogStatus) {
    this.sprintsSignal.update(sprints =>
      sprints.map(sprint => {
        if (sprint.id !== sprintId) return sprint;
        const updated: IBacklogSprint = {
          ...sprint,
          items: sprint.items.map(item =>
            item.id === itemId ? { ...item, status } : item
          )
        };
        return this.recalcStoryPoints(updated);
      })
    );

    const itemNum = Number(itemId);
    if (!itemNum) return;

    this.http.put<IResponse<any>>(
      `${this.baseUrl}/items/${itemNum}`,
      { status }
    ).subscribe({
      error: (err) => console.error('Error actualizando estado', err)
    });
  }

  updateModule(sprintId: string, itemId: string, module: string) {
    this.sprintsSignal.update(sprints =>
      sprints.map(sprint => {
        if (sprint.id !== sprintId) return sprint;
        return {
          ...sprint,
          items: sprint.items.map(item =>
            item.id === itemId ? { ...item, module } : item
          )
        };
      })
    );

    const itemNum = Number(itemId);
    if (!itemNum) return;

    this.http.put<IResponse<any>>(
      `${this.baseUrl}/items/${itemNum}`,
      { module }
    ).subscribe({
      error: (err) => console.error('Error actualizando módulo', err)
    });
  }

  updateItemTitle(sprintId: string, itemId: string, title: string) {
    const clean = title.trim();
    if (!clean) return;

    this.sprintsSignal.update(sprints =>
      sprints.map(sprint => {
        if (sprint.id !== sprintId) return sprint;
        return {
          ...sprint,
          items: sprint.items.map(item =>
            item.id === itemId ? { ...item, title: clean } : item
          )
        };
      })
    );

    const itemNum = Number(itemId);
    if (!itemNum) return;

    this.http.put<IResponse<any>>(
      `${this.baseUrl}/items/${itemNum}`,
      { title: clean }
    ).subscribe({
      error: (err) => console.error('Error actualizando título', err)
    });
  }

  updateItemStoryPoints(sprintId: string, itemId: string, storyPoints: number) {
    if (storyPoints < 0) return;

    this.sprintsSignal.update(sprints =>
      sprints.map(sprint => {
        if (sprint.id !== sprintId) return sprint;
        const updated: IBacklogSprint = {
          ...sprint,
          items: sprint.items.map(item =>
            item.id === itemId ? { ...item, storyPoints } : item
          )
        };
        return this.recalcStoryPoints(updated);
      })
    );

    const itemNum = Number(itemId);
    if (!itemNum) return;

    this.http.put<IResponse<any>>(
      `${this.baseUrl}/items/${itemNum}`,
      { storyPoints }
    ).subscribe({
      error: (err) => console.error('Error actualizando story points', err)
    });
  }

  updateItemDetails(
    sprintId: string,
    itemId: string,
    payload: {
      title?: string;
      module?: string;
      description?: string;
      subtasks?: IBacklogSubtask[];
      key?: string;
    }
  ) {
    const titleClean = payload.title?.trim();
    const moduleClean = payload.module?.trim();
    const descriptionClean =
      payload.description !== undefined ? payload.description.trim() : undefined;
    const keyClean = payload.key?.trim();

    this.sprintsSignal.update(sprints =>
      sprints.map(sprint => {
        if (sprint.id !== sprintId) return sprint;

        const updatedItems = sprint.items.map(item => {
          if (item.id !== itemId) return item;

          const updated: IBacklogItem = {
            ...item,
            ...(titleClean ? { title: titleClean } : {}),
            ...(moduleClean !== undefined ? { module: moduleClean } : {}),
            ...(descriptionClean !== undefined ? { description: descriptionClean } : {}),
            ...(keyClean ? { key: keyClean } : {}),
            ...(payload.subtasks
              ? {
                  subtasks: payload.subtasks.map(st => ({
                    ...st
                  }))
                }
              : {})
          };

          return updated;
        });

        return this.recalcStoryPoints({
          ...sprint,
          items: updatedItems
        });
      })
    );

    const itemNum = Number(itemId);
    if (!itemNum) return;

    const body: any = {};
    if (titleClean !== undefined) body.title = titleClean;
    if (moduleClean !== undefined) body.module = moduleClean;
    if (descriptionClean !== undefined) body.description = descriptionClean;
    if (keyClean !== undefined) body.key = keyClean;
    if (payload.subtasks !== undefined) body.subtasks = payload.subtasks;

    this.http.put<IResponse<any>>(
      `${this.baseUrl}/items/${itemNum}`,
      body
    ).subscribe({
      error: (err) => console.error('Error actualizando historia', err)
    });
  }

  /* Funciones Sprints */

  updateSprintName(sprintId: string, name: string) {
    const clean = name.trim();
    if (!clean) return;

    this.sprintsSignal.update(sprints =>
      sprints.map(sprint =>
        sprint.id === sprintId ? { ...sprint, name: clean } : sprint
      )
    );

    const idNum = Number(sprintId);
    if (!idNum) return;

    this.http.put<IResponse<any>>(
      `${this.baseUrl}/sprints/${idNum}`,
      { name: clean }
    ).subscribe({
      error: (err) => console.error('Error actualizando nombre de sprint', err)
    });
  }

  updateSprintDates(sprintId: string, dates: string) {
    const clean = dates.trim();

    this.sprintsSignal.update(sprints =>
      sprints.map(sprint =>
        sprint.id === sprintId ? { ...sprint, dates: clean } : sprint
      )
    );

    const idNum = Number(sprintId);
    if (!idNum) return;

    this.http.put<IResponse<any>>(
      `${this.baseUrl}/sprints/${idNum}`,
      { dates: clean }
    ).subscribe({
      error: (err) => console.error('Error actualizando dates de sprint', err)
    });
  }

  updateSprintFromDialog(
    sprintId: string,
    payload: {
      name: string;
      goal: string;
      startDate: string;
      startTime: string;
      endDate: string;
      endTime: string;
    }
  ) {
    const { name, goal, startDate, startTime, endDate, endTime } = payload;
    const nameClean = name.trim();
    const goalClean = goal.trim();

    const hasDates = startDate.trim() && endDate.trim();
    const datesLabel = hasDates
      ? `${startDate} ${startTime || ''} - ${endDate} ${endTime || ''}`.trim()
      : '';

    this.sprintsSignal.update(sprints =>
      sprints.map(sprint =>
        sprint.id === sprintId
          ? {
              ...sprint,
              name: nameClean || sprint.name,
              goal: goalClean || sprint.goal,
              startDate,
              startTime,
              endDate,
              endTime,
              dates: datesLabel
            }
          : sprint
      )
    );

    const idNum = Number(sprintId);
    if (!idNum) return;

    this.http.put<IResponse<any>>(
      `${this.baseUrl}/sprints/${idNum}`,
      {
        name: nameClean || undefined,
        goal: goalClean,
        startDate,
        startTime,
        endDate,
        endTime
      }
    ).subscribe({
      error: (err) => console.error('Error actualizando sprint desde modal', err)
    });
  }

  /* Mover historia a otro sprint */

  moveItemToSprint(fromSprintId: string, toSprintId: string, itemId: string) {
    if (fromSprintId === toSprintId) return;

    const itemNum = Number(itemId);
    const toNum = Number(toSprintId);
    if (!itemNum || !toNum) return;

    this.sprintsSignal.update(sprints => {
      let movingItem: IBacklogItem | null = null;

      const afterRemove = sprints.map(sprint => {
        if (sprint.id !== fromSprintId) return sprint;

        const remainingItems: IBacklogItem[] = [];
        for (const it of sprint.items) {
          if (it.id === itemId) {
            movingItem = it;
          } else {
            remainingItems.push(it);
          }
        }

        return this.recalcStoryPoints({
          ...sprint,
          items: remainingItems
        });
      });

      if (!movingItem) {
        return sprints;
      }

      const afterAdd = afterRemove.map(sprint => {
        if (sprint.id !== toSprintId) return sprint;

        const without = sprint.items.filter(it => it.id !== itemId);
        const newItems = [...without, movingItem as IBacklogItem];

        return this.recalcStoryPoints({
          ...sprint,
          items: newItems
        });
      });

      return afterAdd;
    });

    this.http.put<IResponse<any>>(
      `${this.baseUrl}/items/${itemNum}`,
      { sprintId: toNum }
    ).subscribe({
      error: (err) => console.error('Error moviendo historia de sprint', err)
    });
  }
}
