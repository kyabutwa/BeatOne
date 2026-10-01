import {
  executeAuthorizedAction,
  type AuthorizedActionCommand,
  type AuthorizedActionResult
} from "./beatcore-operations.js";
import type { PersistenceRepository } from "./beatcore-repository.js";

export type CreateAuthorizedActionCommand = AuthorizedActionCommand;

/**
 * Canonical Action application entry point.
 *
 * The domain operation remains authoritative for authorization, Action creation,
 * lifecycle semantics, Event recording, and atomic local persistence.
 */
export async function createAuthorizedAction(
  repository: PersistenceRepository,
  command: CreateAuthorizedActionCommand
): Promise<AuthorizedActionResult> {
  return executeAuthorizedAction(repository, command);
}
