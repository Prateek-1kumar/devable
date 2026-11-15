import ClientProof from "../ClientProof";
import { CASES } from "./content";

// Client proof on the Search & AI page: see ClientProof.
export default function Cases() {
  return <ClientProof label={CASES.label} title={CASES.title} slots={CASES.slots} cases={CASES.cases} />;
}
