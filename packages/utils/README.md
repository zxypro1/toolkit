## Exception
![](https://img.alicdn.com/imgextra/i4/O1CN01u9MGdL27uYklpE0BP_!!6000000007857-0-tps-1948-866.jpg)
- ApiException
Api 异常
```
{
	code: 200,
	type: "api",
	requestId: '',
	content: "",
}
```
- CheckedException
编译时异常，是在编译时就可以被捕获的异常
```
{
	type: "checked",
	content: "",
}
```

- UncaughtException
编译时异常，是在编译时就可以被捕获的异常
```
{
	type: "uncaught",
	content: "",
}
```
