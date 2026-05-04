import { defineConfig } from "orval";

export default defineConfig({
  "corneriq-client": {
    input: {
      target: "./openapi.yaml",
    },
    output: {
      mode: "tags-split",
      target: "../api-client-react/src",
      schemas: "../api-zod/src",
      client: "react-query",
      override: {
        mutator: {
          path: "../api-client-react/src/mutator/custom-instance.ts",
          name: "customInstance",
        },
      },
    },
  },
});
