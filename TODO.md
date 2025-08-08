<!-- {
  "name": "open_crosspost",
  "status": "INACTIVE",
  "schedule": null,
  "source": {
    "pluginId": "@curatedotfun/masa-source",
    "config": {
      "secrets": {
        "apiKey": "{{MASA_API_KEY}}"
      }
    },
    "search": {
      "type": "twitter",
      "query": "@open_crosspost #feedback",
      "pageSize": 10
    }
  },
  "pipeline": {
    "steps": [
      {
        "pluginId": "@curatedotfun/simple-transform",
        "config": {
          "variables": {
            "template": "hello {{content}}"
          }
        },
        "stepId": "transform-1"
      },
      {
        "pluginId": "@curatedotfun/object-transform",
        "config": {
          "variables": {
            "mappings": {
              "content": "goodbye {{content}}"
            }
          }
        },
        "stepId": "transform-2"
      },
      {
        "pluginId": "@curatedotfun/simple-transform",
        "config": {
          "variables": {
            "template": "hello {{content}}"
          }
        },
        "stepId": "transform-3"
      }
    ],
    "env": {
      "secrets": [
        "MASA_API_KEY"
      ]
    }
  },
  "state": {
    "data": {
      "currentAsyncJob": {
        "status": "submitted",
        "workflowId": "65d4e833-14d5-4df1-a295-566b70917277",
        "submittedAt": "2025-08-06T20:28:04.330Z"
      },
      "latestProcessedId": "1940686176412950952"
    }
  }
} -->

<!-- 
{
  "name": "near_legion",
  "status": "ACTIVE",
  "schedule": null,
  "source": {
    "pluginId": "@curatedotfun/masa-source",
    "config": {
      "secrets": {
        "apiKey": "{{MASA_API_KEY}}"
      }
    },
    "search": {
      "type": "twitter",
      "query": "NEARLegion (#NearLegion OR #DecentralizedAI)",
      "pageSize": 10
    }
  },
  "pipeline": {
    "steps": [
      {
        "pluginId": "@curatedotfun/simple-transform",
        "config": {
          "variables": {
            "template": "hello {{content}}"
          }
        },
        "stepId": "transform-1"
      },
      {
        "pluginId": "@curatedotfun/object-transform",
        "config": {
          "variables": {
            "mappings": {
              "content": "goodbye {{content}}"
            }
          }
        },
        "stepId": "transform-2"
      },
      {
        "pluginId": "@curatedotfun/simple-transform",
        "config": {
          "variables": {
            "template": "hello {{content}}"
          }
        },
        "stepId": "transform-3"
      }
    ],
    "env": {
      "secrets": [
        "MASA_API_KEY"
      ]
    }
  },
  "state": {
    "data": {
      "currentAsyncJob": null,
      "latestProcessedId": "1952955061396750644"
    }
  }
} -->
<!-- 
{
  "name": "test_telegram",
  "status": "INACTIVE",
  "schedule": null,
  "source": {
    "pluginId": "@curatedotfun/telegram-source",
    "config": {
      "secrets": {
        "botToken": "{{TELEGRAM_BOT_TOKEN}}"
      }
    },
    "search": {
      "chatId": "test_curation"
    }
  },
  "pipeline": {
    "steps": [
      {
        "pluginId": "@curatedotfun/simple-transform",
        "config": {
          "variables": {
            "template": "hello {{content}}"
          }
        },
        "stepId": "transform-1"
      },
      {
        "pluginId": "@curatedotfun/object-transform",
        "config": {
          "variables": {
            "mappings": {
              "content": "goodbye {{content}}"
            }
          }
        },
        "stepId": "transform-2"
      },
      {
        "pluginId": "@curatedotfun/simple-transform",
        "config": {
          "variables": {
            "template": "hello {{content}}"
          }
        },
        "stepId": "transform-3"
      }
    ],
    "env": {
      "secrets": [
        "TELEGRAM_BOT_TOKEN"
      ]
    }
  },
  "state": {
    "data": {
      "lastUpdateId": 595245182
    }
  }
} -->