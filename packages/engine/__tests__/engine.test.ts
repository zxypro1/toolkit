jest.mock('@serverless-devs/load-component');

//jest.mock('xstate');

import OriginalParseSpec, {
    ISpec,
    IStep,
    IYaml,
    IRecord,
    IActionLevel,
    IHookType,
    IActionType,
} from '@serverless-devs/parse-spec';

jest.mock('@serverless-devs/logger', () => {
    return jest.fn().mockImplementation(() => {
        return {
            __generate: jest.fn().mockReturnValue({
                // Your mock logger instance methods and properties here, e.g.
                log: jest.fn(),
                warn: jest.fn(),
                write: jest.fn(),
                debug: jest.fn(),
                // ... other methods and properties
            }),
            __unset: jest.fn(),
            __setSecret: jest.fn(),
            __clear: jest.fn(),
        };
    });
});

import { ILoggerInstance } from '@serverless-devs/logger';
const mockLogger: ILoggerInstance = {
    log: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    spin: jest.fn(),
    progress: jest.fn(),
    tips: jest.fn(),
    write: jest.fn(),
    append: jest.fn(),
    output: jest.fn(),
    setEol: jest.fn(),
    options: { file: 'mock/file/path' },
    disable: function (name: string): void {
        throw new Error('Function not implemented.');
    },
    enable: function (name: string): void {
        throw new Error('Function not implemented.');
    },
    redirect: jest.fn(),
    unredirect: jest.fn(),
    duplicate: jest.fn(),
    unduplicate: jest.fn(),
    reload: function (): void {
        throw new Error('Function not implemented.');
    },
    close: function (): void {
        throw new Error('Function not implemented.');
    },
    warn: function (msg: any, ...args: any[]): void {
        throw new Error('Function not implemented.');
    },
    clear: function (): void {
        throw new Error('Function not implemented.');
    },
    delete: function (key: string): boolean {
        throw new Error('Function not implemented.');
    },
    forEach: jest.fn(),
    get: jest.fn(),
    has: function (key: string): boolean {
        throw new Error('Function not implemented.');
    },
    set: jest.fn(),
    size: 0,
    entries: jest.fn(),
    keys: function (): IterableIterator<string> {
        throw new Error('Function not implemented.');
    },
    values: jest.fn(),
    [Symbol.iterator]: jest.fn(),
    [Symbol.toStringTag]: ''
} as any;

const mockSteps = [{
    projectName: 'mock-project',
    component: 'mock-component',
    props: {},
    order: 1,
    access: 'mock-access',
    logger: mockLogger,
    stepCount: '1',
}]

const mockYaml = {
    path: "mock-path",
    appName: "mock-appName",
    content: {},
    use3x: false,
    projectNames: [],
    actions: [{
        hookType: IHookType.PRE,
        actionType: IActionType.RUN,
        value: "mock-value",
        path: "mock-path",
        level: IActionLevel.PROJECT,
        projectName: "mock-project"
    }],
    useFlow: false,
    projects: {}
}

const mockAction = {
    start: jest.fn,
    setValue: jest.fn,
};

jest.mock('../src/actions', () => {
    const realImports = jest.requireActual('../src/actions');
    function MockActions() { }
    MockActions.prototype = Object.create(realImports.default.prototype);
    MockActions.prototype.start = jest.fn();
    MockActions.prototype.setValue = jest.fn;
    return {
        // Make Jest know it should be treated as a ES6 module and mock the default export correctly.
        // Ortherwise we should get the "TypeError: parse_spec_1.default is not a constructor" error.
        __esModule: true,
        default: MockActions
    }
})

jest.mock('@serverless-devs/parse-spec', () => {
    const realImports = jest.requireActual('@serverless-devs/parse-spec');
    function MockParseSpec() {
    }
    MockParseSpec.prototype = Object.create(realImports.default.prototype);
    MockParseSpec.prototype.start = function () {
        return {
            steps: mockSteps,
            yaml: mockYaml,
            projectName: "mock-project",
            command: "mock-command",
            access: "mock-access",
            version: "mock-version",
            output: "default",
            skipActions: false,
            help: false,
            debug: false
        };
    }
    return {
        // Make Jest know it should be treated as a ES6 module and mock the default export correctly.
        // Ortherwise we should get the "TypeError: parse_spec_1.default is not a constructor" error.
        __esModule: true,
        ...realImports,
        default: MockParseSpec
    };
});

