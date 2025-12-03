import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IResponse } from '../interfaces';

export type BacklogStatus = 'TO DO' | 'IN PROGRESS' | 'DONE';

export type SprintStatus =
  | 'BACKLOG'
  | 'PENDING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'COMPLETED_CONTAINER';

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
  status?: SprintStatus;
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
  status?: SprintStatus;
  items: IBacklogItemApi[];
}

@Injectable({ providedIn: 'root' })
export class BacklogService {
  private readonly baseUrl = 'backlog';
  private planinngURL = 'planning/';
  private simulationURL = 'simulation/';

  private sprintsSignal = signal<IBacklogSprint[]>([]);
  private searchTermSignal = signal<string>('');

  constructor(private http: HttpClient) {
    this.loadFromApi();
  }

  /* Actualizar sprint */
  updateSprintName(id: string, name: string) {
    const idNum = Number(id);
    if (!idNum) return;

    this.http.put<IResponse<any>>(
      `${this.baseUrl}/sprints/${idNum}`,
      { name }
    ).subscribe(() => this.loadFromApi());
  }

  updateSprintDates(id: string, dates: string) {
    const idNum = Number(id);
    if (!idNum) return;

    this.http.put<IResponse<any>>(
      `${this.baseUrl}/sprints/${idNum}`,
      { dates }
    ).subscribe(() => this.loadFromApi());
  }

  updateSprintFromDialog(
    id: string,
    payload: {
      name: string;
      goal: string;
      startDate: string;
      startTime: string;
      endDate: string;
      endTime: string;
    }
  ) {
    const idNum = Number(id);
    if (!idNum) return;

    this.http.put<IResponse<any>>(
      `${this.baseUrl}/sprints/${idNum}`,
      payload
    ).subscribe(() => this.loadFromApi());
  }

  /* Start / Complete Sprint */
  startSprint(id: string) {
    const idNum = Number(id);
    if (!idNum) return;
    this.http.put<IResponse<any>>(
      `${this.baseUrl}/sprints/${idNum}/start`,
      {}
    ).subscribe(() => this.loadFromApi());
  }

  completeSprint(id: string) {
    const idNum = Number(id);
    if (!idNum) return;
    this.http.put<IResponse<any>>(
      `${this.baseUrl}/sprints/${idNum}/complete`,
      {}
    ).subscribe(() => this.loadFromApi());
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
    const start = `${api.startDate || ''} ${api.startTime || ''}`.trim();
    const end = `${api.endDate || ''} ${api.endTime || ''}`.trim();

    const formattedDates =
      api.dates ||
      (start && end ? `${start} - ${end}` : '');
      
    return this.recalcStoryPoints({
      id: String(api.id),
      name: api.name,
      goal: api.goal ?? '',
      dates: formattedDates?.trim() ? formattedDates : undefined,
      startDate: api.startDate,
      startTime: api.startTime,
      endDate: api.endDate,
      endTime: api.endTime,
      status:
        api.name === 'Backlog'
          ? 'BACKLOG'
          : api.name === 'Sprints completados'
          ? 'COMPLETED_CONTAINER'
          : api.status ?? 'PENDING',
      storyPoints: { todo: 0, inProgress: 0, done: 0 },
      items: (api.items || []).map(it => this.mapItem(it))
    });
  }

  private loadFromApi() {
    this.http.get<IResponse<IBacklogSprintApi[]>>(this.baseUrl)
      .subscribe({
        next: res => {
          const mapped = (res.data || []).map(s => this.mapSprint(s));
          this.sprintsSignal.set(mapped);
        },
        error: err => console.error('Error cargando backlog', err)
      });
  }

  private recalcStoryPoints(sprint: IBacklogSprint): IBacklogSprint {
    const totals = { todo: 0, inProgress: 0, done: 0 };

    sprint.items.forEach(item => {
      const sp = item.storyPoints ?? 0;
      if (item.status === 'TO DO') totals.todo += sp;
      if (item.status === 'IN PROGRESS') totals.inProgress += sp;
      if (item.status === 'DONE') totals.done += sp;
    });

    return { ...sprint, storyPoints: totals };
  }

  /* SPRINTS */
  addSprint() {
    this.http.post<IResponse<any>>(
      `${this.baseUrl}/sprints`,
      {}
    ).subscribe(() => this.loadFromApi());
  }

  deleteSprint(sprintId: string) {
    const idNum = Number(sprintId);
    if (!idNum) return;
    this.http.delete<IResponse<null>>(
      `${this.baseUrl}/sprints/${idNum}`
    ).subscribe(() => this.loadFromApi());
  }

  /* HISTORIAS */
  addItem(sprintId: string) {
    const idNum = Number(sprintId);
    if (!idNum) return;

    this.http.post<IResponse<any>>(
      `${this.baseUrl}/items`,
      { sprintId: idNum }
    ).subscribe(() => this.loadFromApi());
  }

  deleteItem(sprintId: string, itemId: string) {
  const itemNum = Number(itemId);

  this.sprintsSignal.update(sprints =>
    sprints.map(s =>
      s.id === sprintId
        ? { ...s, items: s.items.filter(i => i.id !== itemId) }
        : s
    )
  );

  this.http.delete<IResponse<null>>(
    `${this.baseUrl}/items/${itemNum}`
  ).subscribe(() => this.loadFromApi());
}

