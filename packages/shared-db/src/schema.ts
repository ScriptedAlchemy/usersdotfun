import * as jobs from "./schema/jobs";
import * as pipelineSteps from "./schema/pipeline-steps";

export const schema = { ...jobs, ...pipelineSteps };

export type DB = typeof schema;

