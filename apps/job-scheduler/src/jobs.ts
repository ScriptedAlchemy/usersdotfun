import type { JobDefinition } from '@usersdotfun/shared-types';


export const jobs: JobDefinition[] = [
  {
    "name": "open_crosspost",
    "source": {
      "plugin": "@curatedotfun/masa-source",
      "config": { "apiKey": "{{MASA_API_KEY}}" },
      "search": "@open_crosspost #feature"
    },
    "pipeline": {
      "id": "test-pipeline",
      "name": "Simple Transform Pipeline",
      "env": {
        "secrets": [
          "MASA_API_KEY"
        ]
      },
      "steps": [
        {
          "config": {
            "variables": {
              "template": "hello {{content}}"
            }
          },
          "stepId": "transform-1",
          "pluginName": "@curatedotfun/simple-transform"
        },
        {
          "config": {
            "variables": {
              "mappings": {
                "content": "goodbye {{content}}"
              }
            }
          },
          "stepId": "transform-2",
          "pluginName": "@curatedotfun/object-transform"
        },
        {
          "config": {
            "variables": {
              "template": "hello {{content}}"
            }
          },
          "stepId": "transform-3",
          "pluginName": "@curatedotfun/simple-transform"
        }
      ]
    }
  }
];