  updateStatus(sprintId: string, itemId: string, status: BacklogStatus) {
    this.sprintsSignal.update(sprints =>
      sprints.map(s =>
        s.id === sprintId
          ? this.recalcStoryPoints({
              ...s,
              items: s.items.map(i =>
                i.id === itemId ? { ...i, status } : i
              )
            })
          : s
      )
    );

    this.http.put<IResponse<any>>(
      `${this.baseUrl}/items/${Number(itemId)}`,
      { status }
    ).subscribe();
  }

  updateModule(sprintId: string, itemId: string, module: string) {
    this.sprintsSignal.update(sprints =>
      sprints.map(s =>
        s.id === sprintId
          ? {
              ...s,
              items: s.items.map(i =>
                i.id === itemId ? { ...i, module } : i
              )
            }
          : s
      )
    );

    this.http.put<IResponse<any>>(
      `${this.baseUrl}/items/${Number(itemId)}`,
      { module }
    ).subscribe();
  }

  updateItemTitle(sprintId: string, itemId: string, title: string) {
    const clean = title.trim();
    if (!clean) return;

    this.sprintsSignal.update(sprints =>
      sprints.map(s =>
        s.id === sprintId
          ? {
              ...s,
              items: s.items.map(i =>
                i.id === itemId ? { ...i, title: clean } : i
              )
            }
          : s
      )
    );

    this.http.put<IResponse<any>>(
      `${this.baseUrl}/items/${Number(itemId)}`,
      { title: clean }
    ).subscribe();
  }

  updateItemStoryPoints(sprintId: string, itemId: string, storyPoints: number) {
    if (storyPoints < 0) return;

    this.sprintsSignal.update(sprints =>
      sprints.map(s =>
        s.id === sprintId
          ? this.recalcStoryPoints({
              ...s,
              items: s.items.map(i =>
                i.id === itemId ? { ...i, storyPoints } : i
              )
            })
          : s
      )
    );

    this.http.put<IResponse<any>>(
      `${this.baseUrl}/items/${Number(itemId)}`,
      { storyPoints }
    ).subscribe();
  }

  /* Actualizar historia */
  updateItemDetails(
    sprintId: string,
    itemId: string,
    payload: {
      title?: string;
      module?: string;
      description?: string;
      key?: string;
      subtasks?: IBacklogSubtask[];
    }
  ) {
    const num = Number(itemId);
    if (!num) return;

    const body: any = {};

    if (payload.title !== undefined) body.title = payload.title.trim();
    if (payload.module !== undefined) body.module = payload.module.trim();
    if (payload.description !== undefined) body.description = payload.description.trim();
    if (payload.key !== undefined) body.key = payload.key.trim();

    if (payload.subtasks !== undefined) {
    body.subtasks = payload.subtasks.map(st => ({
      id: null,
      code: st.id,
      title: st.title.trim(),
      description: st.description.trim(),
      status: st.status
    }));
  }


    this.sprintsSignal.update(sprints =>
      sprints.map(s =>
        s.id === sprintId
          ? this.recalcStoryPoints({
              ...s,
              items: s.items.map(i =>
                i.id === itemId
                  ? {
                      ...i,
                      ...payload,
                      subtasks: payload.subtasks
                    ? payload.subtasks.map(st => ({
                        id: st.id,
                        title: st.title,
                        description: st.description,
                        status: st.status
                      }))
                    : i.subtasks
                    }
                  : i
              )
            })
          : s
      )
    );

    this.http.put<IResponse<any>>(
      `${this.baseUrl}/items/${num}`,
      body
    ).subscribe(() => this.loadFromApi());
  }

  /* Mover historia */
  moveItemToSprint(fromSprintId: string, toSprintId: string, itemId: string) {
  const fromId = Number(fromSprintId);
  const toId = Number(toSprintId);
  const itemNum = Number(itemId);

  if (!fromId || !toId || !itemNum) return;

  this.sprintsSignal.update(sprints =>
    sprints.map(s => {
      if (s.id === fromSprintId) {
        return {
          ...s,
          items: s.items.filter(i => i.id !== itemId)
        };
      }

      if (s.id === toSprintId) {
        const allSprints = this.sprintsSignal();
        const fromSprint = allSprints.find(sp => sp.id === fromSprintId);
        const foundItem = fromSprint?.items.find(it => it.id === itemId);

        return {
          ...s,
          items: foundItem ? [...s.items, foundItem] : s.items
        };
      }

      return s;
    })
  );

  this.http.put<IResponse<any>>(
    `${this.baseUrl}/items/${itemNum}`,
    {
      sprintId: toId
    }
  ).subscribe(() => this.loadFromApi());
}

savePlanning(payload: any) {
    return this.http.post<any>(`${this.planinngURL}save`, payload);
  }

completeSimulation(simulationId: number) {
    return this.http.put(`${this.simulationURL}${simulationId}/complete`, {});
  }

}
