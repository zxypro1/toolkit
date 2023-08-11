# v3
sl init --project shltest@dev.0.1 -d shltest --app-name appname -a new

# v2
sl init --project start-fc-http-nodejs14 -d start-fc-http-nodejs14 --app-name appname -a new


s3 init --project shltest -d shltest
s3 init --uri https://api.devsapp.cn/v3/packages/shltest/zipball/0.0.3 -d shltesturi
s3 init --project shltest --uri https://api.devsapp.cn/v3/packages/shltest/zipball/0.0.3 -d shltesturiproject

手动下载 https://api.devsapp.cn/v3/packages/shltest/zipball/0.0.3 
s3 init --uri shltest_zipball_0.0.3.zip -d shltestzip

git clone http://gitlab.alibaba-inc.com/serverless-devs-backup/apptest.git --depth=1
s3 init --uri apptest -d apptest123
