import Actions from '../src/actions';
import fs from 'fs-extra';
import { command } from 'execa';
import loadComponent from '@serverless-devs/load-component';
import { IActionLevel, IActionType } from '@serverless-devs/parse-spec';
import Logger, { ILoggerInstance } from '@serverless-devs/logger';

jest.mock('fs-extra');
jest.mock('execa');
jest.mock('@serverless-devs/load-component');

describe('Actions class', () => {

    let logger: ILoggerInstance;
    let actionsInstance: Actions;

    beforeEach(() => {
        logger = new Logger({
            traceId: "test-trace-id",
            logDir: 'logs',
        }).__generate('actions-test');
        actionsInstance = new Actions([], { hookLevel: IActionLevel.PROJECT, logger: logger });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('start method', () => {
        it('should handle error for GLOBAL hook level', async () => {
            const option = { hookLevel: IActionLevel.GLOBAL, logger: logger };
            const actionsInstanceWithGlobal = new Actions([], option);
            const mockAfterStart = jest.spyOn(actionsInstanceWithGlobal as any, 'afterStart').mockRejectedValueOnce(new Error('Test Error'));
            await expect(actionsInstanceWithGlobal.start('pre')).rejects.toThrow('Test Error');
            expect(mockAfterStart).toHaveBeenCalled();
        });
    });

    describe('afterStart', () => {
        it('should return {} when skipActions is true', async () => {
            const options = { skipActions: true, hookLevel: IActionLevel.PROJECT, logger: logger };
            const actionsInstanceWithSkip = new Actions([], options);
            const result = await actionsInstanceWithSkip['afterStart']('pre', {});
            expect(result).toEqual({});
        });

        it('should return {} when no hooks match the hookType', async () => {
            const result = await actionsInstance['afterStart']('fail', {});
            expect(result).toEqual({});
        });

        it('should call run for RUN action type', async () => {
            const options = { hookLevel: IActionLevel.PROJECT, logger: logger };
            const actionsInstanceWithRun = new Actions([{
                hookType: 'pre',
                value: 'test',
                projectName: 'test',
                path: 'test',
                level: 'Project',
                actionType: IActionType.RUN
            }], options);
            const runMock = jest.spyOn(actionsInstanceWithRun as any, 'run').mockResolvedValueOnce(undefined);
            await actionsInstanceWithRun['afterStart']('pre', {});
            expect(runMock).toHaveBeenCalled();
        });

        it('should call plugin for PLUGIN action type', async () => {
            const options = { hookLevel: IActionLevel.PROJECT, logger: logger };
            const actionsInstanceWithPlugin = new Actions([{
                hookType: 'complete',
                value: 'test',
                projectName: 'test',
                level: 'Project',
                actionType: IActionType.PLUGIN
            }], options);
            const pluginMock = jest.spyOn(actionsInstanceWithPlugin as any, 'plugin').mockResolvedValueOnce(undefined);
            await actionsInstanceWithPlugin['afterStart']('complete', {});
            expect(pluginMock).toHaveBeenCalled();
        });

        it('should call plugin for PLUGIN action type', async () => {
            const options = { hookLevel: IActionLevel.GLOBAL, logger: logger };
            const actionsInstanceWithComponent = new Actions([{
                hookType: 'complete',
                value: 'test',
                projectName: 'test',
                level: 'Project',
                actionType: IActionType.COMPONENT
            }], options);
            const componentMock = jest.spyOn(actionsInstanceWithComponent as any, 'component').mockResolvedValueOnce(undefined);
            await actionsInstanceWithComponent['afterStart']('complete', {});
            expect(componentMock).toHaveBeenCalled();
        });
    });

    describe('run method', () => {
        it('should handle when directory does not exist', async () => {
            (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
            const hook: any = { path: '/path/to/nonexistent/dir', value: 'echo hello' };
            await expect(actionsInstance['run'](hook)).rejects.toThrow('The /path/to/nonexistent/dir directory does not exist.');
        });

        it('should run command in existing directory', async () => {
            (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
            (fs.lstatSync as jest.Mock).mockReturnValueOnce({ isDirectory: jest.fn(() => true) });

            let capturedStdoutData: string | null = null;
            const mockStdout = {
                on: jest.fn().mockImplementation((event, handler) => {
                    if (event === 'data') {
                        handler(Buffer.from('hello'));
                        capturedStdoutData = Buffer.from('hello').toString();
                    }
                })
            };
            const mockStderr = { on: jest.fn() };

            (command as jest.Mock).mockReturnValueOnce({
                stdout: mockStdout,
                stderr: mockStderr,
                on: jest.fn().mockImplementation((event, handler) => handler(0))  // Simulating exit code 0
            });

            const hook: any = { path: './', value: 'echo hello' };

            // Run the method
            await actionsInstance['run'](hook);

            // Verify that the command was called correctly
            expect(command).toHaveBeenCalledWith('echo hello', expect.objectContaining({ cwd: './' }));

            // Check the output of the command
            expect(capturedStdoutData).toBe('hello');
        });

        it('should handle command execution error', async () => {
            (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
            (fs.lstatSync as jest.Mock).mockReturnValueOnce({ isDirectory: jest.fn(() => true) });
            const mockCommand = command as jest.Mock;
            mockCommand.mockReturnValueOnce({
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn((event, callback) => callback('Error message')) },
                on: jest.fn().mockImplementation((event, handler) => handler(127))  // Simulating exit code 127 to indicate error.
            });

            const hook: any = { path: './', value: 'echo hello' };
            await expect(actionsInstance['run'](hook)).rejects.toThrow('Error message');
        });

    });

    describe('plugin method', () => {
        it('should handle plugin execution error', async () => {
            const mockLoadComponent = loadComponent as jest.Mock;
            mockLoadComponent.mockRejectedValueOnce(new Error('Plugin Load Error'));

            const hook: any = { value: 'some-plugin' };
            await expect(actionsInstance['plugin'](hook)).rejects.toThrow('Plugin Load Error');
        });


        it('should execute plugin successfully', async () => {
            const mockLoadComponent = loadComponent as jest.Mock;
            mockLoadComponent.mockResolvedValueOnce(jest.fn(() => ({ key: 'value' })));

            const hook: any = { value: 'some-plugin' };
            await actionsInstance['plugin'](hook);

            expect(actionsInstance['record'].pluginOutput).toEqual({ key: 'value' });
        });
    });

    describe('component method', () => {
        it('should handle missing component command', async () => {
            const mockLoadComponent = loadComponent as jest.Mock;
            mockLoadComponent.mockResolvedValueOnce({});

            const hook: any = { value: 'componentName commandName' };
            await expect(actionsInstance['component'](hook)).rejects.toThrow('The [commandName] command was not found.');
        });

        it('should handle component command execution error', async () => {
            const mockInstanceCommand = jest.fn(() => {
                throw new Error('Component Command Error');
            });
            const mockLoadComponent = loadComponent as jest.Mock;
            mockLoadComponent.mockResolvedValueOnce({ commandName: mockInstanceCommand });

            const hook: any = { value: 'componentName commandName' };
            await expect(actionsInstance['component'](hook)).rejects.toThrow('Component Command Error');
        });

        it('should execute component command successfully', async () => {
            const mockInstanceCommand = jest.fn(() => ({ result: 'success' }));
            const mockLoadComponent = loadComponent as jest.Mock;
            mockLoadComponent.mockResolvedValueOnce({ commandName: mockInstanceCommand });

            const hook: any = { value: 'componentName commandName' };
            const result = await actionsInstance['component'](hook);

            expect(result).toEqual({ result: 'success' });
        });
    });

    describe('setValue method', () => {
        it('should set the value in the record when skipActions is not true', () => {
            actionsInstance.setValue('testKey', 'testValue');
            expect((actionsInstance['record'] as any).testKey).toBe('testValue');
        });

        it('should not set the value in the record when skipActions is true', () => {
            const options = { skipActions: true, hookLevel: IActionLevel.PROJECT, logger: logger };
            const actionsInstanceWithSkip = new Actions([], options);
            actionsInstanceWithSkip.setValue('testKey', 'testValue');
            expect((actionsInstanceWithSkip['record'] as any).testKey).toBeUndefined();
        });
    });
});

