import { Injectable, signal } from "@angular/core";
import { IResponse, IScenarioTemplate, ISearch } from "../interfaces";
import { BaseService } from "./base-service";

@Injectable({
    providedIn: 'root'
})
export class ScenarioTemplateService extends BaseService<IScenarioTemplate> {
    protected override  source: string = 'scenario-template';
    private templateSignal = signal<IScenarioTemplate[]>([]);

    get templateSignal$() {
        return this.templateSignal;
    }
    public search: ISearch = {
        page: 1,
        size: 10
    }

    public totalItems: any = [];

  

    
    
     
    getTemplate(scenarioId: number, difficulty: number, role: string) {
        const params = {
            scenarioId: scenarioId.toString(),
            difficulty: difficulty.toString(),
            role: role
        };
        
        return this.findAllWithParams(params);
    }

  
    mapDifficultyToNumber(difficulty: string): number {
        const difficultyMap: Record<string, number> = {
            'Baja': 1,
            'Media': 2,
            'Alta': 3
        };
        
        const result = difficultyMap[difficulty] || 1;
        return result;
    }


}