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
    yaml: {
        path: string;
        content: Record<string, any>;
    }
}

export interface IOptions {
    access?: string;
}

export interface IYaml {
    path: string;
    content: Record<string, any>;
    access: string;
    extend: string;
    vars: Record<string, any>;
}