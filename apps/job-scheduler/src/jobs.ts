import type { Workflow } from "@usersdotfun/shared-types/types";

// export const jobs: Workflow[] = [
//   {
//     "name": "open_crosspost",
//     "source": {
//       "pluginId": "@curatedotfun/masa-source",
//       "config": { "apiKey": "{{MASA_API_KEY}}" },
//       "search": "@open_crosspost #feature"
//     },
//     "pipeline": {
//       "id": "test-pipeline",
//       "name": "Simple Transform Pipeline",
//       "env": {
//         "secrets": [
//           "MASA_API_KEY"
//         ]
//       },
//       "steps": [
//         {
//           "config": {
//             "variables": {
//               "template": "hello {{content}}"
//             }
//           },
//           "stepId": "transform-1",
//           "pluginId": "@curatedotfun/simple-transform"
//         },
//         {
//           "config": {
//             "variables": {
//               "mappings": {
//                 "content": "goodbye {{content}}"
//               }
//             }
//           },
//           "stepId": "transform-2",
//           "pluginId": "@curatedotfun/object-transform"
//         },
//         {
//           "config": {
//             "variables": {
//               "template": "hello {{content}}"
//             }
//           },
//           "stepId": "transform-3",
//           "pluginId": "@curatedotfun/simple-transform"
//         }
//       ]
//     }
//   }
// ];



// {
//   "name": "open_crosspost",
//   "source": {
//     "pluginId": "@curatedotfun/masa-source",
//     "config": {
//       "secrets": {
//         "apiKey": "{{MASA_API_KEY}}"
//       }
//     },
//     "search": { 
//       "type": "twitter-scraper",
//       "query": "@open_crosspost #feature",
//       "pageSize": 100
//     }
//   },
//   "pipeline": {
//     "id": "test-pipeline",
//     "name": "Simple Transform Pipeline",
//     "steps": [
//       {
//         "pluginId": "@curatedotfun/simple-transform",
//         "config": {
//           "variables": {
//             "template": "hello {{content}}"
//           }
//         },
//         "stepId": "transform-1"
//       },
//       {
//         "pluginId": "@curatedotfun/object-transform",
//         "config": {
//           "variables": {
//             "mappings": {
//               "content": "goodbye {{content}}"
//             }
//           }
//         },
//         "stepId": "transform-2"
//       },
//       {
//         "pluginId": "@curatedotfun/simple-transform",
//         "config": {
//           "variables": {
//             "template": "hello {{content}}"
//           }
//         },
//         "stepId": "transform-3"
//       }
//     ],
//     "env": {
//       "secrets": [
//         "MASA_API_KEY"
//       ]
//     }
//   }
// }
