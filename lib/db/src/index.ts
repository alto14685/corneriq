export { db } from "./client";
export * from "./schema/index";
// Re-export drizzle query helpers so consumers only need @workspace/db
export {
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  and,
  or,
  not,
  like,
  ilike,
  inArray,
  notInArray,
  isNull,
  isNotNull,
  sql,
  desc,
  asc,
  max,
  min,
  sum,
  count,
} from "drizzle-orm";
