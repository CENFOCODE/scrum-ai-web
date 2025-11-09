import { Injectable, signal } from "@angular/core";
import { IScenario, IResponse, ISearch } from "../interfaces";
import { BaseService } from "./base-service";

@Injectable({
  providedIn: 'root'
})
export class ScenarioService extends BaseService<IScenario> {
    protected override source: string = 'scenario';
    private scenarioSignal = signal<IScenario[]>([]);

    get scenario$() {
        return this.scenarioSignal;
    }

 public search: ISearch = { 
    page: 1,
    size: 10
  }
  public totalItems: any = [];
    getAll() {
          this.findAllWithParams({ page: this.search.page, size: this.search.size}).subscribe({
            next: (response: IResponse<IScenario[]>) => {
              this.search = {...this.search, ...response.meta};
              this.totalItems = Array.from({length: this.search.totalPages ? this.search.totalPages: 0}, (_, i) => i+1);
              this.scenarioSignal.set(response.data);
            },
            error: (err: any) => {
              console.error('error', err);
            }
          });
        }
}