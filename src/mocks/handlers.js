import { rest } from "msw";

export const handlers = [rest.get("/api/v1/forms", getForms)];

function getForms(req, res, ctx) {
  return res(
    ctx.status(200),
    ctx.json({
      data: {
        schema: {
          type: "object",
          properties: {
            foo: { type: "integer" },
            bar: { type: "string", minLength: 5 },
          },
          required: ["foo"],
          additionalProperties: false,
        },
      },
    })
  );
}
