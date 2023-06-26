export interface IStep {
    projectName: string;
    component: string;
    props: Record<string, any>;
    actions?: Record<string, any>;
    instance: any;
    order: number;
    access: string | undefined;
}
export interface ISpec {
    steps: IStep[];
    vars: Record<string, any>;
    yamlPath: string;
}

export interface IOptions {
    access: string | undefined;
}

export interface IYaml {
    path: string;
    content: Record<string, any>;
    access: string;
    extend: string;
    vars: Record<string, any>;
}