jest.mock('@serverless-devs/utils', () => ({
    ...jest.requireActual('@serverless-devs/utils'),
    getRootHome: jest.fn().mockReturnValue('/mocked/home/path'),
    getAbsolutePath: jest.fn().mockReturnValue('mocked/absolute/path'),
    format: jest.fn().mockReturnValue('mocked-format'),
    //getGlobalConfig: jest.fn().mockReturnValue('mocked-global-config')
    getLockFile: jest.fn().mockReturnValue('mocked-locked-file'),
}));

jest.mock('../src/utils', () => ({
    ...jest.requireActual('../src/utils'),
    getCredential: jest.fn(),
}));

import Engine, { IStepOptions } from '../src';
import * as utils from '@serverless-devs/utils';
import Logger from '@serverless-devs/logger';
import { createMachine, interpret } from 'xstate';
import { STEP_STATUS } from '../src';
import ParseSpec from '@serverless-devs/parse-spec';
import chalk from 'chalk';
import { fail } from 'assert';
import { getCredential } from '../src/utils';

describe('Engine Class', () => {
    let engine: Engine;
    const mockOptions = {
        args: ['deploy'],
        cwd: './mock',
        template: './mock/basic.yaml',
    };
    let mockDownload: jest.SpyInstance;

    beforeEach(() => {
        engine = new Engine(mockOptions);
        (engine as any).glog = (engine as any).getLogger() as Logger;
        (engine as any).logger = mockLogger;
        (engine as any).actionInstance = mockAction;
        (engine as any).parseSpecInstance = new ParseSpec();
        mockDownload = jest.spyOn(engine as any, 'download');
        mockDownload.mockImplementation(() => Promise.resolve());
    });

    afterEach(() => {
        mockDownload.mockRestore()
    })

    describe('beforeStart() method', () => {
        it('should initialize spec and other variables', async () => {
            const context = await engine['beforeStart']();
            expect(engine['spec']).toBeDefined();
            expect(engine['spec'].steps).toEqual(mockSteps);
        });

        it('should set environment variables correctly', async () => {
            engine['options'].env = {
                TEST_ENV_1: 'value1',
                TEST_ENV_2: 'value2',
            };
            await engine['beforeStart']();
            expect(process.env.TEST_ENV_1).toBe('value1');
            expect(process.env.TEST_ENV_2).toBe('value2');
        });

        it('should validate parameters', async () => {
            const validateSpy = jest.spyOn(engine as any, 'validate');
            await engine['beforeStart']();
            expect(validateSpy).toHaveBeenCalled();
        });

        it('should download steps correctly', async () => {
            const downloadSpy = jest.spyOn(engine as any, 'download');
            await engine['beforeStart']();
            expect(downloadSpy).toHaveBeenCalledWith(mockSteps);
        });
    });


    describe('start() method', () => {
        it('should set initial status to RUNNING and handle no steps', async () => {
            // Mock necessary functions to make sure success.
            (engine as any).globalActionInstance = mockAction;
            engine['spec'] = { steps: mockSteps, yaml: mockYaml, command: '' };
            //engine['context'].steps = mockSteps;
            (getCredential as jest.Mock).mockResolvedValue('mocked-credential');
            jest.spyOn(engine as any, 'beforeStart').mockResolvedValue(undefined);
            jest.spyOn(engine as any, 'doSkip').mockResolvedValue(undefined);
            jest.spyOn(engine as any, 'doCompleted').mockResolvedValue(undefined);
            jest.spyOn(engine as any, 'getFilterContext').mockReturnValue([]);
            jest.spyOn(engine as any, 'handleSrc').mockImplementation(undefined);
            let mockGlobalActionStart = jest.spyOn(engine['globalActionInstance'], 'start');
            mockGlobalActionStart.mockImplementation(() => {
                return Promise.resolve({})
            });

            const context = await engine.start();
            expect(context.status).toBe('running')
            expect(engine.context.status).toBe(STEP_STATUS.RUNNING);

            // Have to restore the mock of globalActionInstance.start() to avoid effecting other cases.
            mockGlobalActionStart.mockRestore();
        });

        it('should handle beforeStart() failure', async () => {
            jest.spyOn((engine as any), 'beforeStart').mockRejectedValue(new Error('Mock Error'));
            const result = await engine.start();
            expect(result.status).toBe(STEP_STATUS.FAILURE);
            expect(result.completed).toBe(true);
            expect(result.error).toHaveLength(1);
        });

        it('should handle global pre-hook failure', async () => {
            (engine as any).globalActionInstance = mockAction;
            jest.spyOn(engine as any, 'beforeStart').mockResolvedValue(undefined);
            jest.spyOn(engine as any, 'doSkip').mockResolvedValue(undefined);
            jest.spyOn(engine as any, 'doCompleted').mockResolvedValue(undefined);
            jest.spyOn(engine as any, 'getFilterContext').mockReturnValue([]);
            jest.spyOn(engine as any, 'handleSrc').mockImplementation(undefined);
            let mockGlobalActionStart = jest.spyOn(engine['globalActionInstance'], 'start');
            mockGlobalActionStart.mockRejectedValue(new Error('Mock Global Pre Error'));
            engine['spec'] = { steps: mockSteps, yaml: mockYaml, command: '' };

            const result = await engine.start();
            expect(result.status).toBe(STEP_STATUS.FAILURE);
            expect(result.error).toHaveLength(1);

            // Have to restore the mock of globalActionInstance.start() to avoid effecting other cases.
            mockGlobalActionStart.mockRestore();
        });

        it('should skip subsequent steps if global status is FAILURE', async () => {
            // Mock necessary functions to make sure success.
            (engine as any).globalActionInstance = mockAction;
            engine['spec'] = { steps: mockSteps, yaml: mockYaml, command: '' };
            engine['context'].steps = mockSteps;
            (getCredential as jest.Mock).mockResolvedValue('mocked-credential');
            jest.spyOn(engine as any, 'beforeStart').mockResolvedValue(undefined);
            jest.spyOn(engine as any, 'doSkip').mockResolvedValue(undefined);
            jest.spyOn(engine as any, 'doCompleted').mockResolvedValue(undefined);
            jest.spyOn(engine as any, 'getFilterContext').mockReturnValue([]);
            //jest.spyOn(engine as any, 'handleSrc').mockRejectedValue(new Error('Mock Error'));
            jest.spyOn(engine as any, 'handleSrc').mockImplementation((item) => {
                (engine as any).recordContext(item, { done: true })
                // Set the record.status to failure to skip the second step. 
                engine['record'].status = STEP_STATUS.FAILURE;
            });
            let mockGlobalActionStart = jest.spyOn(engine['globalActionInstance'], 'start');
            mockGlobalActionStart.mockImplementation(() => {
                return Promise.resolve({})
            });

            // Not the real steps, but mocking for the test case
            engine.context.steps = [
                {
                    ...mockSteps[0],
                    stepCount: '0',
                    done: false
                },
                {
                    ...mockSteps[0],
                    stepCount: '1',
                    done: false
                }
            ];

            await engine.start();

            expect(engine.context.steps[0].done).toBe(true);
            expect(engine.context.steps[1].done).toBe(false);
        });

        it('handles step execution success', async () => {
            // Mock necessary functions to make sure success.
            (engine as any).globalActionInstance = mockAction;
            engine['spec'] = { steps: mockSteps, yaml: mockYaml, command: '' };
            engine['context'].steps = mockSteps;
            (getCredential as jest.Mock).mockResolvedValue('mocked-credential');
            jest.spyOn(engine as any, 'beforeStart').mockResolvedValue(undefined);
            jest.spyOn(engine as any, 'doSkip').mockResolvedValue(undefined);
            jest.spyOn(engine as any, 'doCompleted').mockResolvedValue(undefined);
            jest.spyOn(engine as any, 'getFilterContext').mockReturnValue([]);
            jest.spyOn(engine as any, 'handleSrc').mockImplementation(() => {
                engine['record'].status = STEP_STATUS.SUCCESS;
            });
            let mockGlobalActionStart = jest.spyOn(engine['globalActionInstance'], 'start');
            mockGlobalActionStart.mockImplementation(() => {
                return Promise.resolve({})
            });

            const context = await engine.start();
            expect(context.status).toBe('success')
            expect(engine.context.status).toBe(STEP_STATUS.SUCCESS);

            // Have to restore the mock of globalActionInstance.start() to avoid effecting other cases.
            mockGlobalActionStart.mockRestore();
        });
    });

    describe('getOutput() method', () => {
        it('should retrieve output from context steps', () => {
            engine.context.steps = [{
                ...mockSteps[0],
                projectName: 'testProj',
                output: { testKey: 'testValue' },
            }]
            const output = (engine as any).getOutput();
            expect(output).toHaveProperty('testProj');
            expect(output.testProj).toEqual({ testKey: 'testValue' });
        });

        it('should return an empty object if no outputs', () => {
            engine.context.steps = [];
            const output = (engine as any).getOutput();
            expect(output).toEqual({});
        });
    });

    describe('validate() method', () => {
        it('should throw an error if steps are missing', () => {
            (engine as any).spec = { steps: [], command: 'mock-command' }
            expect(() => (engine as any).validate()).toThrow();
        });

        it('should throw an error if command is missing', () => {
            (engine as any).spec = { steps: mockSteps, command: '' };
            expect(() => (engine as any).validate()).toThrow();
        });

        it('should not throw any error if steps and command are present', () => {
            (engine as any).spec = { steps: mockSteps, command: 'mock-command' }
            expect(() => (engine as any).validate()).not.toThrow();
        });
    });

    describe('download() method', () => {
        it('should download and initialize given steps', async () => {
            // Restore original implementation for this test.
            mockDownload.mockRestore();

            // Mock the loadComponent(), which is called by download().
            jest.mock('@serverless-devs/load-component', () => ({
                loadComponent: jest.fn().mockResolvedValue({
                    key: 'mockedData'
                })
            }))

            // Mock logger.
            const MockedLogger = require('@serverless-devs/logger');
            (engine as any).glog = new MockedLogger();

            // Mock downloading and initializing logic, and return mock steps
            const mockSteps = [{ projectName: 'test', component: 'mockComponent' }];
            const newSteps = await (engine as any).download(mockSteps);
            expect(newSteps).toBeInstanceOf(Array);
        });
    });

    describe('recordContext() method', () => {
        beforeEach(() => {
            (engine as any).context = {
                steps: [
                    { stepCount: '1', status: 'initial' },
                    { stepCount: '2', status: 'initial' },
                ],
                error: [],
                stepCount: '',
            }
        })

        it('updates step with matching stepCount', () => {
            const item = { stepCount: '1' };
            const options = { status: 'updated', error: new Error('test error'), props: {}, output: {}, done: true, process_time: 100 };

            (engine as any).recordContext(item, options);

            const updatedStep = (engine as any).context.steps.find((step: IStepOptions) => step.stepCount === '1');
            expect(updatedStep!.status).toBe('updated');
            expect(updatedStep!.error).toEqual(new Error('test error'));
            expect(updatedStep!.props).toEqual({});
            expect(updatedStep!.output).toEqual({});
            expect(updatedStep!.done).toBeTruthy();
            expect(updatedStep!.process_time).toBe(100);

            expect((engine as any).context.error).toContainEqual(new Error('test error'));
            expect((engine as any).context.stepCount).toBe('1');
        });

        it('does not update step without matching stepCount', () => {
            const item = { stepCount: '3' }; // This stepCount does not exist in the context
            const options = { status: 'updated' };

            (engine as any).recordContext(item, options);

            const step1 = (engine as any).context.steps.find((step: IStepOptions) => step.stepCount === '1');
            const step2 = (engine as any).context.steps.find((step: IStepOptions) => step.stepCount === '2');
            expect(step1!.status).toBe('initial');
            expect(step2!.status).toBe('initial');
        });

        it('pushes error to this.context.error if provided', () => {
            const item = { stepCount: '1' };
            const options = { error: new Error('test error') };

            (engine as any).recordContext(item, options);

            expect((engine as any).context.error).toContainEqual(new Error('test error'));
        });

    });

    describe('handleSrc() method', () => {
        // ... Add tests based on what handleSrc does.
        it('should handle when handleAfterSrc executes successfully', async () => {
            // Mock successful execution of handleAfterSrc
            jest.spyOn((engine as any), 'handleAfterSrc').mockResolvedValue('mockedValue');

            await engine['handleSrc'](mockSteps[0]);

            expect(engine['handleAfterSrc']).toHaveBeenCalledWith(mockSteps[0]);
            expect(engine['record'].status).not.toEqual(STEP_STATUS.FAILURE); // Assuming you have STEP_STATUS constants
        });

        it('should handle an error in handleAfterSrc but successfully execute actionInstance.start(IHookType.FAIL)', async () => {
            const mockError = new Error('Mock error for handleAfterSrc');
            jest.spyOn((engine as any), 'handleAfterSrc').mockRejectedValue(mockError);

            const actionInstanceStartMock = jest.spyOn(engine['actionInstance'], 'start')
                .mockImplementation((hookType) => {
                    if (hookType === IHookType.FAIL || hookType === IHookType.COMPLETE) {
                        return Promise.resolve({ pluginOutput: {} });
                    }
                    return Promise.reject(new Error('Unexpected hook type'));
                });

            let mockItem = mockSteps[0]
            await engine['handleSrc'](mockItem);

            expect(actionInstanceStartMock).toHaveBeenCalledWith(IHookType.FAIL, engine['record'].componentProps);
            expect(engine['record'].status).not.toEqual(STEP_STATUS.FAILURE); // Assuming the status would not be FAILURE since the FAIL hook executed successfully
        });

        it('should handle errors in both handleAfterSrc and actionInstance.start(IHookType.FAIL)', async () => {
            const mockErrorHandleSrc = new Error('Mock error for handleAfterSrc');
            const mockErrorHookFail = new Error('Mock error for IHookType.FAIL');
            jest.spyOn((engine as any), 'handleAfterSrc').mockRejectedValue(mockErrorHandleSrc);

            const actionInstanceStartMock = jest.spyOn(engine['actionInstance'], 'start')
                .mockImplementation((hookType) => {
                    if (hookType === IHookType.FAIL) {
                        return Promise.reject(mockErrorHookFail);
                    }
                    return Promise.reject(new Error('Unexpected hook type'));
                });

            let mockItem = mockSteps[0]
            await engine['handleSrc'](mockItem);

            expect(actionInstanceStartMock).toHaveBeenCalledWith(IHookType.FAIL, engine['record'].componentProps);
            expect(engine['record'].status).toEqual(STEP_STATUS.FAILURE);
        });

        it('should always attempt to trigger the project complete hook', async () => {
            jest.spyOn((engine as any), 'handleAfterSrc').mockResolvedValue(undefined);

            const actionInstanceStartMock = jest.spyOn(engine['actionInstance'], 'start').mockResolvedValue({});

            let mockItem = mockSteps[0]
            await engine['handleSrc'](mockItem);

            expect(actionInstanceStartMock).toHaveBeenCalledWith(IHookType.COMPLETE, {
                ...engine['record'].componentProps,
                output: expect.anything()
            });
        });

        it('should record the process time and mark the item as done', async () => {
            let mockItem = {
                ...mockSteps[0],
                stepCount: '1',
            }
            engine['context'].steps = [mockItem]
            engine['context'].stepCount = '1'
            engine['record'].startTime = Date.now();
            jest.spyOn((engine as any), 'handleAfterSrc').mockImplementation(() => {
                engine['record'].status = STEP_STATUS.SUCCESS
            });

            jest.spyOn(engine['actionInstance'], 'start').mockResolvedValue({});
            jest.spyOn((engine as any), 'getFilterContext').mockImplementation();

            await engine['handleSrc'](mockItem);

            console.log(engine['context'].steps)
            const updatedItem = engine['context'].steps.find(step => step.stepCount === mockItem.stepCount);
            if (updatedItem) {
                expect(updatedItem.done).toBe(true);
                expect(updatedItem.process_time).toBeGreaterThanOrEqual(0);
            } else {
                throw new Error('updatedItem is undefined');
            }
        });

        it('should log output for the record status success', async () => {
            jest.spyOn((engine as any), 'handleAfterSrc').mockImplementation(() => {
                engine['record'].status = STEP_STATUS.SUCCESS
            });

            jest.spyOn(engine['actionInstance'], 'start').mockResolvedValue({});
            jest.spyOn((engine as any), 'getFilterContext').mockImplementation();
            const loggerWriteMock = jest.spyOn(engine['logger'], 'write').mockImplementation();

            let mockItem = mockSteps[0]
            await engine['handleSrc'](mockItem);

            expect(loggerWriteMock).toHaveBeenCalledWith(expect.stringContaining('completed'));
        });

        it('should log output for the record status failure', async () => {
            jest.spyOn((engine as any), 'handleAfterSrc').mockImplementation(() => {
                engine['record'].status = STEP_STATUS.FAILURE
            });

            jest.spyOn(engine['actionInstance'], 'start').mockResolvedValue({});
            jest.spyOn((engine as any), 'getFilterContext').mockImplementation();
            const loggerWriteMock = jest.spyOn(engine['logger'], 'write').mockImplementation();

            let mockItem = mockSteps[0]
            await engine['handleSrc'](mockItem);

            expect(loggerWriteMock).toHaveBeenCalledWith(expect.stringContaining('failed to'));
        });
    });

    describe('handleAfterSrc() method', () => {
        it('should handle successful execution', async () => {
            // Mock necessary methods to ensure success
            jest.spyOn((engine as any), 'getProps').mockResolvedValue({});
            jest.spyOn(engine['actionInstance'], 'start').mockResolvedValue({});
            jest.spyOn(engine as any, 'getFilterContext').mockReturnValue([]);
            jest.spyOn((engine as any), 'doSrc').mockResolvedValue({});

            const mockItem = mockSteps[0];
            await engine['handleAfterSrc'](mockItem);

            expect(engine['record'].status).toBe(STEP_STATUS.SUCCESS);
        });

        it('should handle an error with continue-on-error set to true', async () => {
            // Mock methods to throw errors
            jest.spyOn(engine['parseSpecInstance'], 'parseActions').mockImplementation(() => {
                throw new Error('Failed')
            });

            // Mock item with continue-on-error true
            const mockItem = {
                ...mockSteps[0],
                'continue-on-error': true,
            };

            await engine['handleAfterSrc'](mockItem);

            // Add expectations here
            expect(engine['record'].status).toBe(STEP_STATUS.ERROR_WITH_CONTINUE);
        });

        it('should handle an error without continue-on-error', async () => {
            jest.spyOn(engine['parseSpecInstance'], 'parseActions').mockImplementation(() => {
                throw new Error('Failed')
            });

            // Mock item without continue-on-error
            const mockItem = {
                ...mockSteps[0],
                'continue-on-error': false,
            };

            await expect(engine['handleAfterSrc'](mockItem)).rejects.toThrow('Failed');
            expect(engine['record'].status).toBe(STEP_STATUS.FAILURE);
        });

        it('should update the record steps when item has an id', async () => {
            // Mock necessary methods for success
            jest.spyOn((engine as any), 'getProps').mockResolvedValue({});
            jest.spyOn(engine['actionInstance'], 'start').mockResolvedValue({});
            jest.spyOn(engine as any, 'getFilterContext').mockReturnValue([]);
            jest.spyOn((engine as any), 'doSrc').mockResolvedValue({});

            // Mock item with an id
            const mockItem = {
                ...mockSteps[0],
                id: 'testId',
            };

            await engine['handleAfterSrc'](mockItem);

            expect(engine['record'].steps['testId'].status).toBe(STEP_STATUS.SUCCESS);
        });

        it('should handle mutable global record status', async () => {
            // Mock necessary methods for success
            jest.spyOn((engine as any), 'getProps').mockResolvedValue({});
            jest.spyOn(engine['actionInstance'], 'start').mockResolvedValue({});
            jest.spyOn(engine as any, 'getFilterContext').mockReturnValue([]);
            jest.spyOn((engine as any), 'doSrc').mockResolvedValue({});

            engine['record'].editStatusAble = true;

            const mockItem = mockSteps[0];

            await engine['handleAfterSrc'](mockItem);

            expect(engine['record'].status).toBe(STEP_STATUS.SUCCESS);
        });

        it('should make global record status immutable after a failure', async () => {
            jest.spyOn(engine['parseSpecInstance'], 'parseActions').mockImplementation(() => {
                throw new Error('Failed')
            });

            engine['record'].editStatusAble = true;

            const mockItem = mockSteps[0];

            await expect(engine['handleAfterSrc'](mockItem)).rejects.toThrow('Failed');
            expect(engine['record'].editStatusAble).toBe(false);
        });
    })

    describe('doSrc() method', () => {
        describe('when projectName is defined', () => {
            const mockSpecWithProjectName = { steps: mockSteps, yaml: mockYaml, command: 'deploy', projectName: 'myProject' };

            it('should successfully execute the command method if it exists', async () => {
                const mockItem = {
                    ...mockSteps[0],
                    instance: {
                        deploy: jest.fn().mockResolvedValue('Success')
                    }
                };
                engine['spec'] = mockSpecWithProjectName;
                engine['context'].steps = mockSteps;

                await engine['doSrc'](mockItem);

                expect(mockItem.instance.deploy).toHaveBeenCalled();
            });

            it('should throw an error if the command method execution fails', async () => {
                const mockItem = {
                    ...mockSteps[0],
                    instance: {
                        deploy: jest.fn().mockRejectedValue(new Error('Failed'))
                    }
                };
                engine['spec'] = mockSpecWithProjectName;
                engine['context'].steps = mockSteps;

                await expect(engine['doSrc'](mockItem)).rejects.toThrowError('Failed');
            });

            it('should throw an error if the command method does not exist', async () => {
                const mockItem = {
                    ...mockSteps[0],
                    instance: {}
                };
                engine['spec'] = mockSpecWithProjectName;
                engine['context'].steps = mockSteps;

                await expect(engine['doSrc'](mockItem)).rejects.toThrow(`The [deploy] command was not found.`);
            });
        });

        describe('when projectName is not defined (Application level operation)', () => {
            const mockSpecWithoutProjectName = { steps: mockSteps, yaml: mockYaml, command: 'deploy' };

            it('should successfully execute the command method if it exists', async () => {
                const mockItem = {
                    ...mockSteps[0],
                    instance: {
                        deploy: jest.fn().mockResolvedValue('Success')
                    }
                };
                engine['spec'] = mockSpecWithoutProjectName;
                engine['context'].steps = mockSteps;

                await engine['doSrc'](mockItem);

                expect(mockItem.instance.deploy).toHaveBeenCalled();
            });

            it('should throw an error if the command method execution fails', async () => {
                const mockItem = {
                    ...mockSteps[0],
                    instance: {
                        deploy: jest.fn().mockRejectedValue(new Error('Failed'))
                    }
                };
                engine['spec'] = mockSpecWithoutProjectName;
                engine['context'].steps = mockSteps;

                await expect(engine['doSrc'](mockItem)).rejects.toThrow('Failed');
            });

            it('should log a warning if the command method does not exist', async () => {
                const mockItem = {
                    ...mockSteps[0],
                    instance: {}
                };
                engine['spec'] = mockSpecWithoutProjectName;
                engine['context'].steps = mockSteps;

                const loggerSpy = jest.spyOn(engine['logger'], 'tips');

                await engine['doSrc'](mockItem);

                expect(loggerSpy).toHaveBeenCalledWith(
                    `The [deploy] command was not found.`,
                    `Please check the component ${mockItem.component} has the deploy command. Serverless Devs documents：https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/command`
                );
            });
        });
    });

    describe('doSkip() method', () => {
        it('should mark the step with SKIP status if it has an id', async () => {
            const mockItem = { id: 'testId' };
            await (engine as any).doSkip(mockItem);
            expect((engine as any).record.steps).toHaveProperty('testId');
            expect((engine as any).record.steps.testId.status).toEqual(STEP_STATUS.SKIP);
        });

        it('should not throw any error if step does not have an id', async () => {
            const mockItem = {};
            await expect((engine as any).doSkip(mockItem)).resolves.not.toThrow();
        });
    });
});
