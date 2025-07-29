import type { JobDefinition } from '@usersdotfun/shared-types';


export const jobs: JobDefinition[] = [
  {
    "id": "8e5d8f9b-4cf5-4fb9-b6a3-fce362da6d96",
    "name": "open_crosspost",
    "schedule": "* * * * *",
    "source": {
      "plugin": "@usersdotfun/masa-source",
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
