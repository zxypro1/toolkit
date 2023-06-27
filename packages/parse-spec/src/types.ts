export interface IStep {
    projectName: string;
    component: string;
    props: Record<string, any>;
    actions?: Record<string, any>;
    instance: any;
    order: number;
    access: string | undefined;
}

export interface IYaml {
    path: string;
    content: Record<string, any>;
    extend?: string;
    vars?: Record<string, any>;
    actions?: Record<string, any>[];
    access?: string;
}
export interface ISpec {
    steps: IStep[];
    yaml: IYaml;
}
export interface IOptions {
    method: string;
    access?: string;
}
