import * as stdoutFormatter from '../src/stdout-formatter';

console.log(stdoutFormatter.getting('domain', 'todo.list.fc.xxxx.cn'));
console.log(stdoutFormatter.setting('function', 'cn-hangzhou/functionName'));
console.log(stdoutFormatter.creating('trigger', 'cn-hangzhou/functionName/triggerName'));
console.log(stdoutFormatter.updating('trigger', 'cn-hangzhou/functionName/triggerName'));
console.log(stdoutFormatter.removing('trigger', 'cn-hangzhou/functionName/triggerName'));
console.log(stdoutFormatter.checking('trigger', 'cn-hangzhou/functionName/triggerName'));
console.log(stdoutFormatter.checking('trigger', 'cn-hangzhou/functionName/triggerName', 'exists'));
console.log(stdoutFormatter.got('trigger', 'cn-hangzhou/functionName/triggerName'));
console.log(stdoutFormatter.set('trigger', 'cn-hangzhou/functionName/triggerName'));
console.log(stdoutFormatter.created('trigger', 'cn-hangzhou/functionName/triggerName'));
console.log(stdoutFormatter.updated('trigger', 'cn-hangzhou/functionName/triggerName'));
console.log(stdoutFormatter.removed('trigger', 'cn-hangzhou/functionName/triggerName'));
console.log(stdoutFormatter.checked('trigger', 'cn-hangzhou/functionName/triggerName', 'exists'));
console.log(stdoutFormatter.using('trigger', 'cn-hangzhou/functionName/triggerName'));
console.log(stdoutFormatter.retrying('trigger', 'create', 'cn-hangzhou/functionName/triggerName'));
console.log(stdoutFormatter.retrying('trigger', 'create', 'cn-hangzhou/functionName/triggerName', 2));
console.log(stdoutFormatter.retrying('trigger', 'create', 'cn-hangzhou/functionName/triggerName', 2, 5));
