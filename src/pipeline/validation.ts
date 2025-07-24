import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { Effect } from "effect";
import type { JsonSchema7 } from "effect/JSONSchema";
import { ValidationError } from "./errors";

const ajv = new Ajv2020({
  allErrors: true,
  verbose: true,
});
addFormats(ajv);

export class SchemaValidator {
  static validate(
    schema: JsonSchema7,
    data: Record<string, unknown>,
    context?: string
  ): Effect.Effect<Record<string, unknown>, ValidationError> {
    return Effect.gen(function* () {
      const validate = ajv.compile(schema);
      const valid = validate(data);

      if (!valid) {
        const errors = validate.errors?.map(err => ({
          path: err.instancePath || err.schemaPath,
          message: err.message,
          allowedValues: err.params,
          receivedValue: err.data
        })) || [];

        const errorMessage = JSON.stringify({
          summary: ajv.errorsText(validate.errors),
          details: errors,
        }, null, 2);

        return yield* Effect.fail(new ValidationError({
          message: `${context || 'Unknown'} validation failed: ${ajv.errorsText(validate.errors)}`,
          cause: new Error(errorMessage),
          data: data,
          validationDetails: errorMessage
        }));
      }

      return data;
    });
  }
}
