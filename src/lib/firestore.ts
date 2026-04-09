import { Firestore } from "@google-cloud/firestore";
import { appEnv, isFirestoreConfigured } from "@/lib/env";

let firestore: Firestore | null = null;

export function getFirestore() {
  if (!isFirestoreConfigured()) {
    throw new Error("Firestore is not configured for this environment.");
  }

  if (!firestore) {
    firestore = new Firestore({
      projectId: appEnv.projectId,
      ignoreUndefinedProperties: true,
    });
  }

  return firestore;
}
