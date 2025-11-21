import { Injectable, signal } from '@angular/core';

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

@Injectable({ providedIn: 'root' })
export class BacklogService {

  private sprintsSignal = signal<IBacklogSprint[]>([
    {
      id: '1',
      name: 'SC Sprint 1',
      goal: 'Objetivo del sprint: describe aquí el objetivo de este sprint.',
      dates: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      storyPoints: {
        todo: 2,
        inProgress: 11,
        done: 5
      },
      items: [
        {
          id: '1',
          key: 'SCRUM-0',
          title: 'Nombre de historia del product backlog',
          module: 'Módulo',
          status: 'IN PROGRESS',
          storyPoints: 3,
          description: '',
          subtasks: []
        },
        {
          id: '2',
          key: 'SCRUM-1',
          title: 'Nombre de historia del product backlog',
          module: 'Módulo',
          status: 'TO DO',
          storyPoints: 2,
          description: '',
          subtasks: []
        },
        {
          id: '3',
          key: 'SCRUM-2',
          title: 'Nombre de historia del product backlog',
          module: 'Módulo',
          status: 'DONE',
          storyPoints: 5,
          description: '',
          subtasks: []
        },
        {
          id: '4',
          key: 'SCRUM-3',
          title: 'Nombre de historia del product backlog',
          module: 'Módulo',
          status: 'IN PROGRESS',
          storyPoints: 8,
          description: '',
          subtasks: []
        }
      ]
    }
  ]);

  private searchTermSignal = signal<string>('');

  get sprints$() {
    return this.sprintsSignal;
  }

  get searchTerm$() {
    return this.searchTermSignal;
  }

  setSearchTerm(term: string) {
    this.searchTermSignal.set(term);
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
    this.sprintsSignal.update(sprints => {
      const nextIndex = sprints.length + 1;
      const newSprint: IBacklogSprint = {
        id: nextIndex.toString(),
        name: `SC Sprint ${nextIndex}`,
        goal: '',
        dates: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        storyPoints: {
          todo: 0,
          inProgress: 0,
          done: 0
        },
        items: []
      };
      return [...sprints, newSprint];
    });
  }

  deleteSprint(sprintId: string) {
    this.sprintsSignal.update(sprints =>
      sprints.filter(sprint => sprint.id !== sprintId)
    );
  }

  addItem(sprintId: string) {
    this.sprintsSignal.update(sprints =>
      sprints.map(sprint => {
        if (sprint.id !== sprintId) return sprint;

        const nextId = (sprint.items.length + 1).toString();
        const newItem: IBacklogItem = {
          id: nextId,
          key: 'SCRUM-0',
          title: 'Nombre de historia del product backlog',
          module: 'Módulo',
          status: 'TO DO',
          storyPoints: 0,
          description: '',
          subtasks: []
        };

        const updated: IBacklogSprint = {
          ...sprint,
          items: [...sprint.items, newItem]
        };

        return this.recalcStoryPoints(updated);
      })
    );
  }

  deleteItem(sprintId: string, itemId: string) {
    this.sprintsSignal.update(sprints =>
      sprints.map(sprint => {
        if (sprint.id !== sprintId) return sprint;

        const updated: IBacklogSprint = {
          ...sprint,
          items: sprint.items.filter(item => item.id !== itemId)
        };

        return this.recalcStoryPoints(updated);
      })
    );
  }

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
  }

  updateItemDetails(
    sprintId: string,
    itemId: string,
    payload: {
      title?: string;
      module?: string;
      description?: string;
      subtasks?: IBacklogSubtask[];
    }
  ) {
    const titleClean = payload.title?.trim();
    const moduleClean = payload.module?.trim();
    const descriptionClean =
      payload.description !== undefined ? payload.description.trim() : undefined;

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
            ...(payload.subtasks
              ? { subtasks: payload.subtasks.map(st => ({ ...st })) }
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
  }

  updateSprintName(sprintId: string, name: string) {
    const clean = name.trim();
    if (!clean) return;

    this.sprintsSignal.update(sprints =>
      sprints.map(sprint =>
        sprint.id === sprintId ? { ...sprint, name: clean } : sprint
      )
    );
  }

  updateSprintDates(sprintId: string, dates: string) {
    this.sprintsSignal.update(sprints =>
      sprints.map(sprint =>
        sprint.id === sprintId ? { ...sprint, dates: dates.trim() } : sprint
      )
    );
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

    const hasDates =
      startDate.trim() &&
      endDate.trim();

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
  }

  moveItemToSprint(fromSprintId: string, toSprintId: string, itemId: string) {
    if (fromSprintId === toSprintId) return;

    this.sprintsSignal.update(sprints => {
      let movingItem: IBacklogItem | null = null;

      let intermediate = sprints.map(sprint => {
        if (sprint.id !== fromSprintId) return sprint;

        const remainingItems: IBacklogItem[] = [];
        sprint.items.forEach(item => {
          if (item.id === itemId) {
            movingItem = item;
          } else {
            remainingItems.push(item);
          }
        });

        const updatedSprint: IBacklogSprint = {
          ...sprint,
          items: remainingItems
        };

        return this.recalcStoryPoints(updatedSprint);
      });

      if (!movingItem) {
        return sprints;
      }

      intermediate = intermediate.map(sprint => {
        if (sprint.id !== toSprintId) return sprint;

        const nextId = (sprint.items.length + 1).toString();
        const clonedItem: IBacklogItem = {
          ...movingItem!,
          id: nextId
        };

        const updatedSprint: IBacklogSprint = {
          ...sprint,
          items: [...sprint.items, clonedItem]
        };

        return this.recalcStoryPoints(updatedSprint);
      });

      return intermediate;
    });
  }
}
