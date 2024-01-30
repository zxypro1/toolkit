// check-changed-packages.js
const { execSync } = require('child_process');
const path = require('path');

const getChangedPackages = () => {
  try {
    // 获取上一次提交的哈希值
    const lastCommitHash = execSync('git rev-parse HEAD~1').toString().trim();
    
    // 获取变更文件列表
    const changedFiles = execSync(`git diff --name-only ${lastCommitHash} HEAD`).toString().trim();
    
    // 过滤出变更的 src 目录文件所在路径
    const changedSrcFiles = changedFiles.split('\n').filter(file => file.includes(path.join('src', path.sep)));

    // 提取变更文件所在的包的名称
    const changedPackages = changedSrcFiles.map(file => path.dirname(file).split(path.sep)[1]);

    return [...new Set(changedPackages)]; // 去除重复项
  } catch (error) {
    console.error('Error while identifying changed packages:', error);
    return [];
  }
};

const changedPackages = getChangedPackages();
console.log(JSON.stringify(changedPackages));
