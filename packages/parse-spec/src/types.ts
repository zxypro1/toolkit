export interface IStep {
    projectName: string;
    component: string;
    props: Record<string, any>;
    actions?: Record<string, any>;
    instance: any;
    order: number;
}
export interface ISpec {
    steps: IStep[];
    vars: Record<string, any>;
    yamlPath: string;
}