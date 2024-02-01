export const publishSchema = {
  "type": "object",
  "required": [
    "Edition",
    "Type",
    "Name",
    "Provider",
    "Version",
    "Description",
    "HomePage",
    "Tags",
    "Category",
    "Service",
    // "Commands",
    // "Organization",
    "Effective",
    "Parameters"
  ],
  "properties": {
    "Edition": {
      "type": "string",
      "enum": ["3.0.0"],
    },
    "Type": {
      "type": "string",
      "enum": [
        "Component", "Plugin", "Project"
      ]
    },
    "Name": {
      "type": "string"
    },
    "Provider": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "阿里云",
          "腾讯云",
          "华为云",
          "百度智能云",
          "AWS",
          "Azure",
          "Google Cloud Platform",
          "专有云",
          "其它",
          "Alibaba Cloud",
          "Tencent Cloud",
          "Huawei Cloud",
          "Baidu Cloud",
          "Private Cloud",
          "Others"
        ]
      }
    },
    "Version": {
      "type": "string"
    },
    "Description": {
      "type": "string"
    },
    "HomePage": {
      "type": "string",
      // "pattern": "^(https?|ftp)://[^\\s/$.?#].[^\\s]*$"
    },
    "Tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "Category": {
      "type": "string",
      "enum": [
        "人工智能",
        "Web 应用",
        "基础云服务",
        "新手入门",
        "开源项目",
        "Jamstack",
        "函数Connector",
        "IoT",
        "其它",
        "数据处理",
        "监控告警",
        "图文处理",
        "音视频处理",
        "全栈应用",
        "Web框架",
        "云应用",
        "基础云产品",
        "Artificial Intelligence",
        "Web Appilication",
        "Basic cloud services",
        "onboarding",
        "Open Source",
        "Function Connector",
        "Others",
        "Big Data",
        "Monitoring alarm",
        "Image and text processing",
        "Audio and video processing",
        "Fullstack application",
        "Web Framework",
        "Cloud Application",
        "Basic cloud products"
      ]
    },
    "Service": {
      "type": "object",
      // schema 提示不友好，依赖后端错误返回结果
      // "patternProperties": {
      //   "^(函数计算|对象存储|内容分发网络|资源编排|硬盘挂载|专有网络|日志服务|容器镜像服务|事件总线|表格存储|Serverless应用引擎|云数据库RDS MySQL 版|视频点播|智能媒体服务|媒体处理|低代码音视频工厂|音视频通信|其它|FC|OSS|CDN|ROS|NAS|VPC|SLS|CR|EventBridge|Tablestore|SAE|RDS MySQL|VOD|ICE|MTS|IMP|RTC|Other)$": {
      //     "type": "object",
      //     "properties": {
      //       "Authorities": {
      //         "type": "array",
      //         "items": {
      //           "type": "string"
      //         }
      //       },
      //       "Runtime": {
      //         "type": "string"
      //       }
      //     },
      //     "required": ["Authorities"]
      //   }
      // },
      // "additionalProperties": false
    },
    "Organization": {
      "type": "string"
    },
    "Effective": {
      "type": "string",
      "enum": [
        "Public",
        "Private",
        "Organization"
      ]
    },
    "Parameters": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string"
        },
        "additionalProperties": {
          "type": "boolean"
        },
        "required": {
          "type": "array"
        },
        "properties": {
          "type": "object"
        },
      }
    }
  }
}